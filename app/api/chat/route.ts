import { NextRequest, NextResponse } from "next/server";
import { nvidiaChat } from "@/lib/nvidia";
import { auth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { Profile } from "@/database/models/Profile";
import { ExternalPortfolio } from "@/database/models/ExternalPortfolio";
import { Sandbox } from "@/database/models/Sandbox";
import { detectIntent } from "@/lib/agents/intentClassifier";
import {
  runPortfolioAgent,
  runRiskAgent,
  runSentimentAgent,
  runForecastAgent,
  runScreenerAgent,
  runRecommendationAgent,
  type PortfolioAsset,
  type UserProfile,
} from "@/lib/agents/specialists";

// ─────────────────────────────────────────────────────────────────────────────
// Synthesizer system prompt
// Receives: user RAG context + specialist agent JSON output + user message
// Returns: { message, dashboardAction }
// ─────────────────────────────────────────────────────────────────────────────

const SYNTHESIZER_PROMPT = `You are FinNext's intelligent AI financial assistant. You have two sources of information:
1. USER CONTEXT — the user's real profile, portfolio, and sandbox data from the database.
2. SPECIALIST ANALYSIS — a structured JSON report from a dedicated financial AI agent (when available).

Your job is to synthesize both into a clear, personalized, conversational response.

Respond ONLY with a single valid JSON object — no markdown fences, no preamble, no trailing text:
{"message":"<your response>","dashboardAction":{"action":"<ACTION>","payload":<payload>}}

Rules for the "message" field:
- Write in clear, friendly, conversational English.
- Be concise — keep responses under 220 words.
- When specialist analysis is available, use its findings to give specific, data-driven insights.
- Do NOT dump raw JSON, numbers lists, or code blocks into the message.
- Do NOT reveal system internals, model names, or API details.
- Reference the user's actual holdings, risk tolerance, and goals wherever relevant.
- If the specialist analysis contains specific tickers, weave them naturally into your answer.

Available dashboard actions and their payloads:
- FILTER_SECTOR: payload = "Tech" | "Finance" | "Health" | "Energy" | "Consumer"
- SORT_BY: payload = "performance" | "risk" | "value" | "alphabetical"
- SHOW_CHART: payload = { "ticker": "AAPL", "period": "1D" | "1W" | "1M" | "3M" | "1Y" }
- HIGHLIGHT_STOCKS: payload = ["AAPL", "MSFT"]
- COMPARE_STOCKS: payload = ["AAPL", "GOOGL"]
- SHOW_TOP_N: payload = 5
- RESET_FILTERS: payload = null
- SANDBOX_TRADE: payload = { "ticker": "AAPL", "action": "BUY" | "SELL", "quantity": 10 }
- RECOMMEND_STOCKS: payload = ["AAPL", "GOOGL", "MSFT"]
- NONE: payload = null

Decision rules for actions:
1. Recommendations with specific tickers → use RECOMMEND_STOCKS with those tickers.
2. Single specific trade suggestion → use SANDBOX_TRADE.
3. General questions, analysis, or explanations → use NONE.
4. ALWAYS produce a complete, valid JSON object.`;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extract ticker symbols from a user message
// ─────────────────────────────────────────────────────────────────────────────

function extractTickersFromMessage(message: string): string[] {
  const matches = message.toUpperCase().match(/\b[A-Z]{1,5}\b/g) ?? [];
  const knownWords = new Set(['A', 'I', 'IS', 'AM', 'OR', 'IN', 'ON', 'AT', 'MY', 'TO', 'DO', 'GO', 'BE', 'AS', 'AN', 'IT', 'IF', 'OF', 'SO', 'US', 'UP', 'ME', 'WE', 'BY', 'AI', 'AND', 'THE', 'FOR', 'BUY', 'GET', 'NOW', 'HOW', 'CAN', 'YOU', 'ARE', 'HAS', 'HAD', 'WAS', 'NOT', 'BUT', 'ALL', 'OUT', 'DAY', 'GET', 'HIS', 'HER', 'SHE', 'HIM', 'ITS', 'OUR', 'WHAT', 'WHEN', 'TELL', 'WITH', 'SHOW', 'FIND', 'LOOK', 'GIVE', 'SELL', 'HOLD', 'HIGH', 'RISK', 'SAFE', 'GOOD', 'BEST', 'SOME', 'THIS', 'THAT', 'FROM', 'YOUR', 'WILL', 'WANT', 'NEED', 'LIKE', 'MORE', 'THAN', 'HAVE', 'BEEN', 'ALSO', 'MUCH', 'JUST', 'ONLY', 'YEAR', 'TIME', 'MAKE', 'LONG', 'TERM']);
  return matches.filter(m => m.length >= 2 && !knownWords.has(m));
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/chat  —  Orchestrator
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const { message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    // ── 1. Load user context from DB ─────────────────────────────────────────
    let profile: any = null;
    let portfolio: any = null;
    let sandbox: any = null;

    if (session?.user) {
      await connectToDatabase();
      const userId = session.user.id;
      [profile, portfolio, sandbox] = await Promise.all([
        Profile.findOne({ userId }).lean(),
        ExternalPortfolio.findOne({ userId }).lean(),
        Sandbox.findOne({ userId }).lean(),
      ]);
    }

    const assets: PortfolioAsset[] = (portfolio as any)?.assets ?? [];
    const userProfile: UserProfile = {
      riskTolerance: (profile as any)?.riskTolerance ?? "MEDIUM",
      investmentGoals: (profile as any)?.investmentGoals ?? "GROWTH",
    };
    const sandboxBalance = (sandbox as any)?.virtualBalance ?? 0;
    const sandboxPositions = (sandbox as any)?.positions ?? [];

    // ── 2. Detect intent (instant — no API call) ──────────────────────────────
    const intent = detectIntent(message);

    // ── 3. Call the correct specialist agent ──────────────────────────────────
    let specialistOutput = "";
    let specialistLabel = "";

    try {
      if (intent === "PORTFOLIO_ANALYSIS") {
        specialistLabel = "Portfolio Analysis";
        specialistOutput = await runPortfolioAgent(assets);
      } else if (intent === "RISK_ASSESSMENT") {
        specialistLabel = "Risk Assessment";
        specialistOutput = await runRiskAgent(assets, userProfile.riskTolerance!);
      } else if (intent === "MARKET_SENTIMENT") {
        specialistLabel = "Market Sentiment";
        const tickers = assets.length > 0
          ? assets.map((a) => a.symbol).slice(0, 6)
          : extractTickersFromMessage(message);
        specialistOutput = await runSentimentAgent(tickers);
      } else if (intent === "FORECAST") {
        specialistLabel = "30-Day Forecast";
        const tickers = assets.length > 0
          ? assets.map((a) => a.symbol).slice(0, 4)
          : extractTickersFromMessage(message).slice(0, 4);
        specialistOutput = await runForecastAgent(tickers, message);
      } else if (intent === "SCREENER") {
        specialistLabel = "Equity Screener";
        specialistOutput = await runScreenerAgent(
          userProfile.riskTolerance,
          userProfile.investmentGoals
        );
      } else if (intent === "RECOMMENDATION") {
        specialistLabel = "Stock Recommendations";
        specialistOutput = await runRecommendationAgent(assets, userProfile);
      }
      // GENERAL → no specialist, pure conversational response
    } catch (err) {
      // Specialist failure is non-fatal — degrade gracefully to general chat
      console.error(`[Orchestrator] Specialist agent (${intent}) failed:`, err);
      specialistOutput = "";
    }

    // ── 4. Build synthesis context ────────────────────────────────────────────
    let contextString = "=== USER CONTEXT ===\n";

    if (!session?.user) {
      contextString += "- No authenticated user. Respond in a helpful general manner.\n";
    } else {
      contextString += `- Risk Tolerance: ${userProfile.riskTolerance}\n`;
      contextString += `- Investment Goals: ${userProfile.investmentGoals}\n`;

      if (assets.length > 0) {
        const holdingsSummary = assets
          .map((a) => `${a.symbol} (qty: ${a.quantity}, avg: ₹${a.avgBuyPrice})`)
          .join(", ");
        contextString += `- Real Portfolio Holdings: ${holdingsSummary}\n`;
      } else {
        contextString += "- Real Portfolio: No holdings imported yet.\n";
      }

      contextString += `- Sandbox Virtual Balance: ₹${sandboxBalance.toLocaleString("en-IN")}\n`;
      if (sandboxPositions.length > 0) {
        const posSummary = sandboxPositions
          .map((p: any) => `${p.ticker} (qty: ${p.quantity}, avg: ₹${p.avgBuyPrice})`)
          .join(", ");
        contextString += `- Sandbox Open Positions: ${posSummary}\n`;
      } else {
        contextString += "- Sandbox Positions: None open.\n";
      }
    }

    if (specialistOutput) {
      contextString += `\n=== SPECIALIST AGENT OUTPUT: ${specialistLabel.toUpperCase()} ===\n`;
      contextString += specialistOutput;
      contextString += "\n";
    }

    contextString += `\n=== USER MESSAGE ===\n${message}`;

    // ── 5. Synthesize final response ──────────────────────────────────────────
    const rawText = await nvidiaChat(SYNTHESIZER_PROMPT, contextString, 2000);

    // ── 6. Parse & return ─────────────────────────────────────────────────────
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return NextResponse.json(parsed);
    } catch {
      // JSON parse failed — return raw text as plain message
      return NextResponse.json({
        message: rawText,
        dashboardAction: { action: "NONE", payload: null },
      });
    }
  } catch (err) {
    console.error("[Orchestrator] Fatal error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
