"""
TradingAgents FastAPI Microservice — Fast Mode
==============================================
Uses NVIDIA NIM via OpenAI-compatible endpoint.

Fast Mode Pipeline:
  1. Technical Analyst  -> reads FinnHub data
  2. Trader Agent       -> makes BUY/SELL/HOLD decision
  3. Risk Manager       -> validates against risk profile

Run: python main.py  (or use start.bat)
"""

import os
import json
import re
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="TradingAgents Microservice",
    description="Fast-mode multi-agent trading analysis powered by NVIDIA NIM",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ──────────────────────────────────────────────────────────────────

NVIDIA_API_KEY  = os.environ["NVIDIA_API_KEY"]
NVIDIA_BASE_URL = os.environ.get("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_MODEL    = os.environ.get("NVIDIA_MODEL", "nvidia/nemotron-3-nano-30b-a3b")
FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY", "")

# ─── Models ──────────────────────────────────────────────────────────────────

class AnalysisRequest(BaseModel):
    ticker: str
    date: Optional[str] = None
    risk_tolerance: Optional[str] = "MEDIUM"

class AnalysisResponse(BaseModel):
    ticker: str
    date: str
    decision: str
    conviction: str
    rationale: str
    technical_summary: dict
    trader_analysis: dict
    risk_assessment: dict
    pipeline_ms: int

# ─── LLM Client ──────────────────────────────────────────────────────────────

async def llm_call(system_prompt: str, user_message: str, max_tokens: int = 700, attempt: int = 1) -> str:
    """Call NVIDIA NIM. Retries once with shorter context if content is None."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            f"{NVIDIA_BASE_URL}/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {NVIDIA_API_KEY}",
            },
            json={
                "model": NVIDIA_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_message},
                ],
                "max_tokens": max_tokens,
                "temperature": 0.3,
                "top_p": 0.9,
            },
        )
        res.raise_for_status()
        data = res.json()

        # Bulletproof extraction
        choices = data.get("choices") or []
        content = None
        if choices:
            msg = choices[0].get("message")
            if isinstance(msg, dict):
                content = msg.get("content")

        if not content:
            fr = choices[0].get("finish_reason") if choices else "N/A"
            logger.warning(f"[LLM] Empty content (attempt={attempt}, finish_reason={fr})")
            if attempt == 1:
                shorter = user_message[:max(len(user_message) // 2, 150)]
                return await llm_call(system_prompt, shorter, max_tokens, attempt=2)
            return "{}"   # give up, caller will use defaults

        return content


def parse_json(raw: str) -> dict:
    """Parse JSON from LLM response, stripping markdown fences if present."""
    if not raw or raw.strip() == "{}":
        return {}
    clean = raw.strip()
    # Strip ```json ... ``` fences
    if clean.startswith("```"):
        lines = clean.splitlines()
        clean = "\n".join(lines[1:-1]) if len(lines) > 2 else clean
    # Direct parse
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        pass
    # Regex extract first {...} block
    m = re.search(r"\{[\s\S]*\}", clean)
    if m:
        try:
            return json.loads(m.group())
        except json.JSONDecodeError:
            pass
    logger.warning(f"[LLM] JSON parse failed: {clean[:120]}")
    return {}

# ─── FinnHub Data ────────────────────────────────────────────────────────────

async def finnhub_get(path: str, params: dict) -> dict | list:
    if not FINNHUB_API_KEY:
        return {}
    params["token"] = FINNHUB_API_KEY
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(f"https://finnhub.io/api/v1{path}", params=params)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            logger.warning(f"FinnHub {path} failed: {e}")
            return {} if path != "/company-news" else []

async def fetch_market_data(ticker: str, date: str) -> dict:
    """Fetch quote, profile, news and recommendations in parallel."""
    end = datetime.strptime(date, "%Y-%m-%d")
    start = end - timedelta(days=7)
    quote, profile, news, recs = await asyncio.gather(
        finnhub_get("/quote", {"symbol": ticker}),
        finnhub_get("/stock/profile2", {"symbol": ticker}),
        finnhub_get("/company-news", {"symbol": ticker, "from": start.strftime("%Y-%m-%d"), "to": date}),
        finnhub_get("/stock/recommendation", {"symbol": ticker}),
        return_exceptions=True,
    )
    return {
        "date": date,
        "quote":           quote if isinstance(quote, dict) else {},
        "profile":         profile if isinstance(profile, dict) else {},
        "news":            [{"headline": n.get("headline", ""), "summary": n.get("summary", "")[:150]} for n in (news if isinstance(news, list) else [])[:5]],
        "recommendations": (recs if isinstance(recs, list) else [])[:3],
    }

# ─── Agent 1: Technical Analyst ──────────────────────────────────────────────

TA_SYSTEM = """You are a Technical Analyst AI in a trading firm.
Return ONLY a JSON object (no markdown, no text outside JSON):
{"ticker":"","trend":"UPTREND","momentum":"NEUTRAL","support_level":"","resistance_level":"","rsi_signal":"NEUTRAL","macd_signal":"NEUTRAL","short_term_outlook":"NEUTRAL","price_target_7d":"","confidence":"MEDIUM","summary":""}
Valid: trend=UPTREND|DOWNTREND|SIDEWAYS, momentum=STRONG_BULLISH|BULLISH|NEUTRAL|BEARISH|STRONG_BEARISH, rsi_signal=OVERSOLD|NEUTRAL|OVERBOUGHT, macd_signal=BULLISH_CROSS|NEUTRAL|BEARISH_CROSS, short_term_outlook=BULLISH|NEUTRAL|BEARISH, confidence=LOW|MEDIUM|HIGH."""

async def run_technical_analyst(ticker: str, md: dict) -> dict:
    q = md.get("quote", {})
    p = md.get("profile", {})
    news_headlines = [n["headline"] for n in md.get("news", [])[:3]]
    recs = md.get("recommendations", [])[:2]

    user_msg = (
        f"Ticker: {ticker} | Date: {md.get('date')}\n"
        f"Price={q.get('c','?')} Open={q.get('o','?')} High={q.get('h','?')} Low={q.get('l','?')} PrevClose={q.get('pc','?')} Change%={q.get('dp','?')}\n"
        f"Company: {p.get('name', ticker)} | Industry: {p.get('finnhubIndustry','?')} | MarketCap: {p.get('marketCapitalization','?')}M\n"
        f"AnalystRecs: {json.dumps(recs)}\n"
        f"RecentNews: {json.dumps(news_headlines)}\n"
        "Return the technical analysis JSON."
    )
    raw = await llm_call(TA_SYSTEM, user_msg, max_tokens=500)
    result = parse_json(raw)
    result.setdefault("ticker", ticker)
    result.setdefault("trend", "SIDEWAYS")
    result.setdefault("momentum", "NEUTRAL")
    result.setdefault("rsi_signal", "NEUTRAL")
    result.setdefault("macd_signal", "NEUTRAL")
    result.setdefault("short_term_outlook", "NEUTRAL")
    result.setdefault("confidence", "LOW")
    result.setdefault("summary", f"Technical analysis for {ticker} based on available data.")
    return result

# ─── Agent 2: Trader ─────────────────────────────────────────────────────────

TR_SYSTEM = """You are the Trader Agent in a professional trading firm.
Based on the technical analysis provided, make a BUY/SELL/HOLD decision.
Return ONLY a JSON object (no markdown, no text outside JSON):
{"decision":"HOLD","conviction":"MEDIUM","entry_strategy":"","exit_strategy":"","stop_loss":"","time_horizon":"SHORT_TERM","key_catalysts":[],"risks":[],"rationale":"","confidence_score":50}
Valid: decision=BUY|SELL|HOLD, conviction=LOW|MEDIUM|HIGH, time_horizon=SHORT_TERM|MEDIUM_TERM."""

async def run_trader(ticker: str, ta: dict) -> dict:
    signals = {
        "ticker":             ta.get("ticker", ticker),
        "trend":              ta.get("trend"),
        "momentum":           ta.get("momentum"),
        "rsi_signal":         ta.get("rsi_signal"),
        "macd_signal":        ta.get("macd_signal"),
        "short_term_outlook": ta.get("short_term_outlook"),
        "support_level":      ta.get("support_level"),
        "resistance_level":   ta.get("resistance_level"),
        "confidence":         ta.get("confidence"),
        "summary":            ta.get("summary"),
    }
    user_msg = (
        f"Make a trading decision for {ticker}.\n"
        f"Technical signals: {json.dumps(signals)}\n"
        "Return the trader decision JSON."
    )
    raw = await llm_call(TR_SYSTEM, user_msg, max_tokens=500)
    result = parse_json(raw)
    result.setdefault("decision", "HOLD")
    result.setdefault("conviction", "LOW")
    result.setdefault("time_horizon", "SHORT_TERM")
    result.setdefault("rationale", f"Based on {ta.get('trend','N/A')} trend and {ta.get('momentum','N/A')} momentum for {ticker}.")
    result.setdefault("confidence_score", 40)
    result.setdefault("key_catalysts", [])
    result.setdefault("risks", [])
    return result

# ─── Agent 3: Risk Manager ────────────────────────────────────────────────────

RM_SYSTEM = """You are the Risk Manager in a professional trading firm.
Validate the trading decision against the user's risk profile. APPROVE, MODIFY, or REJECT.
Return ONLY a JSON object (no markdown, no text outside JSON):
{"verdict":"APPROVED","final_decision":"HOLD","position_size_guidance":"NORMAL","risk_level":"MEDIUM","max_loss_tolerance":"5%","portfolio_impact":"","risk_factors":[],"mitigation_steps":[],"summary":""}
Valid: verdict=APPROVED|MODIFIED|REJECTED, final_decision=BUY|SELL|HOLD, position_size_guidance=SMALL|NORMAL|LARGE, risk_level=LOW|MEDIUM|HIGH|CRITICAL."""

async def run_risk_manager(ticker: str, ta: dict, trader: dict, risk_tolerance: str) -> dict:
    user_msg = (
        f"Validate trade for {ticker}. User risk tolerance: {risk_tolerance}.\n"
        f"Trader: decision={trader.get('decision')} conviction={trader.get('conviction')} "
        f"rationale={str(trader.get('rationale',''))[:200]}\n"
        f"Technical: trend={ta.get('trend')} momentum={ta.get('momentum')} outlook={ta.get('short_term_outlook')}\n"
        "Return the risk assessment JSON."
    )
    raw = await llm_call(RM_SYSTEM, user_msg, max_tokens=500)
    result = parse_json(raw)
    decision = trader.get("decision", "HOLD")
    result.setdefault("verdict", "APPROVED")
    result.setdefault("final_decision", decision)
    result.setdefault("position_size_guidance", "NORMAL")
    result.setdefault("risk_level", "MEDIUM")
    result.setdefault("risk_factors", [])
    result.setdefault("mitigation_steps", [])
    result.setdefault("summary", f"Risk assessment complete for {ticker}. Final decision: {decision}.")
    return result

# ─── Main Endpoint ────────────────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(req: AnalysisRequest):
    """
    Fast-mode pipeline: Technical Analyst -> Trader -> Risk Manager
    """
    ticker = req.ticker.upper().strip()
    date   = req.date or datetime.now().strftime("%Y-%m-%d")
    risk   = (req.risk_tolerance or "MEDIUM").upper()

    logger.info(f"[Pipeline] START {ticker} | {date} | risk={risk}")
    t0 = datetime.now()

    # Step 0: Fetch market data
    md = await fetch_market_data(ticker, date)
    logger.info(f"[Pipeline] Market data fetched: price={md['quote'].get('c','?')}")

    # Step 1: Technical Analyst
    try:
        ta = await run_technical_analyst(ticker, md)
        logger.info(f"[Agent 1] trend={ta.get('trend')} outlook={ta.get('short_term_outlook')}")
    except Exception as e:
        logger.error(f"[Agent 1] FAILED: {e}")
        raise HTTPException(500, detail=f"Technical Analyst failed: {e}")

    # Step 2: Trader
    try:
        trader = await run_trader(ticker, ta)
        logger.info(f"[Agent 2] decision={trader.get('decision')} conviction={trader.get('conviction')}")
    except Exception as e:
        logger.error(f"[Agent 2] FAILED: {e}")
        raise HTTPException(500, detail=f"Trader Agent failed: {e}")

    # Step 3: Risk Manager
    try:
        risk_result = await run_risk_manager(ticker, ta, trader, risk)
        logger.info(f"[Agent 3] verdict={risk_result.get('verdict')} final={risk_result.get('final_decision')}")
    except Exception as e:
        logger.error(f"[Agent 3] FAILED: {e}")
        raise HTTPException(500, detail=f"Risk Manager failed: {e}")

    elapsed = int((datetime.now() - t0).total_seconds() * 1000)
    final_decision = risk_result.get("final_decision") or trader.get("decision", "HOLD")
    conviction     = trader.get("conviction", "MEDIUM")
    rationale      = (
        f"[Technical] {ta.get('summary', '')} "
        f"[Trader] {trader.get('rationale', '')} "
        f"[Risk] {risk_result.get('summary', '')}"
    ).strip()

    logger.info(f"[Pipeline] DONE {ticker}: {final_decision} ({conviction}) in {elapsed}ms")

    return AnalysisResponse(
        ticker=ticker,
        date=date,
        decision=final_decision,
        conviction=conviction,
        rationale=rationale,
        technical_summary=ta,
        trader_analysis=trader,
        risk_assessment=risk_result,
        pipeline_ms=elapsed,
    )


@app.get("/health")
async def health():
    return {"status": "ok", "model": NVIDIA_MODEL, "mode": "fast"}


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting TradingAgents server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
