import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { ExternalPortfolio } from "@/database/models/ExternalPortfolio";
import { auth } from "@/lib/better-auth/auth";

async function getSession(req: NextRequest) {
  return auth.api.getSession({ headers: req.headers });
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const portfolio = await ExternalPortfolio.findOne({ userId: session.user.id });
  return NextResponse.json({ assets: portfolio?.assets ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assets } = await req.json();
  await connectToDatabase();

  const portfolio = await ExternalPortfolio.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { assets } },
    { upsert: true, new: true }
  );
  return NextResponse.json({ success: true, portfolio });
}
