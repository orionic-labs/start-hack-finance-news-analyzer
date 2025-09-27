# api/kpis.py
from quart import Blueprint, jsonify
from sqlalchemy import text
from backend.db.session import SessionLocal

bp = Blueprint("kpis", __name__)


@bp.get("/kpis/overview")
async def kpis_overview():
    """
    Returns KPI metrics for the dashboard.

    {
      "total_news_today": { "count": int, "yesterday": int, "delta_pct_vs_yesterday": float },
      "active_markets":  { "count": int },
      "client_alerts":   { "count": int },
      "important_news":  { "count": int, "yesterday": int, "delta_pct_vs_yesterday": float }
    }
    """
    try:
        async with SessionLocal() as session:
            # Total News (today vs yesterday) by articles.fetched_at
            q_news = text(
                """
                WITH t AS (
                  SELECT COUNT(*) AS c
                  FROM articles
                  WHERE fetched_at >= CURRENT_DATE
                    AND fetched_at <  CURRENT_DATE + INTERVAL '1 day'
                ),
                y AS (
                  SELECT COUNT(*) AS c
                  FROM articles
                  WHERE fetched_at >= CURRENT_DATE - INTERVAL '1 day'
                    AND fetched_at <  CURRENT_DATE
                )
                SELECT (SELECT c FROM t) AS today, (SELECT c FROM y) AS yesterday
            """
            )
            row_news = (await session.execute(q_news)).mappings().first()
            news_today = int(row_news["today"] or 0)
            news_yest = int(row_news["yesterday"] or 0)
            news_delta_pct = (
                100.0
                if (news_yest == 0 and news_today > 0)
                else (
                    round((news_today - news_yest) * 100.0 / news_yest, 2)
                    if news_yest
                    else 0.0
                )
            )

            # Active markets (distinct UNNEST over TEXT[]), join present but not needed for counting
            q_markets = text(
                """
                SELECT COUNT(DISTINCT m) AS cnt
                FROM (
                  SELECT UNNEST(aa.markets) AS m
                  FROM article_analysis aa
                  JOIN articles a ON a.url = aa.article_url
                ) s
                WHERE m IS NOT NULL AND m <> ''
            """
            )
            active_markets = int((await session.execute(q_markets)).scalar() or 0)

            # Important News (today vs yesterday) by articles.fetched_at + aa.important = true
            q_important_ty = text(
                """
                WITH t AS (
                  SELECT COUNT(*) AS c
                  FROM article_analysis aa
                  JOIN articles a ON a.url = aa.article_url
                  WHERE aa.important = TRUE
                    AND a.fetched_at >= CURRENT_DATE
                    AND a.fetched_at <  CURRENT_DATE + INTERVAL '1 day'
                ),
                y AS (
                  SELECT COUNT(*) AS c
                  FROM article_analysis aa
                  JOIN articles a ON a.url = aa.article_url
                  WHERE aa.important = TRUE
                    AND a.fetched_at >= CURRENT_DATE - INTERVAL '1 day'
                    AND a.fetched_at <  CURRENT_DATE
                )
                SELECT (SELECT c FROM t) AS today, (SELECT c FROM y) AS yesterday
            """
            )
            row_imp = (await session.execute(q_important_ty)).mappings().first()
            imp_today = int(row_imp["today"] or 0)
            imp_yest = int(row_imp["yesterday"] or 0)
            imp_delta_pct = (
                100.0
                if (imp_yest == 0 and imp_today > 0)
                else (
                    round((imp_today - imp_yest) * 100.0 / imp_yest, 2)
                    if imp_yest
                    else 0.0
                )
            )

            # Client Alerts (still hardcoded)
            client_alerts = 34

            return jsonify(
                {
                    "total_news_today": {
                        "count": news_today,
                        "yesterday": news_yest,
                        "delta_pct_vs_yesterday": news_delta_pct,
                    },
                    "active_markets": {"count": active_markets},
                    "client_alerts": {"count": client_alerts},
                    "important_news": {
                        "count": imp_today,
                        "yesterday": imp_yest,
                        "delta_pct_vs_yesterday": imp_delta_pct,
                    },
                }
            )
    except Exception as e:
        print(f"Error fetching KPIs: {e}")
        return jsonify({"error": "Failed to fetch KPIs"}), 500
