/**
 * Specialist Agents
 * Each function calls runAgent with a focused system prompt and structured input.
 * These are called by the orchestrator (/api/chat) based on detected intent.
 * All return raw strings (JSON) that the synthesizer uses as context.
 */

import { runAgent } from './runAgent';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PortfolioAsset {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
}

export interface UserProfile {
  riskTolerance?: string;
  investmentGoals?: string;
}

// ─────────────────────────────────────────────
// Helper: extract the most prominent ticker from a message
// ─────────────────────────────────────────────

export function extractPrimaryTicker(message: string): string | null {
  // Known blacklist of common English words that look like tickers
  const BLACKLIST = new Set([
    'A','I','IS','AM','OR','IN','ON','AT','MY','TO','DO','GO','BE','AS','AN',
    'IT','IF','OF','SO','US','UP','ME','WE','BY','AI','AND','THE','FOR','BUY',
    'GET','NOW','HOW','CAN','YOU','ARE','HAS','HAD','WAS','NOT','BUT','ALL',
    'OUT','DAY','HIS','HER','SHE','HIM','ITS','OUR','NEW','OLD','TOP','LOW',
    'HIGH','FULL','RUN','DEEP','DIVE','FAST','GIVE','SHOW','TELL','FIND',
    'SELL','HOLD','RISK','SAFE','GOOD','BEST','SOME','THIS','THAT','FROM',
    'YOUR','WILL','WANT','NEED','LIKE','MORE','THAN','HAVE','BEEN','ALSO',
    'MUCH','JUST','ONLY','YEAR','TIME','MAKE','LONG','TERM','ABOUT','WHAT',
    'WHEN','WITH','SIGNAL','SIGNALS','TRADE','TRADES','TRADING',
  ]);
  const matches = message.toUpperCase().match(/\b[A-Z]{1,5}\b/g) ?? [];
  return matches.find(m => m.length >= 2 && !BLACKLIST.has(m)) ?? null;
}



// ─────────────────────────────────────────────
// 1. Portfolio Analysis Agent
// ─────────────────────────────────────────────

export async function runPortfolioAgent(assets: PortfolioAsset[]): Promise<string> {
  const userMessage = assets.length > 0
    ? `Analyze this portfolio: ${JSON.stringify(assets)}`
    : 'User has no holdings yet. Provide general diversification guidance.';

  return runAgent({
    systemPrompt: `You are an elite portfolio analysis AI for FinNext. Analyze the user's stock portfolio and return ONLY a JSON object with this exact shape:
{
  "diversificationScore": <0-100>,
  "overallHealth": "<POOR|FAIR|GOOD|EXCELLENT>",
  "sectors": [{ "name": "<sector>", "percent": <number> }],
  "topRisks": ["<risk1>", "<risk2>", "<risk3>"],
  "rebalancingActions": ["<action1>", "<action2>"],
  "summary": "<2-3 sentence plain-English summary>"
}
Return ONLY valid JSON, no markdown fences, no preamble.`,
    userMessage,
    maxTokens: 1200,
  });
}

// ─────────────────────────────────────────────
// 2. Risk Assessment Agent
// ─────────────────────────────────────────────

export async function runRiskAgent(
  assets: PortfolioAsset[],
  riskTolerance: string
): Promise<string> {
  const userMessage = `Risk tolerance: ${riskTolerance}\nPortfolio: ${JSON.stringify(assets)}`;

  return runAgent({
    systemPrompt: `You are a financial risk analyst AI for FinNext. Evaluate the portfolio against the user's risk tolerance and return ONLY a JSON object with this shape:
{
  "riskScore": <1-10>,
  "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "volatilityRating": "<LOW|MEDIUM|HIGH>",
  "betaEstimate": <number>,
  "sharpeEstimate": <number or null>,
  "isAlignedWithProfile": <true|false>,
  "topThreats": ["<threat1>", "<threat2>"],
  "hedgingSuggestions": ["<suggestion1>", "<suggestion2>"],
  "summary": "<2-3 sentence plain-English summary>"
}
Return ONLY valid JSON, no markdown fences, no preamble.`,
    userMessage,
    maxTokens: 1000,
  });
}

// ─────────────────────────────────────────────
// 3. Market Sentiment Agent
// ─────────────────────────────────────────────

export async function runSentimentAgent(tickers: string[]): Promise<string> {
  const userMessage = tickers.length > 0
    ? `Analyze market sentiment for these tickers: ${tickers.join(', ')}`
    : 'Provide a general stock market sentiment analysis.';

  return runAgent({
    systemPrompt: `You are a market sentiment analyst AI for FinNext. Analyze current sentiment for the given stocks based on your training knowledge and return ONLY a JSON object:
{
  "overallSentiment": "<BEARISH|NEUTRAL|BULLISH|STRONGLY_BULLISH>",
  "sentimentScore": <-100 to 100>,
  "perTicker": [{ "ticker": "<SYMBOL>", "sentiment": "<BEARISH|NEUTRAL|BULLISH>", "reason": "<brief reason>" }],
  "keyThemes": ["<theme1>", "<theme2>"],
  "riskEvents": ["<event1>"],
  "summary": "<2-3 sentence plain-English summary>"
}
Return ONLY valid JSON, no markdown fences, no preamble.`,
    userMessage,
    maxTokens: 1200,
  });
}

// ─────────────────────────────────────────────
// 4. Forecast Agent
// ─────────────────────────────────────────────

