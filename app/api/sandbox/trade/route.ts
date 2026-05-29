import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { Sandbox } from "@/database/models/Sandbox";
import { auth } from "@/lib/better-auth/auth";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticker, action, quantity, currentPrice, companyName } = await req.json();

  if (!ticker || !action || !quantity || !currentPrice) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const total = quantity * currentPrice;
  await connectToDatabase();

  const sandbox = await Sandbox.findOne({ userId: session.user.id });
  if (!sandbox) return NextResponse.json({ error: "Sandbox not found. GET /api/sandbox first." }, { status: 404 });

  if (action === "BUY") {
    if (sandbox.virtualBalance < total) {
      return NextResponse.json({ error: "Insufficient virtual balance" }, { status: 400 });
    }
    sandbox.virtualBalance -= total;

    const existingPos = sandbox.positions.find((p: any) => p.ticker === ticker);
    if (existingPos) {
      const newQty = existingPos.quantity + quantity;
      existingPos.avgBuyPrice =
        (existingPos.avgBuyPrice * existingPos.quantity + total) / newQty;
      existingPos.quantity = newQty;
      existingPos.currentPrice = currentPrice;
    } else {
      sandbox.positions.push({
        ticker,
        companyName: companyName ?? ticker,
        quantity,
        avgBuyPrice: currentPrice,
        currentPrice,
        openedAt: new Date(),
      });
    }
  } else if (action === "SELL") {
    const pos = sandbox.positions.find((p: any) => p.ticker === ticker);
    if (!pos || pos.quantity < quantity) {
      return NextResponse.json({ error: "Insufficient position to sell" }, { status: 400 });
    }
    const pnl = (currentPrice - pos.avgBuyPrice) * quantity;
    sandbox.virtualBalance += total;
    sandbox.totalPnL += pnl;
    pos.quantity -= quantity;
    if (pos.quantity === 0) {
      sandbox.positions = sandbox.positions.filter((p: any) => p.ticker !== ticker);
    }
  } else {
    return NextResponse.json({ error: "action must be BUY or SELL" }, { status: 400 });
  }

  sandbox.transactions.push({
    ticker,
    action,
    quantity,
    price: currentPrice,
    total,
    executedAt: new Date(),
  });

  sandbox.markModified("positions");
  sandbox.markModified("transactions");
  await sandbox.save();

  return NextResponse.json({ success: true, sandbox });
}
