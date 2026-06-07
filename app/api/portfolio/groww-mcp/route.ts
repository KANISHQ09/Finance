import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { ExternalPortfolio } from "@/database/models/ExternalPortfolio";
import { auth } from "@/lib/better-auth/auth";
import mongoose, { Schema, Document } from "mongoose";

// ─── GrowwMCP settings model ─────────────────────────────────────────────────

interface IGrowwMCP extends Document {
  userId: string;
  encryptedToken: string;  // access token or derived token
  encryptedApiKey?: string;
  encryptedSecret?: string;
  maskedKey: string;
  mode: "access_token" | "api_key";
  lastSynced?: Date;
  holdingsCount: number;
}

const GrowwMCPSchema = new Schema<IGrowwMCP>(
  {
    userId:           { type: String, required: true, unique: true, index: true },
    encryptedToken:   { type: String, required: true },
    encryptedApiKey:  { type: String },
    encryptedSecret:  { type: String },
    maskedKey:        { type: String, required: true },
    mode:             { type: String, enum: ["access_token", "api_key"], default: "access_token" },
    lastSynced:       { type: Date },
    holdingsCount:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

const GrowwMCPModel =
  mongoose.models.GrowwMCP ||
  mongoose.model<IGrowwMCP>("GrowwMCP", GrowwMCPSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mask(str: string): string {
  if (!str || str.length <= 10) return "****";
  return str.slice(0, 8) + "…" + str.slice(-4);
}

// ─── Real Groww API: fetch holdings ──────────────────────────────────────────
// Endpoint: GET https://api.groww.in/v1/holdings/user
// Auth:     Authorization: Bearer <access_token>
// Docs:     https://groww.in/trade-api

async function fetchGrowwHoldings(accessToken: string) {
  const GROWW_HOLDINGS_URL = "https://api.groww.in/v1/holdings/user";

  // 8-second timeout per attempt
  const fetchWithTimeout = async (url: string, options: RequestInit) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  // CONFIRMED from live test: Bearer is the correct Groww auth header
  // Response shape: { status: "SUCCESS", payload: { holdings: [...] } }
  const attempts: Array<{ label: string; headers: Record<string, string> }> = [
    { label: "Bearer + X-API-VERSION", headers: { Authorization: `Bearer ${accessToken}`, "X-API-VERSION": "1.0" } },
    { label: "Bearer only",            headers: { Authorization: `Bearer ${accessToken}` } },
  ];

  const debugLog: string[] = [];

  for (const attempt of attempts) {
    let res: Response;
    try {
      res = await fetchWithTimeout(GROWW_HOLDINGS_URL, {
        method: "GET",
        headers: { Accept: "application/json", ...attempt.headers },
        cache: "no-store",
      });
    } catch (e: any) {
      const msg = e.name === "AbortError" ? "timeout after 8s" : e.message;
      debugLog.push(`[${attempt.label}] network error: ${msg}`);
      console.log(`[Groww] ${attempt.label} → ${msg}`);
      continue;
    }

    const rawText = await res.text().catch(() => "");
    let json: any = null;
    try { json = JSON.parse(rawText); } catch {}

    console.log(`[Groww] ${attempt.label} → HTTP ${res.status} | body: ${rawText.slice(0, 400)}`);
    debugLog.push(`[${attempt.label}] status=${res.status} body=${rawText.slice(0, 200)}`);

    if (res.ok && json) {
      // CONFIRMED Groww API response shape:
      // { status: "SUCCESS", payload: { holdings: [ { trading_symbol, quantity, average_price, ... } ] } }
      const rawHoldings: any[] =
        json?.payload?.holdings ??   // ← real shape confirmed by live test
        json?.holdings ??
        json?.data?.holdings ??
        [];

      if (!Array.isArray(rawHoldings)) {
        throw new Error(
          `Groww API returned unexpected shape. Keys: ${Object.keys(json).join(", ")} | Full: ${rawText.slice(0, 400)}`
        );
      }

      console.log(`[Groww] ✅ ${rawHoldings.length} holdings via [${attempt.label}]`);
      if (rawHoldings[0]) console.log(`[Groww] Sample:`, JSON.stringify(rawHoldings[0]));

      // Field names confirmed from live API response
      return rawHoldings
        .map((h: any) => ({
          symbol:      (h.trading_symbol ?? h.tradingSymbol ?? h.symbol ?? "").toUpperCase().trim(),
          assetType:   "stock" as const,
          quantity:    Number(h.quantity ?? h.demat_free_quantity ?? 0),
          avgBuyPrice: Number(h.average_price ?? h.averagePrice ?? 0),
          isin:        h.isin ?? undefined,
          exchange:    (h.tradable_exchanges?.[0] ?? h.exchange ?? "NSE"),
          currency:    "INR",
          broker:      "groww",
        }))
        .filter((h) => h.symbol && h.quantity > 0);
    }

    if (res.status === 401 || res.status === 403) continue;
    if (res.status === 429) throw new Error("Groww API: Rate limit hit. Please wait a moment.");

    throw new Error(`Groww API error (${res.status}): ${rawText.slice(0, 300)}`);
  }

  throw new Error(
    `Groww authentication failed.\n\nDebug:\n${debugLog.join("\n")}\n\n` +
    `Possible causes:\n` +
    `1. Token expired (resets daily at 6 AM IST) — generate a fresh one\n` +
    `2. Trading API subscription not active on your Groww account`
  );
}



// ─── Groww auth: API Key + Secret → Access Token ─────────────────────────────
// The growwapi Python library calls:
//   POST https://api.groww.in/v1/login/refresh
// with api_key + checksum. We replicate it here in TypeScript.

async function getAccessTokenFromKeys(apiKey: string, secret: string): Promise<string> {
  // Groww's token endpoint (community-documented)
  const TOKEN_URL = "https://api.groww.in/v1/login/refresh";

  // The Groww Python SDK computes checksum as: SHA256(api_key + secret + timestamp)
  // We replicate this using Node.js crypto (available in Next.js server)
  const crypto = await import("node:crypto");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const rawStr = `${apiKey}${secret}${timestamp}`;
  const checksum = crypto.createHash("sha256").update(rawStr).digest("hex");

  let res: Response;
  try {
    res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ api_key: apiKey, checksum, timestamp }),
      cache: "no-store",
    });
  } catch {
    throw new Error("Could not reach Groww authentication server.");
  }

  if (!res.ok) {
    let errBody = "";
    try { errBody = await res.text(); } catch {}
    throw new Error(
      `Groww auth failed (${res.status}): ${errBody || "Invalid API key or secret."}`
    );
  }

  const json = await res.json();
  const token =
    json?.data?.access_token ??
    json?.access_token ??
    json?.token;

  if (!token) {
    throw new Error(
      "Groww did not return an access token. Check your API Key and Secret."
    );
  }

  return token as string;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getSession(req: NextRequest) {
  return auth.api.getSession({ headers: req.headers });
}

