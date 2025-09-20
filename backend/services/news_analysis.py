# services/news_analysis.py
from __future__ import annotations
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from services.event_taxonomy import EVENT_TYPES


# ---------- Models ----------
class ExtractedFacts(BaseModel):
    event_type: str = Field(..., description="One of " + ", ".join(EVENT_TYPES))
    tickers: List[str] = []
    companies: List[str] = []
    sectors: List[str] = []
    geos: List[str] = []
    numerics: Dict[str, Any] = {}


class ImpactSignals(BaseModel):
    impact_score: int = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=1)
    novelty: float = Field(..., ge=0, le=1)
    rationale: str


class AnalystPacket(BaseModel):
    executive_summary: str
    bullets: List[str]
    actions: List[str] = []
    risks: List[str] = []
    citations: List[Dict[str, Any]]


class NewsAnalysis(BaseModel):
    extracted: ExtractedFacts
    impact: ImpactSignals
    packet: AnalystPacket


# ---------- LLMs ----------
_extractor = ChatOpenAI(model="gpt-4o", temperature=0)
_scorer = ChatOpenAI(model="gpt-4o", temperature=0)
_writer = ChatOpenAI(model="gpt-4o", temperature=0)

# ---------- Prompts ----------
extract_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
Extract market-relevant facts from the following articles.
Return ONLY JSON with keys: event_type, tickers, companies, sectors, geos, numerics.

Rules:
- event_type must be one of: {event_types}.
- Tickers are uppercase (e.g., AAPL). If none, [].
- Do not invent numbers; only include explicit values you see.
- Use only the provided texts.

ARTICLES:
{articles_block}
""".strip(),
        )
    ]
)

score_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
Given extracted facts and metadata, score:
- impact_score (0-100): how market-moving for CIOs today
- confidence (0..1): certainty in the facts
- novelty (0..1): how new vs. prior coverage
Return ONLY JSON with keys: impact_score, confidence, novelty, rationale (2-3 lines).

Consider: recency, event type weight, numeric magnitudes, breadth of affected assets,
source credibility, and cross-source consistency.
""".strip(),
        )
    ]
)

write_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
Write an analyst-ready brief in the W&P tone.

Style guide:
{style_guide}

Use these short reference snippets (if any) as guidance for tone/phrasing:
{rag_snippets}

Return ONLY JSON with:
- executive_summary: 2-3 sentences, neutral, under 350 chars
- bullets: 3-6 bullets (what happened, why it matters, key numbers)
- actions: 0-3 careful ideas for human review (e.g., "consider reviewing exposure to ...")
- risks: 1-3 caveats or uncertainties
- citations: list of {url,title,published_at} for the sources we passed

Do not invent numbers or tickers not present in extracts.
Keep total under 900 characters.
""".strip(),
        )
    ]
)


# ---------- Chains ----------
def _extract(articles_block: str) -> ExtractedFacts:
    chain = extract_prompt | _extractor.with_structured_output(ExtractedFacts)
    return chain.invoke({"articles_block": articles_block, "event_types": ", ".join(EVENT_TYPES)})


def _score(meta: Dict[str, Any], extracted: ExtractedFacts) -> ImpactSignals:
    chain = score_prompt | _scorer.with_structured_output(ImpactSignals)
    return chain.invoke({"meta": meta, "extracted": extracted.model_dump()})


def _write(
    style_guide: str,
    rag_snippets: str,
    extracted: ExtractedFacts,
    impact: ImpactSignals,
    citations: List[Dict[str, Any]],
) -> AnalystPacket:
    chain = write_prompt | _writer.with_structured_output(AnalystPacket)
    return chain.invoke(
        {
            "style_guide": style_guide,
            "rag_snippets": rag_snippets,
            "extracted": extracted.model_dump(),
            "impact": impact.model_dump(),
            "citations": citations,
        }
    )


# ---------- Deterministic blend ----------
EVENT_WEIGHTS = {
    "EARNINGS": 0.9,
    "GUIDANCE": 0.85,
    "RATING_CHANGE": 0.6,
    "CEO_EXIT": 0.75,
    "M&A": 0.9,
    "MACRO_POLICY": 0.95,
    "REGULATORY": 0.8,
    "GEOPOLITICAL": 0.9,
    "SUPPLY_CHAIN": 0.6,
    "LEGAL": 0.55,
    "PRODUCT": 0.5,
    "MARKET_MOVE": 0.7,
    "OTHER": 0.3,
}


def deterministic_score(meta: Dict[str, Any], extracted: ExtractedFacts) -> float:
    # 0..1 recency score (<= 6h best)
    rh = meta.get("recency_hours")
    recency = 1.0 if rh is None else max(0.0, min(1.0, (6.0 - float(rh)) / 6.0))
    w_type = EVENT_WEIGHTS.get(extracted.event_type, 0.3)
    has_nums = 1.0 if extracted.numerics else 0.6
    breadth = min(1.0, max(len(extracted.tickers), len(extracted.sectors)) / 5.0)
    # simple blend
    return 0.4 * recency + 0.35 * w_type + 0.15 * has_nums + 0.10 * breadth


def blend_scores(llm_score: int, det_score: float) -> int:
    # map 0..1 det_score to 0..100, blend 60% LLM, 40% deterministic
    det_scaled = int(round(100 * det_score))
    return int(round(0.6 * llm_score + 0.4 * det_scaled))


# ---------- Orchestrator ----------
def analyze_news(
    primary_article: Dict[str, Any],
    related_articles: List[Dict[str, Any]],
    style_guide: str,
    rag_snippets: str,
) -> NewsAnalysis:
    def pack(a):
        ts = a.get("published_at")
        return f"- {a.get('title','').strip()} [{a.get('source_domain','')} ; {ts}]\n  {a.get('summary','').strip()}"

    articles_block = "\n".join([pack(primary_article)] + [pack(x) for x in related_articles])

    extracted = _extract(articles_block)

    now = datetime.now(timezone.utc)
    recency_hours = None
    if primary_article.get("published_at"):
        dt = primary_article["published_at"]
        if dt and dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        if dt:
            recency_hours = max(0.0, (now - dt).total_seconds() / 3600.0)

    meta = {
        "recency_hours": recency_hours,
        "source_domain": primary_article.get("source_domain"),
        "n_related": len(related_articles),
    }
    impact_llm = _score(meta, extracted)
    det = deterministic_score(meta, extracted)
    impact_blended = ImpactSignals(
        impact_score=blend_scores(impact_llm.impact_score, det),
        confidence=impact_llm.confidence,
        novelty=impact_llm.novelty,
        rationale=impact_llm.rationale,
    )

    cites = [
        {
            "url": primary_article.get("url"),
            "title": primary_article.get("title"),
            "published_at": str(primary_article.get("published_at")),
        }
    ] + [
        {"url": x.get("url"), "title": x.get("title"), "published_at": str(x.get("published_at"))}
        for x in related_articles
    ]

    packet = _write(style_guide, rag_snippets, extracted, impact_blended, cites)
    return NewsAnalysis(extracted=extracted, impact=impact_blended, packet=packet)
