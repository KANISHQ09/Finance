import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runAgent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { portfolio, input } = body;

    const userMessage = portfolio
      ? `Analyze this portfolio: ${JSON.stringify(portfolio)}`
      : input ?? "Provide a general portfolio analysis.";

    const result = await runAgent({
      systemPrompt: `You are an elite portfolio analysis AI for FinNext. Analyze the user's stock portfolio and provide:
1. Diversification score (0-100)
2. Sector allocation breakdown (%)
3. Top 3 concentration risks
4. Rebalancing recommendations
Output as structured JSON: { score, sectors, risks, recommendations }`,
      userMessage,
    });

    return NextResponse.json({ reply: result, result });
  } catch (error) {
    console.error("Portfolio agent error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}