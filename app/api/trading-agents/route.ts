import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth/auth";

/**
 * POST /api/trading-agents
 *
 * Bridge route that calls the Python TradingAgents microservice.
 * Accepts: { ticker, date?, riskTolerance? }
 * Returns: full multi-agent analysis result from the Python server.
 */

const TRADING_AGENTS_URL =
  process.env.TRADING_AGENTS_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    // Auth check (optional — unauthenticated users still get analysis, just no risk profile)
    const session = await auth.api.getSession({ headers: req.headers });

    const body = await req.json();
    const { ticker, date, riskTolerance } = body;

    if (!ticker || typeof ticker !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'ticker' field" },
        { status: 400 }
      );
    }

    // Forward to Python microservice
    const response = await fetch(`${TRADING_AGENTS_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker: ticker.toUpperCase(),
        date: date ?? null,
        risk_tolerance: riskTolerance ?? "MEDIUM",
      }),
      // 60s timeout — fast mode should respond in ~15s but give headroom
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[trading-agents] Python server error (${response.status}): ${errorText}`);
      return NextResponse.json(
        { error: `Analysis server error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    // Handle timeout or connection refused
    if (err?.name === "TimeoutError" || err?.cause?.code === "ECONNREFUSED") {
      return NextResponse.json(
        {
          error:
            "The TradingAgents analysis server is not running. Please start it with: cd trading-agents-server && start.bat",
        },
        { status: 503 }
      );
    }

    console.error("[trading-agents] Unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET /api/trading-agents/health
 * Proxy health check to Python server
 */
export async function GET() {
  try {
    const response = await fetch(`${TRADING_AGENTS_URL}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return NextResponse.json({ status: "offline" }, { status: 502 });
    }
    const data = await response.json();
    return NextResponse.json({ status: "online", ...data });
  } catch {
    return NextResponse.json(
      { status: "offline", message: "TradingAgents server not reachable" },
      { status: 503 }
    );
  }
}
