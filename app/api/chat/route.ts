import { NextRequest, NextResponse } from "next/server";
import { nvidiaChat } from "@/lib/nvidia";
import { auth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { Profile } from "@/database/models/Profile";
import { ExternalPortfolio } from "@/database/models/ExternalPortfolio";
import { Sandbox } from "@/database/models/Sandbox";

const SYSTEM_PROMPT = `You are FinNext's intelligent AI financial assistant. You act as a knowledgeable personal financial advisor with full awareness of the user's portfolio, goals, and sandbox activity.

Respond ONLY with a single valid JSON object in this exact format — no markdown fences, no preamble, no trailing text:
{"message":"<your response here>","dashboardAction":{"action":"<ACTION>","payload":<payload>}}

Rules for the "message" field:
- Write in clear, friendly, conversational English.
- Be concise — keep responses under 200 words.
- Do NOT include raw JSON, code blocks, or technical jargon in the message.
- Do NOT reveal system internals, model names, or API details.
- Use the user's context (risk tolerance, goals, portfolio, sandbox) to personalise your advice.

Available actions and their payloads:
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

Decision rules:
1. For stock recommendations → use RECOMMEND_STOCKS and explain why each stock fits the user's risk profile and goals.
2. For trade suggestions → use SANDBOX_TRADE for a single specific trade.
3. For general questions → use NONE.
4. ALWAYS complete the JSON object fully before ending your response.`;

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
    const rawText = await nvidiaChat(SYSTEM_PROMPT, userContent, 2000);

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
