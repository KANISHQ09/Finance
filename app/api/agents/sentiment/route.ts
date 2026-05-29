import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runAgent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tickers, newsHeadlines, input } = body;

    const userMessage =
      tickers && newsHeadlines
        ? `Tickers: ${(tickers as string[]).join(", ")}\nHeadlines:\n${(newsHeadlines as string[]).join("\n")}`
        : input ?? "Analyze general market sentiment.";

    const result = await runAgent({
      systemPrompt: `You are a market sentiment analyst for FinNext. Analyze news headlines and ticker activity to produce a sentiment summary. Return JSON: { overallSentiment, tickerSentiments: [{ ticker, score, reason }], marketMood }`,
      userMessage,
    });

    return NextResponse.json({ reply: result, result });
  } catch (error) {
    console.error("Sentiment agent error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
