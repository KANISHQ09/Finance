import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runAgent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { criteria, marketData, input } = body;

    const userMessage =
      criteria
        ? `Criteria: ${JSON.stringify(criteria)}\nMarket data: ${JSON.stringify(marketData ?? {})}`
        : input ?? "Screen stocks based on fundamental criteria.";

    const result = await runAgent({
      systemPrompt: `You are a stock screener AI for FinNext. Filter and rank stocks based on the given technical and fundamental criteria. Return JSON: { matches: [{ ticker, score, reasons }], appliedFilters }`,
      userMessage,
    });

    return NextResponse.json({ reply: result, result });
  } catch (error) {
    console.error("Screener agent error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
