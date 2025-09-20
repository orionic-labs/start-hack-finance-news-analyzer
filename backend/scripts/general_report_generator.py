"""
Generate a full text body (Markdown) for a financial report from:
- a news article
- a list of influenced customers with portfolios across fixed buckets

Buckets (fixed):
FX (USD, CHF, EUR, JPY), Gold, Global Government Bonds, Global Corporate bonds,
USA Equities, Emerging Markets, EU(incl. UK and CH) Equities, Japan Equities

Usage:
    export OPENAI_API_KEY=sk-...
    python generate_text_report.py
"""
import os, sys, pathlib
sys.path.append(str(pathlib.Path(__file__).resolve().parent))

import os
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass, field
from dotenv import load_dotenv
# You can use either the official OpenAI SDK or LangChain. Keeping it lean:
from openai import OpenAI

from render_report_pdf import render_report_pdf
# -----------------------------
# Data models
# -----------------------------

BUCKETS = [
    "FX (USD, CHF, EUR, JPY)",
    "Gold",
    "Global Government Bonds",
    "Global Corporate bonds",
    "USA Equities",
    "Emerging Markets",
    "EU(incl. UK and CH) Equities",
    "Japan Equities",
]


@dataclass
class Customer:
    name: str
    # portfolio is mapping bucket -> percentage (e.g., {"USA Equities": 30, "Gold": 10, ...})
    portfolio: Dict[str, float] = field(default_factory=dict)
    notes: str = ""  # optional extra context: risk tolerance, horizon, constraints, etc.


# -----------------------------
# Helpers
# -----------------------------

def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def validate_and_normalize_portfolio(portfolio: Dict[str, float]) -> Tuple[Dict[str, float], List[str]]:
    """
    Ensure all required buckets exist; fill missing with 0.
    If sum != 100 (±0.5 tolerance), renormalize proportionally and note it.
    Returns (normalized_portfolio, warnings).
    """
    warnings = []
    filled = {b: float(portfolio.get(b, 0.0)) for b in BUCKETS}

    # Clamp any weird negatives
    for k, v in filled.items():
        if v < 0:
            warnings.append(f"Bucket '{k}' had negative weight {v:.2f} — clamped to 0.")
            filled[k] = 0.0

    s = sum(filled.values())
    if abs(s - 100.0) > 0.5:
        # Renormalize (if all zero, keep all zero)
        if s > 0:
            ratio = 100.0 / s
            for k in filled:
                filled[k] = filled[k] * ratio
            warnings.append(f"Portfolio summed to {s:.2f}%, renormalized to 100%.")
        else:
            # if all zeros, leave zeros but warn
            warnings.append("Portfolio sums to 0%. Left as zeros; please review.")
    else:
        # Minor rounding fix: scale to exactly 100
        if s != 0:
            ratio = 100.0 / s
            for k in filled:
                filled[k] = filled[k] * ratio

    # Round to 2 decimals and ensure final sum = 100 via small adjustment
    rounded = {k: round(v, 2) for k, v in filled.items()}
    diff = round(100.0 - sum(rounded.values()), 2)
    if diff != 0:
        # Put the tiny diff into the largest bucket to keep total = 100
        largest = max(rounded, key=lambda k: rounded[k])
        rounded[largest] = round(rounded[largest] + diff, 2)

    return rounded, warnings


def normalize_customers(customers: List[Customer]) -> Tuple[List[Customer], Dict[str, List[str]]]:
    """
    Normalize all customer portfolios and collect warnings per customer.
    """
    issues: Dict[str, List[str]] = {}
    normed: List[Customer] = []
    for c in customers:
        pnorm, warns = validate_and_normalize_portfolio(c.portfolio)
        normed.append(Customer(name=c.name, portfolio=pnorm, notes=c.notes))
        if warns:
            issues[c.name] = warns
    return normed, issues


# -----------------------------
# LLM prompt & call
# -----------------------------

SYSTEM_PROMPT = """You are a senior sell-side financial analyst.
Write a crisp, professional German report (Markdown). Audience: wealth management clients in DACH.
Be specific, fact-patterned, and pragmatic. Avoid hype. Prefer short paragraphs and bullets.

MUST DO:
- Use section headers as specified.
- Be explicit on: agenda, channels of transmission, time horizon (short/medium/long), and confidence.
- Translate article content into cross-asset implications: FX, Gold, Govvies, Corp bonds, US/EU/EM/JP equities.
- Add a scenario table (Base/Bear/Bull) with triggers and portfolio tilts.
- For EACH client, map portfolio exposures to the article’s risks/opportunities and list concrete actions (hedges, rebalancing %, stop-loss/entry levels where relevant).
- Keep numbers realistic and labeled as estimates when inferred.

TONE:
- German, concise, institutional. No sensationalism.
- If something is an assumption, say “Annahme”.

OUTPUT FORMAT (Markdown, exactly these sections):
# Titel
## Executive Summary
## Artikel-Agenda
## Marktauswirkungen (nach Anlageklasse)
## FX- und Rohstoffsicht
## Regional- & Sektorimpulse
## Szenarien (Base / Bear / Bull)
## Kunden-Impakts & Maßnahmen
## Risiken & Unsicherheiten
## Anhang: Methodik & Annahmen
"""


