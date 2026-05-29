import { NextRequest, NextResponse } from "next/server";

// CSV field mappings per broker
const FIELD_MAPS: Record<string, Record<string, string>> = {
  groww:    { symbol: "symbol", quantity: "quantity", avgBuyPrice: "average price" },
  zerodha:  { symbol: "tradingsymbol", quantity: "quantity", avgBuyPrice: "average_price" },
  angelone: { symbol: "symbol", quantity: "netqty", avgBuyPrice: "avgnetprice" },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const broker = (formData.get("broker") as string)?.toLowerCase() ?? "groww";

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const text = await file.text();
    const lines = text.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return NextResponse.json({ assets: [] });

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const map = FIELD_MAPS[broker] ?? FIELD_MAPS.groww;

    // Helper to find a column index using fuzzy matching if strict map fails
    const findCol = (keys: string[]) => {
      for (const k of keys) {
        const idx = headers.findIndex(h => h.includes(k));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const symbolIdx = headers.indexOf(map.symbol) !== -1 ? headers.indexOf(map.symbol) : findCol(['symbol', 'ticker', 'instrument', 'name']);
    const qtyIdx = headers.indexOf(map.quantity) !== -1 ? headers.indexOf(map.quantity) : findCol(['qty', 'quantity', 'shares', 'balance', 'netqty']);
    const priceIdx = headers.indexOf(map.avgBuyPrice) !== -1 ? headers.indexOf(map.avgBuyPrice) : findCol(['price', 'avg', 'cost']);

    const assets = lines
      .slice(1)
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
        return {
          symbol:      symbolIdx !== -1 ? cols[symbolIdx].toUpperCase() : "",
          assetType:   "stock" as const,
          quantity:    qtyIdx !== -1 ? parseFloat(cols[qtyIdx]) || 0 : 0,
          avgBuyPrice: priceIdx !== -1 ? parseFloat(cols[priceIdx]) || 0 : 0,
          currency:    "INR",
          broker,
          lastUpdated: new Date(),
        };
      })
      .filter((a) => a.symbol && a.quantity > 0);

    return NextResponse.json({ assets, count: assets.length });
  } catch (err) {
    console.error("CSV parse error:", err);
    return NextResponse.json({ error: "Failed to parse CSV" }, { status: 500 });
  }
}
