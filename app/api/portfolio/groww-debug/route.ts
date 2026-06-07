import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth/auth";

/**
 * DEBUG endpoint — call this to see the raw response from the Groww API.
 * Usage: GET /api/portfolio/groww-debug?token=YOUR_TOKEN
 * Remove this route before production deployment.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Pass ?token=YOUR_GROWW_ACCESS_TOKEN" }, { status: 400 });
  }

  const GROWW_HOLDINGS_URL = "https://api.groww.in/v1/holdings/user";

  // Try every possible auth header combination
  const attempts: any[] = [];

  // Attempt 1: Bearer token
  try {
    const res = await fetch(GROWW_HOLDINGS_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "X-API-VERSION": "1.0",
      },
      cache: "no-store",
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    attempts.push({
      method: "Bearer token",
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      rawText: text.slice(0, 2000),
      json,
    });
  } catch (e: any) {
    attempts.push({ method: "Bearer token", error: e.message });
  }

  // Attempt 2: x-access-token header
  try {
    const res = await fetch(GROWW_HOLDINGS_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-access-token": token,
        "X-API-VERSION": "1.0",
      },
      cache: "no-store",
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    attempts.push({
      method: "x-access-token",
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      rawText: text.slice(0, 2000),
      json,
    });
  } catch (e: any) {
    attempts.push({ method: "x-access-token", error: e.message });
  }

  // Attempt 3: token in query param
  try {
    const urlWithToken = `${GROWW_HOLDINGS_URL}?access_token=${token}`;
    const res = await fetch(urlWithToken, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    attempts.push({
      method: "query param access_token",
      status: res.status,
      rawText: text.slice(0, 2000),
      json,
    });
  } catch (e: any) {
    attempts.push({ method: "query param access_token", error: e.message });
  }

  return NextResponse.json({ debug: true, attempts }, { status: 200 });
}