def build_user_prompt(article: str, customers: List[Customer], normalization_notes: Dict[str, List[str]]) -> str:
    # Format customers & portfolios as a clean table-like text
    def fmt_portfolio(p: Dict[str, float]) -> str:
        lines = [f"- {b}: {p.get(b, 0.0):.2f}%" for b in BUCKETS]
        return "\n".join(lines)

    cust_blocks = []
    for c in customers:
        notes = (c.notes or "").strip()
        warns = normalization_notes.get(c.name, [])
        warn_block = ""
        if warns:
            warn_block = "\n**Normalisierungshinweise:**\n" + "\n".join([f"- {w}" for w in warns])
        cust_blocks.append(
            f"### {c.name}\n"
            f"**Portfolio:**\n{fmt_portfolio(c.portfolio)}\n"
            f"{('**Hinweise:** ' + notes) if notes else ''}\n"
            f"{warn_block}".strip()
        )

    cust_blob = "\n\n".join(cust_blocks) if cust_blocks else "_Keine Kunden übermittelt._"

    # The user prompt contains both article and customer data
    return f"""\
**Artikel (Rohtext):**
{article.strip()}

**Kunden & Portfolios (nach Vorgabe-Buckets):**
{cust_blob}

**Bucket-Definitionen (fix):**
- FX (USD, CHF, EUR, JPY)
- Gold
- Global Government Bonds
- Global Corporate bonds
- USA Equities
- Emerging Markets
- EU(incl. UK and CH) Equities
- Japan Equities

Bitte schreibe den vollständigen Bericht gemäß den Formatvorgaben.
"""

load_dotenv()
def call_llm(article: str, customers: List[Customer], model: str = "gpt-4o-mini", temperature: float = 0.2) -> str:
    """
    Calls the OpenAI chat model and returns the Markdown report text.
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    # Normalize portfolios first
    norm_customers, notes = normalize_customers(customers)
    user_prompt = build_user_prompt(article, norm_customers, notes)

    resp = client.chat.completions.create(
        model=model,
        temperature=temperature,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    return resp.choices[0].message.content


# -----------------------------
# Example main
# -----------------------------

if __name__ == "__main__":
    # Example article (replace with your ingestion)
    article_text = """ Five of seven mineral prospecting licences (MPLs) granted in Northern Ireland earlier this year have been relinquished, meaning prospecting under those licences will be paused for at least three months. An MPL grants the holder permission to carry out activities like surveys and test drilling in a specific area. It covers minerals like copper and zinc, but not gold and silver as these belong to the Crown Estate. The seven licences were granted to four companies, including Dalradian Gold, in May. The four companies cover areas in at least three counties – Fermanagh, Tyrone and Armagh. The announcement from the Department for the Economy (DfE) comes as a deadline to lodge papers for any legal challenge is set to expire. Campaigners from the Save Our Sperrins group lodged an application for leave to apply for a judicial review of the decision to grant the seven licences ahead of Friday's 17:00 BST deadline. A statement from the department added that it had been instructed by minister Caoimhe Archibald to write to the court to confirm it would not oppose the granting of leave for a judicial review if papers were lodged. And she has also instructed "to advise the objectors and the court that it will write in support of any application to quash the remaining two licences". The applications may be resubmitted, followed by a 12-week consultation period. While the seven licences were granted in May, a public notice of the intention to grant them was not published in the Belfast Gazette, as required by law. The Belfast Gazette is an official journal of record where statutory notices are published, as well as the King's honours lists. DfE previously said the notices were passed to the Gazette but were not published. The four companies – Dalradian Gold, Conroy Gold, Karelian Diamond Resources, and Flintridge Resources – were then asked to relinquish the licences, which they agreed to do. DfE is awaiting confirmation from the holder for the remaining two licences. The licences would allow holders to prospect for minerals, excluding gold and silver. It could lead to full-time mining operations at a later date. """
    # Example customers (replace with your data)
    customers_in = [
        Customer(
            name="Musterkunde AG",
            portfolio={
                "USA Equities": 35,
                "EU(incl. UK and CH) Equities": 20,
                "Emerging Markets": 5,
                "Japan Equities": 5,
                "Global Government Bonds": 15,
                "Global Corporate bonds": 10,
                "Gold": 7,
                "FX (USD, CHF, EUR, JPY)": 5,
            },
            notes="Risikotoleranz: mittel. Liquiditätsbedarf gering. Anlagehorizont 3–5 Jahre."
        ),
        Customer(
            name="Family Office Schmidt",
            portfolio={
                "USA Equities": 25,
                "EU(incl. UK and CH) Equities": 15,
                "Emerging Markets": 10,
                "Japan Equities": 10,
                "Global Government Bonds": 20,
                "Global Corporate bonds": 10,
                "Gold": 5,
                "FX (USD, CHF, EUR, JPY)": 2,
                # Intentionally sums to 97% -> will be normalized to 100%
            },
            notes="Risikotoleranz: niedrig-mittel. Fokus auf Kapitalschutz, ESG-Präferenz."
        ),
    ]

    md_report = call_llm(article_text, customers_in, model="gpt-4o-mini", temperature=0.25)
    print("\n" + "=" * 80 + "\nGENERATED REPORT (Markdown)\n" + "=" * 80 + "\n")
    print(md_report)
    
