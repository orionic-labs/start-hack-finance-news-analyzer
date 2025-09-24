# services/news_analysis.py
from __future__ import annotations
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from backend.services.event_taxonomy import EVENT_TYPES

PORTFOLIO_MARKETS = {
    "fx_usd": "FX USD",
    "fx_chf": "FX CHF",
    "fx_eur": "FX EUR",
    "fx_jpy": "FX JPY",
    "gold": "Gold",
    "global_gov_bonds": "Global Government Bonds",
    "global_corp_bonds": "Global Corporate Bonds",
    "usa_equities": "USA Equities",
    "emerging_markets": "Emerging Markets",
    "eu_equities": "EU (incl. UK and CH) Equities",
    "japan_equities": "Japan Equities",
}
MARKET_KEYS = list(PORTFOLIO_MARKETS.keys())


# ---------- Models ----------
class ExtractedFacts(BaseModel):
    event_type: str = Field(..., description="One of " + ", ".join(EVENT_TYPES))
    tickers: List[str] = []
    companies: List[str] = []
    sectors: List[str] = []
    geos: List[str] = []
    numerics: Dict[str, Any] = {}
    markets: List[str] = []


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


class Importance(BaseModel):
    importance: bool


class NewsAnalysis(BaseModel):
    extracted: ExtractedFacts
    impact: ImpactSignals
    importance: Importance
    packet: AnalystPacket


# ---------- LLMs ----------
# Adjusted temperature for each task: low for extraction, higher for analysis/writing.
_extractor = ChatOpenAI(model="gpt-4o", temperature=0.1)
_scorer = ChatOpenAI(model="gpt-4o", temperature=0.4)
_writer = ChatOpenAI(model="gpt-4o", temperature=0.5)

# ---------- Prompts ----------
extract_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are an expert financial analyst. Your task is to extract key, market-relevant facts from the provided news articles with extreme precision.

Return ONLY a single JSON object with the following keys: event_type, tickers, companies, sectors, geos, numerics, markets.

**Extraction Rules:**
- **event_type**: Classify the primary news event. Must be one of: {event_types}.
- **tickers**: Extract or infer all valid stock tickers (e.g., AAPL, GOOG). If none are found, return [].
- **companies**: Extract all explicitly named companies. If none, return [].
- **sectors**: Extract or infer relevant market sectors (e.g., "Technology", "Healthcare"). If none, return [].
- **geos**: Extract or infer countries or regions central to the story (e.g., "U.S.", "Europe"). If none, return [].
- **numerics**: Extract key financial figures. The key should be a descriptive snake_case label (e.g., "revenue_growth_yoy", "eps_beat_usd"). Example: {{"revenue_growth_yoy": 0.12, "eps_beat_usd": 0.05}}.
- **markets**: Identify which portfolio markets are directly affected. If no markets match - return []. Choose conservatively from this fixed set (return the KEYS, not labels): {market_keys}.
- **Accuracy is critical**: Do not invent data. Only extract values supported by the text.

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
You are a seasoned investment strategist providing a rapid assessment of news for a Chief Investment Officer.
Based on the extracted facts and metadata, provide a quantitative and qualitative analysis.
Return ONLY a single JSON object with keys: impact_score, confidence, novelty, rationale.

**Scoring Guidelines:**
- **impact_score (0-100)**: How market-moving is this news for institutional investors today?
    - 0-20: Trivial, background noise.
    - 21-40: Minor relevance, affects a single stock or is a minor update.
    - 41-60: Moderate, affects a sector or a well-known company.
    - 61-80: High, significant market-wide or large-cap company implications.
    - 81-100: Critical, a major market-moving event (e.g., Fed pivot, major M&A).
- **confidence (0.0-1.0)**: Your certainty in the accuracy and clarity of the extracted facts. 1.0 means high confidence from a credible source.
- **novelty (0.0-1.0)**: How new is this information? 1.0 means this is the first time this event/data has been reported. 0.0 means it is a rehash of widely known information.
- **rationale (2-3 sentences)**: Briefly explain your scores, focusing on the "so what" for investors.

**Factors to Consider:**
- **Source Credibility**: Is this a primary source (e.g., press release) or a major news outlet?
- **Magnitude**: How significant are the reported numbers (e.g., percentage change, dollar amounts)?
- **Breadth**: Does it affect a single company, a sector, or the entire market?
- **Recency**: How old is the news?

METADATA & FACTS:
{meta}
{extracted}
""".strip(),
        )
    ]
)

write_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are a senior analyst at a top-tier investment firm, writing a brief for the morning meeting. Your tone should be objective, concise, and forward-looking, avoiding hype or speculation.

Reference the provided style guide and any RAG snippets for tone. Your task is to synthesize the extracted facts and impact scores into a polished, analyst-ready brief.

Return ONLY a single JSON object with the specified keys.

**Output Structure & Content Guidelines:**
- **executive_summary**: 2-3 sentences. Start with the most important fact. Clearly state what happened and its immediate implication for investors. Max 350 characters.
- **bullets**: 3-5 bullet points. Each should be a complete, quantitative sentence. Focus on what happened, why it matters, and key data points.
- **actions**: 0-3 **potential** action items for review by a portfolio manager. These must be phrased as considerations, not direct advice (e.g., "Consider reviewing exposure to X," not "Buy/Sell X").
- **risks**: 1-3 key uncertainties or potential negative outcomes related to the news. What could go wrong or what is still unknown?
- **citations**: A list of {{url, title, published_at}} for all source articles provided.

**Crucial Rules:**
- Synthesize, do not just repeat the input.
- Do not invent numbers or tickers not present in the provided facts.
- Adhere strictly to the total character limit of 900 characters for the entire brief.

Style guide:
{style_guide}

Reference snippets:
{rag_snippets}

Extracted Facts:
{extracted}

Impact Analysis:
{impact}

Source Citations:
{citations}
""".strip(),
        )
    ]
)


# ---------- Chains ----------
def _extract(articles_block: str) -> ExtractedFacts:
    chain = extract_prompt | _extractor.with_structured_output(
        ExtractedFacts, method="function_calling"
    )
    return chain.invoke(
        {
            "articles_block": articles_block,
            "event_types": ", ".join(EVENT_TYPES),
            "market_keys": ", ".join(MARKET_KEYS),
        }
    )


def _score(meta: Dict[str, Any], extracted: ExtractedFacts) -> ImpactSignals:
    chain = score_prompt | _scorer.with_structured_output(
        ImpactSignals, method="function_calling"
    )
    return chain.invoke({"meta": meta, "extracted": extracted.model_dump()})


def _write(
    style_guide: str,
    rag_snippets: str,
    extracted: ExtractedFacts,
    impact: ImpactSignals,
    citations: List[Dict[str, Any]],
) -> AnalystPacket:
    chain = write_prompt | _writer.with_structured_output(
        AnalystPacket, method="function_calling"
    )
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

    articles_block = "\n".join(
        [pack(primary_article)] + [pack(x) for x in related_articles]
    )

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

    importance = Importance(importance=impact_blended.impact_score >= 60)

    cites = [
        {
            "url": primary_article.get("url"),
            "title": primary_article.get("title"),
            "published_at": str(primary_article.get("published_at")),
        }
    ] + [
        {
            "url": x.get("url"),
            "title": x.get("title"),
            "published_at": str(x.get("published_at")),
        }
        for x in related_articles
    ]

    packet = _write(style_guide, rag_snippets, extracted, impact_blended, cites)
    return NewsAnalysis(
        extracted=extracted, impact=impact_blended, packet=packet, importance=importance
    )
