import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runAgent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portfolio, userProfile, input } = body;

    const userMessage = portfolio
      ? `Portfolio: ${JSON.stringify(portfolio)}\nUser profile: ${JSON.stringify(userProfile ?? {})}`
      : input ?? "Assess general portfolio risk.";

    const result = await runAgent({
      systemPrompt: `You are a financial risk analyst for FinNext. Compute a personalized risk score (1-10) based on portfolio volatility, beta, and user profile. Return JSON: { riskScore, volatilityRating, betaExposure, hedgingSuggestions }`,
      userMessage,
    });

    return NextResponse.json({ reply: result, result });
  } catch (error) {
    console.error("Risk agent error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
