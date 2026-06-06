/**
 * Intent Classifier
 * Keyword-based detection — zero latency, no API call.
 * Maps user messages to the correct specialist agent.
 */

export type AgentIntent =
  | 'DEEP_TRADING_ANALYSIS'
  | 'PORTFOLIO_ANALYSIS'
  | 'RISK_ASSESSMENT'
  | 'MARKET_SENTIMENT'
  | 'FORECAST'
  | 'SCREENER'
  | 'RECOMMENDATION'
  | 'GENERAL';

/**
 * Detects which specialist agent should be invoked based on the user's message.
 * Falls back to 'GENERAL' (pure chat, no specialist needed).
 */
export function detectIntent(message: string): AgentIntent {
  const m = message.toLowerCase();

  // ── Deep multi-agent trading analysis (TradingAgents pipeline) ─────────────
  // Checked FIRST — explicit deep-analysis requests bypass simpler specialists.
  if (
    /\b(deep analysis|deep dive|full analysis|multi.?agent|trading agent|full breakdown|agent analysis|technical trader|trading signal|trade signal|signal for|full report|analyst report)\b/.test(m) ||
    /\b(what do the agents|what do the analysts|run agents|run analysis|run the agents)\b/.test(m)
  ) return 'DEEP_TRADING_ANALYSIS';

  // Risk-related queries
  if (/\b(risk|volatile|volatility|beta|safe|danger|exposure|drawdown|sharpe|hedge|protection)\b/.test(m))
    return 'RISK_ASSESSMENT';

  // Forecast / prediction queries
  if (/\b(forecast|predict|prediction|outlook|30.?day|price target|future price|trend|next month|projection)\b/.test(m))
    return 'FORECAST';

  // Market sentiment / news queries
  if (/\b(sentiment|news|feeling|mood|market think|buzz|narrative|analyst|press|media|public opinion)\b/.test(m))
    return 'MARKET_SENTIMENT';

  // Screener queries
  if (/\b(screen|find stocks|filter|value stock|growth stock|criteria|look for stock|search for stock|penny|undervalued|overvalued)\b/.test(m))
    return 'SCREENER';

  // Recommendation queries
  if (/\b(recommend|suggest|should i buy|should i sell|what to buy|what to sell|best stock|top pick|buy or sell|entry point|exit point)\b/.test(m))
    return 'RECOMMENDATION';

  // Portfolio analysis queries
  if (/\b(portfolio|diversif|allocation|holding|sector|rebalanc|weight|concentration|asset mix|breakdown)\b/.test(m))
    return 'PORTFOLIO_ANALYSIS';

  return 'GENERAL';
}