// ─── GET: connection status ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const record = await GrowwMCPModel.findOne({ userId: session.user.id });

  if (!record) return NextResponse.json({ connected: false });

  return NextResponse.json({
    connected: true,
    maskedKey: record.maskedKey,
    mode: record.mode,
    lastSynced: record.lastSynced?.toISOString(),
    holdingsCount: record.holdingsCount,
  });
}

// ─── POST: connect / sync / disconnect ───────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  await connectToDatabase();

  // ── CONNECT ────────────────────────────────────────────────────────────────
  if (action === "connect") {
    const mode: "access_token" | "api_key" = body.mode ?? "access_token";
    let accessToken: string;
    let maskedKey: string;
    let encryptedApiKey: string | undefined;
    let encryptedSecret: string | undefined;

    try {
      if (mode === "access_token") {
        const { accessToken: rawToken } = body;
        if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length < 8) {
          return NextResponse.json(
            { error: "Please provide a valid Groww access token." },
            { status: 400 }
          );
        }
        accessToken = rawToken.trim();
        maskedKey = mask(accessToken);
      } else {
        // api_key + secret mode
        const { apiKey, apiSecret } = body;
        if (!apiKey || !apiSecret) {
          return NextResponse.json(
            { error: "Both API Key and Secret are required." },
            { status: 400 }
          );
        }
        // Exchange keys for access token
        accessToken = await getAccessTokenFromKeys(apiKey.trim(), apiSecret.trim());
        maskedKey = mask(apiKey.trim());
        encryptedApiKey = apiKey.trim();   // TODO: encrypt in production
        encryptedSecret = apiSecret.trim(); // TODO: encrypt in production
      }

      // Validate by fetching actual holdings
      const holdings = await fetchGrowwHoldings(accessToken);

      // Persist credentials
      await GrowwMCPModel.findOneAndUpdate(
        { userId: session.user.id },
        {
          encryptedToken: accessToken, // TODO: encrypt with AES-256 / KMS in prod
          encryptedApiKey,
          encryptedSecret,
          maskedKey,
          mode,
          holdingsCount: holdings.length,
          lastSynced: new Date(),
        },
        { upsert: true, new: true }
      );

      // Import into ExternalPortfolio
      const assets = holdings.map((h) => ({
        symbol:      h.symbol,
        assetType:   h.assetType,
        quantity:    h.quantity,
        avgBuyPrice: h.avgBuyPrice,
        currency:    "INR",
        broker:      "groww",
      }));

      await ExternalPortfolio.findOneAndUpdate(
        { userId: session.user.id },
        { $set: { assets } },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        message: `Connected! ${holdings.length} holdings fetched from Groww and imported into your portfolio.`,
        holdings,
        status: {
          connected: true,
          maskedKey,
          mode,
          lastSynced: new Date().toISOString(),
          holdingsCount: holdings.length,
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Failed to connect to Groww" },
        { status: 422 }
      );
    }
  }

  // ── SYNC ───────────────────────────────────────────────────────────────────
  if (action === "sync") {
    const record = await GrowwMCPModel.findOne({ userId: session.user.id });
    if (!record) {
      return NextResponse.json(
        { error: "Not connected to Groww. Please connect first." },
        { status: 400 }
      );
    }

    try {
      let accessToken = record.encryptedToken;

      // If API Key mode, refresh the access token first
      if (record.mode === "api_key" && record.encryptedApiKey && record.encryptedSecret) {
        try {
          accessToken = await getAccessTokenFromKeys(
            record.encryptedApiKey,
            record.encryptedSecret
          );
          // Save the refreshed token
          await GrowwMCPModel.findOneAndUpdate(
            { userId: session.user.id },
            { encryptedToken: accessToken }
          );
        } catch {
          // Fall back to stored token if refresh fails
        }
      }

      const holdings = await fetchGrowwHoldings(accessToken);

      await GrowwMCPModel.findOneAndUpdate(
        { userId: session.user.id },
        { holdingsCount: holdings.length, lastSynced: new Date() }
      );

      const assets = holdings.map((h) => ({
        symbol:      h.symbol,
        assetType:   h.assetType,
        quantity:    h.quantity,
        avgBuyPrice: h.avgBuyPrice,
        currency:    "INR",
        broker:      "groww",
      }));

      await ExternalPortfolio.findOneAndUpdate(
        { userId: session.user.id },
        { $set: { assets } },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        message: `Portfolio synced! ${holdings.length} holdings updated from Groww.`,
        holdings,
        status: {
          connected: true,
          maskedKey: record.maskedKey,
          mode: record.mode,
          lastSynced: new Date().toISOString(),
          holdingsCount: holdings.length,
        },
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Failed to sync Groww portfolio" },
        { status: 422 }
      );
    }
  }

  // ── DISCONNECT ─────────────────────────────────────────────────────────────
  if (action === "disconnect") {
    await GrowwMCPModel.deleteOne({ userId: session.user.id });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
