import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { StockAlert } from "@/database/models/StockAlert";
import { auth } from "@/lib/better-auth/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");

    await connectToDatabase();
    
    const query: any = { userId: session.user.id };
    if (symbol) query.symbol = symbol.toUpperCase();

    const alerts = await StockAlert.find(query).sort({ createdAt: -1 });
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { symbol, targetPrice, condition } = body;

    if (!symbol || !targetPrice || !condition) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    // Create the alert
    const newAlert = await StockAlert.create({
      userId: session.user.id,
      email: session.user.email,
      symbol: symbol.toUpperCase(),
      targetPrice,
      condition,
    });

    return NextResponse.json(newAlert, { status: 201 });
  } catch (error) {
    console.error("Failed to create alert:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing alert ID" }, { status: 400 });

    await connectToDatabase();
    
    const deleted = await StockAlert.findOneAndDelete({ _id: id, userId: session.user.id });
    if (!deleted) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete alert:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
