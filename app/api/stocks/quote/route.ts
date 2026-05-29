import { NextRequest, NextResponse } from "next/server";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

/**
 * GET /api/stocks/quote?symbol=RELIANCE
 * Returns the current price for a given symbol via Finnhub.
 * Used by SandboxTradeButton to get a live price before executing a paper trade.
 */
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";
  if (!token) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol.toUpperCase())}&token=${token}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Finnhub request failed" }, { status: res.status });
    }

    const data = await res.json();
    const price: number = data?.c ?? 0;

    return NextResponse.json({ symbol: symbol.toUpperCase(), price });
  } catch (err) {
    console.error("Quote fetch error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
