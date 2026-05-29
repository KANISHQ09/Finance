import { NextRequest, NextResponse } from "next/server";
import { nvidiaChat } from "@/lib/nvidia";

export async function POST(req: NextRequest) {
  try {
    const { portfolio, marketData } = await req.json();

    const systemPrompt = `You are an institutional-grade portfolio auditor powered by NVIDIA AI. 
Analyze the given portfolio deeply and return ONLY a valid JSON object with this exact structure:
{
  "overallScore": 72,
  "riskLevel": "HIGH",
  "summary": "Two-sentence executive summary of portfolio health.",
  "sectorAllocation": [{ "sector": "Technology", "percentage": 65, "benchmark": 28, "status": "OVER" }],
  "topRisks": [{ "risk": "Over-concentration in Tech", "severity": "HIGH", "recommendation": "Diversify into Financials and Healthcare" }],
  "topOpportunities": [{ "opportunity": "Underweight Financials", "action": "Consider adding HDFC Bank or ICICI Bank" }],
  "forecast30Days": [{ "day": 1, "pessimistic": 98000, "base": 100000, "optimistic": 102500 }],
  "exportSummary": "Plain-text paragraph suitable for PDF export."
}
Rules:
- forecast30Days MUST have exactly 30 entries (day 1 through 30)
- All monetary values in INR
- Return ONLY the JSON, no markdown, no extra text`;

    const userMessage = `Portfolio: ${JSON.stringify(portfolio ?? [])}\nMarket context: ${JSON.stringify(marketData ?? {})}\nCurrency: INR`;

    const text = await nvidiaChat(systemPrompt, userMessage, 3000);

    try {
      const clean = text.replace(/```json|```/g, "").trim();
      return NextResponse.json(JSON.parse(clean));
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 });
    }
  } catch (err) {
    console.error("Audit error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
