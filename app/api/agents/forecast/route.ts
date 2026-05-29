import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runAgent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticker, historicalData, input } = body;

    const userMessage =
      ticker
        ? `Ticker: ${ticker}\nHistorical data (last 90 days): ${JSON.stringify(historicalData ?? [])}`
        : input ?? "Forecast market trends.";

    const result = await runAgent({
      systemPrompt: `You are a quantitative forecasting AI for FinNext. Based on historical price data and market trends, generate a 30-day price forecast corridor. Return JSON: { ticker, forecastDays: [{ day, low, mid, high }], confidence, keyDrivers }`,
      userMessage,
      maxTokens: 2000,
    });

    return NextResponse.json({ reply: result, result });
  } catch (error) {
    console.error("Forecast agent error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
