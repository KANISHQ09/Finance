import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { Sandbox } from "@/database/models/Sandbox";
import { auth } from "@/lib/better-auth/auth";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  let sandbox = await Sandbox.findOne({ userId: session.user.id });
  if (!sandbox) {
    sandbox = await Sandbox.create({ userId: session.user.id });
  }

  // Update positions with live quotes if there are active positions
  const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? "";
  if (token && sandbox.positions && sandbox.positions.length > 0) {
    try {
      await Promise.all(
        sandbox.positions.map(async (pos: any) => {
          try {
            const quoteRes = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(pos.ticker.toUpperCase())}&token=${token}`,
              { cache: "no-store", signal: AbortSignal.timeout(3000) }
            );
            if (quoteRes.ok) {
              const data = await quoteRes.json();
              if (data && typeof data.c === "number" && data.c > 0) {
                pos.currentPrice = data.c;
              }
            }
          } catch (e) {
            console.error(`Failed to fetch live price for ticker ${pos.ticker}:`, e);
          }
        })
      );
      sandbox.markModified("positions");
      await sandbox.save();
    } catch (err) {
      console.error("Failed to update sandbox live prices:", err);
    }
  }

  return NextResponse.json(sandbox);
}
