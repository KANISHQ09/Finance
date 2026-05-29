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
  return NextResponse.json(sandbox);
}
