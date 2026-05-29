import { NextRequest, NextResponse } from "next/server";
import { nvidiaChat } from "@/lib/nvidia";
import { auth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { Profile } from "@/database/models/Profile";
import { ExternalPortfolio } from "@/database/models/ExternalPortfolio";
import { Sandbox } from "@/database/models/Sandbox";

const SYSTEM_PROMPT = `You are FinNext's intelligent AI assistant powered by NVIDIA Nemotron. 
You act as a personal financial advisor and dashboard assistant.
You have access to the user's specific context (Portfolio, Sandbox, Profile).
Use this context to provide highly personalized advice.

When the user gives a command, respond with a JSON object:
{
  "message": "Your natural language response (detailed and conversational, explaining your reasoning based on their profile and portfolio)",
  "dashboardAction": { "action": "ACTION_NAME", "payload": ... }
}

Available actions:
- FILTER_SECTOR: payload = "Tech" | "Finance" | "Health" | "Energy" | "Consumer"
- SORT_BY: payload = "performance" | "risk" | "value" | "alphabetical"
- SHOW_CHART: payload = { "ticker": "AAPL", "period": "1D" | "1W" | "1M" | "3M" | "1Y" }
- HIGHLIGHT_STOCKS: payload = ["AAPL", "MSFT"]
- COMPARE_STOCKS: payload = ["AAPL", "GOOGL"]
- SHOW_TOP_N: payload = 5
- RESET_FILTERS: payload = null
- SANDBOX_TRADE: payload = { "ticker": "AAPL", "action": "BUY" | "SELL", "quantity": 10 }
- RECOMMEND_STOCKS: payload = ["AAPL", "GOOGL", "MSFT"]
- NONE: payload = null (for conversational questions that do not trigger UI actions)

CRITICAL:
1. If the user asks for a recommendation, consider their Risk Tolerance and Investment Goals. Use RECOMMEND_STOCKS to return a list of recommended tickers.
2. If they ask to trade or you recommend a specific trade, output the SANDBOX_TRADE action so they can execute it in their virtual sandbox.
3. Return ONLY valid JSON. No markdown wrappers around the JSON, no extra text.`;

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    const { message } = await req.json();

    let contextString = "User Context:\n";
    
    if (session?.user) {
      await connectToDatabase();
      const userId = session.user.id;

      // Gather RAG Context
      const [profile, portfolio, sandbox] = await Promise.all([
        Profile.findOne({ userId }).lean() as any,
        ExternalPortfolio.findOne({ userId }).lean() as any,
        Sandbox.findOne({ userId }).lean() as any
      ]);

      if (profile) {
        contextString += `- Risk Tolerance: ${profile.riskTolerance}\n`;
        contextString += `- Investment Goals: ${profile.investmentGoals}\n`;
      }
      
      if (portfolio && portfolio.assets) {
        const assets = portfolio.assets.map((a: any) => `${a.symbol} (Qty: ${a.quantity}, Avg Price: ₹${a.avgBuyPrice})`).join(', ');
        contextString += `- Real Portfolio Holdings: ${assets || 'None'}\n`;
      }

      if (sandbox) {
        contextString += `- Sandbox Virtual Balance: ₹${sandbox.virtualBalance}\n`;
        if (sandbox.positions && sandbox.positions.length > 0) {
          const positions = sandbox.positions.map((p: any) => `${p.ticker} (Qty: ${p.quantity}, Avg Price: ₹${p.avgBuyPrice})`).join(', ');
          contextString += `- Sandbox Open Positions: ${positions}\n`;
        }
      }
    } else {
      contextString += "- No logged-in user context available.\n";
    }

    const userContent = `${contextString}\n\nUser request: ${message}`;
    const rawText = await nvidiaChat(SYSTEM_PROMPT, userContent, 800);

    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        message: rawText,
        dashboardAction: { action: "NONE", payload: null },
      });
    }
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