export async function runForecastAgent(
  tickers: string[],
  userContext: string
): Promise<string> {
  const userMessage = tickers.length > 0
    ? `Generate a 30-day price outlook for: ${tickers.join(', ')}. User context: "${userContext}"`
    : `Generate a general market 30-day outlook based on: "${userContext}"`;

  return runAgent({
    systemPrompt: `You are a quantitative forecasting AI for FinNext. Generate short-term price forecasts and return ONLY a JSON object:
{
  "forecastHorizon": "30 days",
  "marketOutlook": "<BEARISH|NEUTRAL|BULLISH>",
  "confidence": "<LOW|MEDIUM|HIGH>",
  "perTicker": [{
    "ticker": "<SYMBOL>",
    "currentTrend": "<DOWN|SIDEWAYS|UP>",
    "thirtyDayOutlook": "<BEARISH|NEUTRAL|BULLISH>",
    "keyLevels": { "support": "<price or description>", "resistance": "<price or description>" },
    "keyDrivers": ["<driver1>", "<driver2>"]
  }],
  "macroFactors": ["<factor1>", "<factor2>"],
  "summary": "<2-3 sentence plain-English summary>"
}
Return ONLY valid JSON, no markdown fences, no preamble.`,
    userMessage,
    maxTokens: 1400,
  });
}

// ─────────────────────────────────────────────
// 5. Equity Screener Agent
// ─────────────────────────────────────────────

export async function runScreenerAgent(
  riskTolerance: string = 'MEDIUM',
  investmentGoals: string = 'GROWTH'
): Promise<string> {
  const userMessage = `Screen for stocks matching: Risk tolerance = ${riskTolerance}, Investment goal = ${investmentGoals}`;

  return runAgent({
    systemPrompt: `You are an equity screener AI for FinNext. Based on the user's risk tolerance and goals, screen for suitable stocks from well-known equities and return ONLY a JSON object:
{
  "screeningCriteria": { "riskTolerance": "<value>", "goal": "<value>" },
  "results": [{
    "ticker": "<SYMBOL>",
    "company": "<name>",
    "sector": "<sector>",
    "whyItFits": "<brief reason aligned with user profile>",
    "riskRating": "<LOW|MEDIUM|HIGH>",
    "growthPotential": "<LOW|MEDIUM|HIGH>"
  }],
  "excludedCategories": ["<category1>"],
  "summary": "<2-3 sentence plain-English summary>"
}
Return between 4 and 6 stocks. Return ONLY valid JSON, no markdown fences, no preamble.`,
    userMessage,
    maxTokens: 1400,
  });
}

// ─────────────────────────────────────────────
// 6. Recommendation Agent
// ─────────────────────────────────────────────

export async function runRecommendationAgent(
  assets: PortfolioAsset[],
  profile: UserProfile
): Promise<string> {
  const userMessage = `User profile: ${JSON.stringify(profile)}\nCurrent holdings: ${JSON.stringify(assets)}`;

  return runAgent({
    systemPrompt: `You are a holistic investment recommendation AI for FinNext. Based on the user's profile and current holdings, generate specific buy/sell/hold recommendations and return ONLY a JSON object:
{
  "recommendations": [{
    "ticker": "<SYMBOL>",
    "action": "<BUY|SELL|HOLD>",
    "conviction": "<LOW|MEDIUM|HIGH>",
    "rationale": "<brief reason>",
    "targetEntry": "<price range or description>",
    "stopLoss": "<price range or description>"
  }],
  "portfolioGaps": ["<gap1>", "<gap2>"],
  "avoidSectors": ["<sector1>"],
  "summary": "<2-3 sentence plain-English summary>"
}
Return 3 to 5 recommendations. Return ONLY valid JSON, no markdown fences, no preamble.`,
    userMessage,
    maxTokens: 1400,
  });
}

// ─────────────────────────────────────────────
// 7. Deep Trading Analysis Agent (TradingAgents pipeline)
// ─────────────────────────────────────────────
//
// Routes through /api/trading-agents → Python FastAPI microservice.
// Fast mode: Technical Analyst → Trader → Risk Manager (3 LLM calls).
// ─────────────────────────────────────────────

export async function runTradingAgentsAnalysis(
  message: string,
  riskTolerance: string = 'MEDIUM'
): Promise<string> {
  // Extract the ticker from the message
  const ticker = extractPrimaryTicker(message);

  if (!ticker) {
    return JSON.stringify({
      error: 'No ticker found',
      hint: 'Please specify a stock ticker, e.g. "deep analysis of AAPL"',
    });
  }

  const baseUrl =
    typeof window !== 'undefined'
      ? '' // browser — relative
      : process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'; // server-side

  try {
    const response = await fetch(`${baseUrl}/api/trading-agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, riskTolerance }),
      signal: AbortSignal.timeout(65_000),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return JSON.stringify({
        error: errData.error ?? `TradingAgents server returned ${response.status}`,
        ticker,
      });
    }

    return await response.text(); // raw JSON string consumed by synthesizer
  } catch (err: any) {
    if (err?.name === 'TimeoutError') {
      return JSON.stringify({
        error: 'Analysis timed out',
        ticker,
        hint: 'The TradingAgents server took too long to respond.',
      });
    }
    return JSON.stringify({
      error: 'TradingAgents server is not running',
      ticker,
      hint: 'Start it with: cd trading-agents-server && start.bat',
    });
  }
}
