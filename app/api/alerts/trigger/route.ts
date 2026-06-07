import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { StockAlert } from "@/database/models/StockAlert";
import { auth } from "@/lib/better-auth/auth";
import { sendStockAlertEmail } from "@/lib/nodemailer";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { alertId, currentPrice } = body;

    if (!alertId || currentPrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    const alert = await StockAlert.findOne({ _id: alertId, userId: session.user.id });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (!alert.isActive) {
      // Already triggered
      return NextResponse.json({ success: true, message: "Alert already triggered" });
    }

    // Send email immediately
    try {
      await sendStockAlertEmail({
        email: alert.email,
        symbol: alert.symbol,
        targetPrice: alert.targetPrice,
        currentPrice: Number(currentPrice),
        condition: alert.condition
      });
    } catch (emailError) {
      console.error("Failed to send alert email on live trigger:", emailError);
      // We don't fail the request here, just log the error
    }

    // Mark as inactive
    alert.isActive = false;
    await alert.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to trigger live alert:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
