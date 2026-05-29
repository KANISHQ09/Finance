import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runAgent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portfolio, riskProfile, goals, input } = body;

    const userMessage =
      portfolio
        ? `Portfolio: ${JSON.stringify(portfolio)}\nRisk: ${riskProfile ?? "medium"}\nGoals: ${goals ?? "long-term growth"}`
        : input ?? "Provide general investment recommendations.";

    const result = await runAgent({
      systemPrompt: `You are a holistic investment advisor AI for FinNext. Provide actionable buy/sell/hold recommendations tailored to the user's portfolio, risk tolerance, and financial goals. Return JSON: { recommendations: [{ ticker, action, rationale, targetPrice }], summary }`,
      userMessage,
    });

    return NextResponse.json({ reply: result, result });
  } catch (error) {
    console.error("Recommendation agent error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
