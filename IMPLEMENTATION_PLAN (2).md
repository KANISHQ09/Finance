# 🚀 FinNext — Complete Implementation Plan
### 4 Killer Features + Lyzr → Claude AI Migration
> Stack: Next.js 15 · TypeScript · MongoDB · BetterAuth · Finnhub · Inngest · Anthropic Claude API

---

## 📋 Table of Contents

1. [LLM Migration: Lyzr → Claude AI](#phase-0-llm-migration-lyzr--claude-ai)
2. [Task 1: Universal Portfolio Aggregator](#task-1-universal-portfolio-aggregator)
3. [Task 2: Agentic UI (NL Interface Manipulation)](#task-2-agentic-ui-natural-language-interface-manipulation)
4. [Task 3: Risk-Free Strategy Sandbox (Paper Trading)](#task-3-risk-free-strategy-sandbox-paper-trading)
5. [Task 4: AI Portfolio Audit & Forecasting](#task-4-ai-portfolio-audit--forecasting)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Deployment Checklist](#deployment-checklist)

---

## Phase 0 — LLM Migration: Lyzr → Claude AI

### Why Replace Lyzr?
Lyzr uses separate agent IDs + API keys per agent, tightly coupling your business logic to a third-party orchestration layer. Claude's API gives you full prompt control, structured JSON tool-use outputs, streaming, and no per-agent licensing costs.

### Step 1 — Install Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

### Step 2 — Create a Unified AI Client

Create `lib/claude.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
```

### Step 3 — Create a Generic Agent Runner

Create `lib/agents/runAgent.ts`:

```typescript
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";

interface AgentOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
}

export async function runAgent({ systemPrompt, userMessage, maxTokens = 1500 }: AgentOptions): Promise<string> {
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}
```

### Step 4 — Migrate Each Agent Route

#### Old Lyzr pattern (app/api/agents/portfolio/route.ts):
```typescript
// ❌ OLD — Remove this
const res = await fetch("https://agent.api.lyzr.ai/v3/inference/chat/", {
  headers: { "x-api-key": process.env.PORTFOLIO_AGENT_API_KEY! },
  body: JSON.stringify({ agent_id: "692726db642e89081dd9da52", message }),
});
```

#### New Claude pattern — replace all 6 agent routes:

**`app/api/agents/portfolio/route.ts`**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runAgent";

export async function POST(req: NextRequest) {
  const { portfolio } = await req.json();
  const result = await runAgent({
    systemPrompt: `You are an elite portfolio analysis AI for FinNext. Analyze the user's stock portfolio and provide:
    1. Diversification score (0-100)
    2. Sector allocation breakdown (%)
    3. Top 3 concentration risks
    4. Rebalancing recommendations
    Output as structured JSON: { score, sectors, risks, recommendations }`,
    userMessage: `Analyze this portfolio: ${JSON.stringify(portfolio)}`,
  });
  return NextResponse.json({ result });
}
```

**`app/api/agents/risk/route.ts`**
```typescript
import { runAgent } from "@/lib/agents/runAgent";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { portfolio, userProfile } = await req.json();
  const result = await runAgent({
    systemPrompt: `You are a financial risk analyst. Compute a personalized risk score (1-10) based on portfolio volatility, beta, and user profile. Return JSON: { riskScore, volatilityRating, betaExposure, hedgingSuggestions }`,
    userMessage: `Portfolio: ${JSON.stringify(portfolio)}\nUser profile: ${JSON.stringify(userProfile)}`,
  });
  return NextResponse.json({ result });
}
```

**`app/api/agents/sentiment/route.ts`**
```typescript
import { runAgent } from "@/lib/agents/runAgent";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { tickers, newsHeadlines } = await req.json();
  const result = await runAgent({
    systemPrompt: `You are a market sentiment analyst. Analyze news headlines and ticker activity to produce a sentiment summary. Return JSON: { overallSentiment, tickerSentiments: [{ ticker, score, reason }], marketMood }`,
    userMessage: `Tickers: ${tickers.join(", ")}\nHeadlines: ${newsHeadlines.join("\n")}`,
  });
  return NextResponse.json({ result });
}
```

**`app/api/agents/forecast/route.ts`**
```typescript
import { runAgent } from "@/lib/agents/runAgent";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { ticker, historicalData } = await req.json();
  const result = await runAgent({
    systemPrompt: `You are a quantitative forecasting AI. Based on historical price data and market trends, generate a 30-day price forecast corridor. Return JSON: { ticker, forecastDays: [{ day, low, mid, high }], confidence, keyDrivers }`,
    userMessage: `Ticker: ${ticker}\nHistorical data (last 90 days): ${JSON.stringify(historicalData)}`,
    maxTokens: 2000,
  });
  return NextResponse.json({ result });
}
```

**`app/api/agents/screener/route.ts`**
```typescript
import { runAgent } from "@/lib/agents/runAgent";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { criteria, marketData } = await req.json();
  const result = await runAgent({
    systemPrompt: `You are a stock screener AI. Filter and rank stocks based on the given technical and fundamental criteria. Return JSON: { matches: [{ ticker, score, reasons }], appliedFilters }`,
    userMessage: `Criteria: ${JSON.stringify(criteria)}\nMarket data: ${JSON.stringify(marketData)}`,
  });
  return NextResponse.json({ result });
}
```

**`app/api/agents/recommendation/route.ts`**
```typescript
import { runAgent } from "@/lib/agents/runAgent";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { portfolio, riskProfile, goals } = await req.json();
  const result = await runAgent({
    systemPrompt: `You are a holistic investment advisor AI. Provide actionable buy/sell/hold recommendations. Return JSON: { recommendations: [{ ticker, action, rationale, targetPrice }], summary }`,
    userMessage: `Portfolio: ${JSON.stringify(portfolio)}\nRisk: ${riskProfile}\nGoals: ${goals}`,
  });
  return NextResponse.json({ result });
}
```

### Step 5 — Remove Lyzr Environment Variables

Delete from `.env`:
```
PORTFOLIO_AGENT_API_KEY=...
RISK_AGENT_API_KEY=...
SENTIMENT_AGENT_API_KEY=...
FORECAST_AGENT_API_KEY=...
SCREENER_AGENT_API_KEY=...
RECOMMENDATION_AGENT_API_KEY=...
```

Add to `.env`:
```
ANTHROPIC_API_KEY=your_claude_api_key_here
```

---

## Task 1 — Universal Portfolio Aggregator

### MongoDB Schema

Create `database/models/ExternalPortfolio.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IExternalAsset {
  symbol: string;
  assetType: "stock" | "crypto" | "gold" | "real_estate" | "mutual_fund" | "other";
  quantity: number;
  avgBuyPrice: number;
  currency: string;
  broker?: string;          // "Groww" | "Zerodha" | "AngelOne" | "manual"
  currentPrice?: number;
  lastUpdated?: Date;
  notes?: string;
}

export interface IExternalPortfolio extends Document {
  userId: string;
  assets: IExternalAsset[];
  createdAt: Date;
  updatedAt: Date;
}

const ExternalAssetSchema = new Schema<IExternalAsset>({
  symbol:      { type: String, required: true },
  assetType:   { type: String, enum: ["stock","crypto","gold","real_estate","mutual_fund","other"], required: true },
  quantity:    { type: Number, required: true },
  avgBuyPrice: { type: Number, required: true },
  currency:    { type: String, default: "INR" },
  broker:      { type: String },
  currentPrice:{ type: Number },
  lastUpdated: { type: Date, default: Date.now },
  notes:       { type: String },
});

const ExternalPortfolioSchema = new Schema<IExternalPortfolio>(
  { userId: { type: String, required: true, index: true }, assets: [ExternalAssetSchema] },
  { timestamps: true }
);

export const ExternalPortfolio =
  mongoose.models.ExternalPortfolio ||
  mongoose.model<IExternalPortfolio>("ExternalPortfolio", ExternalPortfolioSchema);
```

### API Routes

**`app/api/portfolio/external/route.ts`** (GET + POST)
```typescript
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ExternalPortfolio } from "@/database/models/ExternalPortfolio";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const portfolio = await ExternalPortfolio.findOne({ userId: session.user.id });
  return NextResponse.json({ assets: portfolio?.assets ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assets } = await req.json();
  await connectDB();

  const portfolio = await ExternalPortfolio.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { assets } },
    { upsert: true, new: true }
  );
  return NextResponse.json({ success: true, portfolio });
}
```

**`app/api/portfolio/import-csv/route.ts`** (CSV Parser)
```typescript
import { NextRequest, NextResponse } from "next/server";

// Supported CSV formats: Groww, Zerodha, AngelOne
// Normalizes all to IExternalAsset shape
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const broker = formData.get("broker") as string;

  const text = await file.text();
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

  const fieldMap: Record<string, Record<string, string>> = {
    groww:    { symbol: "symbol", quantity: "quantity", avgBuyPrice: "average price" },
    zerodha:  { symbol: "tradingsymbol", quantity: "quantity", avgBuyPrice: "average_price" },
    angelone: { symbol: "symbol", quantity: "netqty", avgBuyPrice: "avgnetprice" },
  };

  const map = fieldMap[broker.toLowerCase()] ?? fieldMap.groww;

  const assets = lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim().replace(/"/g, ""));
    const get = (key: string) => cols[headers.indexOf(map[key])] ?? "";
    return {
      symbol:      get("symbol").toUpperCase(),
      assetType:   "stock" as const,
      quantity:    parseFloat(get("quantity")) || 0,
      avgBuyPrice: parseFloat(get("avgBuyPrice")) || 0,
      currency:    "INR",
      broker,
    };
  }).filter(a => a.symbol && a.quantity > 0);

  return NextResponse.json({ assets });
}
```

### Frontend Component

Create `components/portfolio/UniversalImport.tsx`:

```typescript
"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Plus, Trash2 } from "lucide-react";

type AssetType = "stock" | "crypto" | "gold" | "real_estate" | "mutual_fund" | "other";

interface Asset {
  symbol: string; assetType: AssetType; quantity: number;
  avgBuyPrice: number; currency: string; broker: string;
}

export function UniversalImport({ onAssetsChange }: { onAssetsChange: (assets: Asset[]) => void }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [broker, setBroker] = useState("groww");
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("broker", broker);
    const res = await fetch("/api/portfolio/import-csv", { method: "POST", body: formData });
    const { assets: imported } = await res.json();
    const merged = [...assets, ...imported];
    setAssets(merged);
    onAssetsChange(merged);
    setIsUploading(false);
  };

  const addManual = () => {
    const blank: Asset = { symbol: "", assetType: "stock", quantity: 0, avgBuyPrice: 0, currency: "INR", broker: "manual" };
    setAssets(prev => [...prev, blank]);
  };

  const updateAsset = (i: number, field: keyof Asset, value: string | number) => {
    setAssets(prev => {
      const updated = [...prev];
      (updated[i] as any)[field] = value;
      onAssetsChange(updated);
      return updated;
    });
  };

  const removeAsset = (i: number) => {
    setAssets(prev => { const n = prev.filter((_, idx) => idx !== i); onAssetsChange(n); return n; });
  };

  const saveToServer = async () => {
    await fetch("/api/portfolio/external", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets }),
    });
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-400" />
          Universal Portfolio Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CSV Upload */}
        <div className="flex gap-2">
          <Select value={broker} onValueChange={setBroker}>
            <SelectTrigger className="w-36 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="groww">Groww</SelectItem>
              <SelectItem value="zerodha">Zerodha</SelectItem>
              <SelectItem value="angelone">Angel One</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-blue-600 text-blue-400"
            onClick={() => fileRef.current?.click()} disabled={isUploading}>
            {isUploading ? "Importing..." : "Upload CSV"}
          </Button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
        </div>

        {/* Asset Table */}
        {assets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead><tr className="border-b border-gray-700">
                <th className="text-left py-2">Symbol</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Qty</th>
                <th className="text-left py-2">Avg Price</th>
                <th className="text-left py-2">Broker</th>
                <th />
              </tr></thead>
              <tbody>
                {assets.map((a, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td><Input value={a.symbol} onChange={e => updateAsset(i, "symbol", e.target.value)}
                      className="bg-transparent border-0 text-white h-8" /></td>
                    <td>
                      <Select value={a.assetType} onValueChange={v => updateAsset(i, "assetType", v)}>
                        <SelectTrigger className="bg-transparent border-0 text-white h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["stock","crypto","gold","real_estate","mutual_fund","other"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td><Input type="number" value={a.quantity} onChange={e => updateAsset(i, "quantity", parseFloat(e.target.value))}
                      className="bg-transparent border-0 text-white h-8 w-20" /></td>
                    <td><Input type="number" value={a.avgBuyPrice} onChange={e => updateAsset(i, "avgBuyPrice", parseFloat(e.target.value))}
                      className="bg-transparent border-0 text-white h-8 w-24" /></td>
                    <td className="text-gray-500 text-xs">{a.broker}</td>
                    <td><Button variant="ghost" size="sm" onClick={() => removeAsset(i)}>
                      <Trash2 className="h-4 w-4 text-red-400" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addManual} className="border-gray-600 text-gray-300">
            <Plus className="h-4 w-4 mr-1" /> Add Manual Asset
          </Button>
          {assets.length > 0 && (
            <Button size="sm" onClick={saveToServer} className="bg-blue-600 hover:bg-blue-700">
              Save Portfolio
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Dashboard Integration

In your main dashboard page (`app/dashboard/page.tsx`), merge external + Finnhub data:

```typescript
// Fetch external assets + live prices
const [externalAssets, setExternalAssets] = useState<Asset[]>([]);

// On load
useEffect(() => {
  fetch("/api/portfolio/external")
    .then(r => r.json())
    .then(({ assets }) => setExternalAssets(assets));
}, []);

// Merge for unified netWorth view
const unifiedPortfolio = useMemo(() => {
  const fromFinnhub = watchlistStocks.map(s => ({
    symbol: s.ticker, currentPrice: s.price, quantity: s.shares,
    assetType: "stock", broker: "FinNext",
  }));
  return [...fromFinnhub, ...externalAssets];
}, [watchlistStocks, externalAssets]);
```

---

## Task 2 — Agentic UI (Natural Language Interface Manipulation)

### Action Type System

Create `types/chatActions.ts`:

```typescript
export type DashboardAction =
  | { action: "FILTER_SECTOR"; payload: string }
  | { action: "SORT_BY"; payload: "performance" | "risk" | "value" | "alphabetical" }
  | { action: "SHOW_CHART"; payload: { ticker: string; period: "1D" | "1W" | "1M" | "3M" | "1Y" } }
  | { action: "HIGHLIGHT_STOCKS"; payload: string[] }
  | { action: "COMPARE_STOCKS"; payload: string[] }
  | { action: "SET_TIMEFRAME"; payload: "1D" | "1W" | "1M" | "3M" | "1Y" }
  | { action: "SHOW_TOP_N"; payload: number }
  | { action: "RESET_FILTERS"; payload: null }
  | { action: "NONE"; payload: null };

export interface ChatResponse {
  message: string;
  dashboardAction?: DashboardAction;
}
```

### Agentic Chat API Route

Create `app/api/chat/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";

const SYSTEM_PROMPT = `You are FinNext's intelligent dashboard assistant.

When the user gives a command related to the dashboard (filtering, sorting, viewing, comparing stocks), you MUST respond with a JSON object containing:
1. "message" — your natural language response (1-2 sentences)
2. "dashboardAction" — a structured action object

Available actions:
- FILTER_SECTOR: { action: "FILTER_SECTOR", payload: "Tech" | "Finance" | "Health" | "Energy" | "Consumer" }
- SORT_BY: { action: "SORT_BY", payload: "performance" | "risk" | "value" | "alphabetical" }
- SHOW_CHART: { action: "SHOW_CHART", payload: { ticker: "AAPL", period: "1M" } }
- HIGHLIGHT_STOCKS: { action: "HIGHLIGHT_STOCKS", payload: ["AAPL", "MSFT"] }
- COMPARE_STOCKS: { action: "COMPARE_STOCKS", payload: ["AAPL", "GOOGL"] }
- SHOW_TOP_N: { action: "SHOW_TOP_N", payload: 5 }
- RESET_FILTERS: { action: "RESET_FILTERS", payload: null }
- NONE: { action: "NONE", payload: null } — for conversational questions

Always respond with ONLY valid JSON. No markdown, no extra text. Example:
{"message":"Filtering your portfolio to show only tech stocks.","dashboardAction":{"action":"FILTER_SECTOR","payload":"Tech"}}`;

export async function POST(req: NextRequest) {
  const { message, portfolioContext } = await req.json();

  const userContent = portfolioContext
    ? `Context — my portfolio tickers: ${portfolioContext.tickers?.join(", ")}\n\nUser message: ${message}`
    : message;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text : "{}";
  try {
    const parsed = JSON.parse(rawText);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ message: rawText, dashboardAction: { action: "NONE", payload: null } });
  }
}
```

### Upgraded Chatbot Component

Replace / upgrade `components/Chatbot.tsx`:

```typescript
"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, Sparkles } from "lucide-react";
import type { DashboardAction, ChatResponse } from "@/types/chatActions";

interface Message {
  role: "user" | "assistant";
  content: string;
  action?: DashboardAction;
}

interface ChatbotProps {
  portfolioTickers: string[];
  onDashboardAction: (action: DashboardAction) => void;
}

export function Chatbot({ portfolioTickers, onDashboardAction }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I can control your dashboard. Try: \"Show me my tech stocks\" or \"Compare AAPL and MSFT\"" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, portfolioContext: { tickers: portfolioTickers } }),
      });
      const data: ChatResponse = await res.json();

      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.message,
        action: data.dashboardAction,
      }]);

      if (data.dashboardAction && data.dashboardAction.action !== "NONE") {
        onDashboardAction(data.dashboardAction);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800">
      <div className="flex items-center gap-2 p-4 border-b border-gray-800">
        <Bot className="h-5 w-5 text-blue-400" />
        <h2 className="text-white font-semibold">AI Dashboard Assistant</h2>
        <span className="ml-auto text-xs text-blue-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Agentic UI
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-200"
            }`}>
              {msg.content}
              {msg.action && msg.action.action !== "NONE" && (
                <div className="mt-2 text-xs text-blue-300 border-t border-blue-800 pt-1">
                  ⚡ Action: {msg.action.action.replace(/_/g, " ")}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-xl px-4 py-2 text-gray-400 text-sm animate-pulse">Thinking...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-gray-800 flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Command your dashboard..."
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500" />
        <Button onClick={sendMessage} disabled={isLoading} size="icon" className="bg-blue-600 hover:bg-blue-700">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### Dashboard Action Handler

In your dashboard page, handle the action dispatch:

```typescript
// Dashboard state
const [sectorFilter, setSectorFilter] = useState<string | null>(null);
const [sortBy, setSortBy] = useState<string>("value");
const [highlightedTickers, setHighlightedTickers] = useState<string[]>([]);
const [compareMode, setCompareMode] = useState<string[]>([]);
const [topN, setTopN] = useState<number | null>(null);

const handleDashboardAction = (action: DashboardAction) => {
  switch (action.action) {
    case "FILTER_SECTOR":     setSectorFilter(action.payload); break;
    case "SORT_BY":           setSortBy(action.payload); break;
    case "HIGHLIGHT_STOCKS":  setHighlightedTickers(action.payload); break;
    case "COMPARE_STOCKS":    setCompareMode(action.payload); break;
    case "SHOW_TOP_N":        setTopN(action.payload); break;
    case "RESET_FILTERS":
      setSectorFilter(null); setSortBy("value");
      setHighlightedTickers([]); setCompareMode([]); setTopN(null);
      break;
  }
};

// Pass to chatbot
<Chatbot portfolioTickers={allTickers} onDashboardAction={handleDashboardAction} />
```

---

## Task 3 — Risk-Free Strategy Sandbox (Paper Trading)

### MongoDB Schema

Create `database/models/Sandbox.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface ISandboxPosition {
  ticker: string;
  companyName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  openedAt: Date;
}

export interface ISandbox extends Document {
  userId: string;
  virtualBalance: number;
  initialBalance: number;
  positions: ISandboxPosition[];
  transactions: {
    ticker: string; action: "BUY" | "SELL";
    quantity: number; price: number; total: number; executedAt: Date;
  }[];
  totalPnL: number;
  createdAt: Date;
  updatedAt: Date;
}

const SandboxSchema = new Schema<ISandbox>({
  userId:         { type: String, required: true, unique: true, index: true },
  virtualBalance: { type: Number, default: 100000 },   // ₹1,00,000 default
  initialBalance: { type: Number, default: 100000 },
  positions:      [{ type: Schema.Types.Mixed }],
  transactions:   [{ type: Schema.Types.Mixed }],
  totalPnL:       { type: Number, default: 0 },
}, { timestamps: true });

export const Sandbox =
  mongoose.models.Sandbox ||
  mongoose.model<ISandbox>("Sandbox", SandboxSchema);
```

### API Routes

**`app/api/sandbox/route.ts`** (GET sandbox state):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Sandbox } from "@/database/models/Sandbox";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();

  let sandbox = await Sandbox.findOne({ userId: session.user.id });
  if (!sandbox) {
    sandbox = await Sandbox.create({ userId: session.user.id });
  }
  return NextResponse.json(sandbox);
}
```

**`app/api/sandbox/trade/route.ts`** (BUY/SELL):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Sandbox } from "@/database/models/Sandbox";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticker, action, quantity, currentPrice, companyName } = await req.json();
  const total = quantity * currentPrice;

  await connectDB();
  const sandbox = await Sandbox.findOne({ userId: session.user.id });
  if (!sandbox) return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });

  if (action === "BUY") {
    if (sandbox.virtualBalance < total)
      return NextResponse.json({ error: "Insufficient virtual balance" }, { status: 400 });

    sandbox.virtualBalance -= total;
    const existingPos = sandbox.positions.find((p: any) => p.ticker === ticker);
    if (existingPos) {
      const newQty = existingPos.quantity + quantity;
      existingPos.avgBuyPrice = ((existingPos.avgBuyPrice * existingPos.quantity) + total) / newQty;
      existingPos.quantity = newQty;
    } else {
      sandbox.positions.push({ ticker, companyName, quantity, avgBuyPrice: currentPrice, currentPrice, pnl: 0, pnlPercent: 0, openedAt: new Date() });
    }
  }

  if (action === "SELL") {
    const pos = sandbox.positions.find((p: any) => p.ticker === ticker);
    if (!pos || pos.quantity < quantity)
      return NextResponse.json({ error: "Insufficient position" }, { status: 400 });

    const pnl = (currentPrice - pos.avgBuyPrice) * quantity;
    sandbox.virtualBalance += total;
    sandbox.totalPnL += pnl;
    pos.quantity -= quantity;
    if (pos.quantity === 0) {
      sandbox.positions = sandbox.positions.filter((p: any) => p.ticker !== ticker);
    }
  }

  sandbox.transactions.push({ ticker, action, quantity, price: currentPrice, total, executedAt: new Date() });
  sandbox.markModified("positions");
  sandbox.markModified("transactions");
  await sandbox.save();

  return NextResponse.json({ success: true, sandbox });
}
```

### Frontend Components

**`components/sandbox/SandboxDashboard.tsx`**:
```typescript
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, FlaskConical } from "lucide-react";

export function SandboxDashboard() {
  const [sandbox, setSandbox] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sandbox").then(r => r.json()).then(data => {
      setSandbox(data); setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-gray-400 animate-pulse">Loading sandbox...</div>;

  const portfolioValue = sandbox.positions.reduce(
    (sum: number, p: any) => sum + (p.currentPrice * p.quantity), 0
  );
  const totalValue = sandbox.virtualBalance + portfolioValue;
  const totalReturn = ((totalValue - sandbox.initialBalance) / sandbox.initialBalance) * 100;

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Virtual Balance", value: `₹${sandbox.virtualBalance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "text-white" },
          { label: "Portfolio Value", value: `₹${portfolioValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "text-blue-400" },
          { label: "Total Value", value: `₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "text-white" },
          { label: "Total Return", value: `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%`, color: totalReturn >= 0 ? "text-green-400" : "text-red-400" },
        ].map(stat => (
          <Card key={stat.label} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <p className="text-gray-400 text-xs">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Positions */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-400" /> Open Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sandbox.positions.length === 0 ? (
            <p className="text-gray-500 text-sm">No open positions. Use "Test in Sandbox" from chat insights.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-700 text-gray-400">
                <th className="text-left py-2">Ticker</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Avg Price</th>
                <th className="text-right py-2">Current</th>
                <th className="text-right py-2">P&L</th>
              </tr></thead>
              <tbody>
                {sandbox.positions.map((pos: any) => {
                  const pnl = (pos.currentPrice - pos.avgBuyPrice) * pos.quantity;
                  const pnlPct = ((pos.currentPrice - pos.avgBuyPrice) / pos.avgBuyPrice) * 100;
                  return (
                    <tr key={pos.ticker} className="border-b border-gray-800">
                      <td className="py-2 text-white font-medium">{pos.ticker}</td>
                      <td className="py-2 text-right text-gray-300">{pos.quantity}</td>
                      <td className="py-2 text-right text-gray-300">₹{pos.avgBuyPrice.toFixed(2)}</td>
                      <td className="py-2 text-right text-gray-300">₹{pos.currentPrice.toFixed(2)}</td>
                      <td className={`py-2 text-right font-medium ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(0)} ({pnlPct.toFixed(1)}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**`components/sandbox/SandboxTradeButton.tsx`** (inline in chat/insight cards):
```typescript
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlaskConical, Loader2 } from "lucide-react";

interface SandboxTradeButtonProps {
  ticker: string;
  currentPrice: number;
  companyName: string;
  suggestedAction?: "BUY" | "SELL";
  suggestedQuantity?: number;
}

export function SandboxTradeButton({
  ticker, currentPrice, companyName,
  suggestedAction = "BUY", suggestedQuantity = 10
}: SandboxTradeButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const executeTrade = async () => {
    setStatus("loading");
    const res = await fetch("/api/sandbox/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, action: suggestedAction, quantity: suggestedQuantity, currentPrice, companyName }),
    });
    setStatus(res.ok ? "done" : "error");
    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <Button variant="outline" size="sm" onClick={executeTrade} disabled={status === "loading"}
      className="border-purple-600 text-purple-400 hover:bg-purple-950 text-xs gap-1">
      {status === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : <FlaskConical className="h-3 w-3" />}
      {status === "done" ? "✓ Added to Sandbox!" : status === "error" ? "Failed" : "Test in Sandbox"}
    </Button>
  );
}
```

---

## Task 4 — AI Portfolio Audit & Forecasting Report

### AI Audit API Route

Create `app/api/audit/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const { portfolio, marketData } = await req.json();

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 3000,
    system: `You are an institutional-grade portfolio auditor. Analyze the given portfolio deeply and return ONLY a JSON object with this exact structure:
{
  "overallScore": 72,
  "riskLevel": "HIGH",
  "summary": "Two-sentence executive summary",
  "sectorAllocation": [{ "sector": "Technology", "percentage": 65, "benchmark": 28, "status": "OVER" }],
  "topRisks": [{ "risk": "Over-concentration in Tech", "severity": "HIGH", "recommendation": "..." }],
  "topOpportunities": [{ "opportunity": "Underweight Financials", "action": "Consider adding HDFC Bank" }],
  "forecast30Days": [{ "day": 1, "pessimistic": 98000, "base": 100000, "optimistic": 102500 }],
  "exportSummary": "Plain-text paragraph suitable for PDF export"
}
Forecast must have 30 data points. All monetary values in user's currency.`,
    messages: [{
      role: "user",
      content: `Portfolio: ${JSON.stringify(portfolio)}\nMarket context: ${JSON.stringify(marketData)}\nCurrency: INR`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(clean));
  } catch {
    return NextResponse.json({ error: "Parse failed", raw: text }, { status: 500 });
  }
}
```

### Audit Dashboard Component

Create `components/audit/AuditReport.tsx`:

```typescript
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileText, Loader2, ShieldAlert, TrendingUp, Download } from "lucide-react";

interface AuditReportProps {
  portfolio: any[];
  marketData: any;
}

export function AuditReport({ portfolio, marketData }: AuditReportProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateAudit = async () => {
    setLoading(true);
    const res = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolio, marketData }),
    });
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  const exportPDF = async () => {
    // Dynamic import to avoid SSR issues
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("FinNext Portfolio Audit Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Overall Score: ${report.overallScore}/100`, 20, 40);
    doc.text(`Risk Level: ${report.riskLevel}`, 20, 50);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(report.exportSummary ?? report.summary, 170);
    doc.text(lines, 20, 65);
    report.topRisks?.forEach((r: any, i: number) => {
      doc.text(`Risk ${i+1}: ${r.risk} — ${r.recommendation}`, 20, 100 + i * 15);
    });
    doc.save("FinNext-Audit-Report.pdf");
  };

  const riskColor = (level: string) =>
    ({ LOW: "bg-green-900 text-green-300", MEDIUM: "bg-yellow-900 text-yellow-300", HIGH: "bg-red-900 text-red-300" }[level] ?? "bg-gray-800 text-gray-300");

  return (
    <div className="space-y-6">
      {/* Trigger Button */}
      <Button onClick={generateAudit} disabled={loading}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        {loading ? "Generating AI Audit..." : "Generate AI Portfolio Audit"}
      </Button>

      {report && (
        <div className="space-y-4">
          {/* Score + Risk */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-900 border-gray-800 col-span-1">
              <CardContent className="p-6 text-center">
                <div className="text-5xl font-bold text-white mb-1">{report.overallScore}</div>
                <div className="text-gray-400 text-sm">Portfolio Health Score</div>
                <Badge className={`mt-2 ${riskColor(report.riskLevel)}`}>{report.riskLevel} RISK</Badge>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800 col-span-2">
              <CardContent className="p-6">
                <p className="text-gray-300 text-sm leading-relaxed">{report.summary}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sector Allocation */}
          {report.sectorAllocation && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle className="text-white text-sm">Sector Allocation vs Benchmark</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.sectorAllocation.map((s: any) => (
                    <div key={s.sector} className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs w-28">{s.sector}</span>
                      <div className="flex-1 bg-gray-800 rounded-full h-2 relative">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(s.percentage, 100)}%` }} />
                        <div className="absolute top-0 bg-gray-500 h-2 w-px" style={{ left: `${s.benchmark}%` }} />
                      </div>
                      <span className={`text-xs font-medium w-16 text-right ${s.status === "OVER" ? "text-red-400" : "text-green-400"}`}>
                        {s.percentage}% {s.status === "OVER" ? "↑" : "↓"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risks & Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-400" /> Top Risks
              </CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {report.topRisks?.map((r: any, i: number) => (
                  <div key={i} className="border-l-2 border-red-800 pl-3">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-200 text-xs font-medium">{r.risk}</span>
                      <Badge className={riskColor(r.severity)} style={{ fontSize: "10px" }}>{r.severity}</Badge>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">{r.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle className="text-white text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" /> Opportunities
              </CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {report.topOpportunities?.map((o: any, i: number) => (
                  <div key={i} className="border-l-2 border-green-800 pl-3">
                    <span className="text-gray-200 text-xs font-medium">{o.opportunity}</span>
                    <p className="text-gray-500 text-xs mt-1">{o.action}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 30-Day Forecast Chart */}
          {report.forecast30Days && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">30-Day Predictive Corridor</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={report.forecast30Days}>
                    <XAxis dataKey="day" stroke="#4B5563" tick={{ fill: "#9CA3AF", fontSize: 10 }} label={{ value: "Days", position: "insideBottom", fill: "#6B7280" }} />
                    <YAxis stroke="#4B5563" tick={{ fill: "#9CA3AF", fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }}
                      formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                    <Legend />
                    <Line type="monotone" dataKey="optimistic" stroke="#10B981" strokeWidth={1.5} dot={false} name="Optimistic" />
                    <Line type="monotone" dataKey="base" stroke="#60A5FA" strokeWidth={2} dot={false} name="Base Case" strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="pessimistic" stroke="#F87171" strokeWidth={1.5} dot={false} name="Pessimistic" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Export Button */}
          <Button variant="outline" onClick={exportPDF} className="border-gray-600 text-gray-300 gap-2">
            <Download className="h-4 w-4" /> Export as PDF Report
          </Button>
        </div>
      )}
    </div>
  );
}
```

### Install PDF export dependency

```bash
npm install jspdf
```

---

## Environment Variables Reference

Final `.env` file structure after migration:

```env
# ─── Next.js & Auth ───────────────────────────────────────
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# ─── MongoDB ──────────────────────────────────────────────
MONGODB_URI=your_mongodb_connection_string

# ─── Finnhub ──────────────────────────────────────────────
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_key
FINNHUB_BASE_URL=https://finnhub.io/api/v1

# ─── Inngest & Email ──────────────────────────────────────
GEMINI_API_KEY=your_gemini_key_for_inngest
NODEMAILER_EMAIL=your_email
NODEMAILER_PASSWORD=your_app_password

# ─── Anthropic Claude (replaces ALL Lyzr keys) ────────────
ANTHROPIC_API_KEY=sk-ant-your-key-here

# ─── REMOVED (delete these) ───────────────────────────────
# PORTFOLIO_AGENT_API_KEY=...
# RISK_AGENT_API_KEY=...
# SENTIMENT_AGENT_API_KEY=...
# FORECAST_AGENT_API_KEY=...
# SCREENER_AGENT_API_KEY=...
# RECOMMENDATION_AGENT_API_KEY=...
```

---

## Deployment Checklist

```
Phase 0 — LLM Migration
  ☐ npm install @anthropic-ai/sdk
  ☐ Create lib/claude.ts
  ☐ Create lib/agents/runAgent.ts
  ☐ Replace all 6 app/api/agents/*.ts routes
  ☐ Add ANTHROPIC_API_KEY to .env + Vercel dashboard
  ☐ Delete all LYZR_* env variables
  ☐ Test all agent routes with Postman

Task 1 — Portfolio Aggregator
  ☐ Create database/models/ExternalPortfolio.ts
  ☐ Create app/api/portfolio/external/route.ts
  ☐ Create app/api/portfolio/import-csv/route.ts
  ☐ Create components/portfolio/UniversalImport.tsx
  ☐ Integrate UniversalImport into dashboard
  ☐ Test CSV upload with sample Groww/Zerodha export
  ☐ Test manual asset entry

Task 2 — Agentic UI
  ☐ Create types/chatActions.ts
  ☐ Create app/api/chat/route.ts
  ☐ Upgrade components/Chatbot.tsx
  ☐ Add action handlers to dashboard page
  ☐ Connect Chatbot to dashboard state
  ☐ Test NL commands: filter, sort, compare, reset

Task 3 — Paper Trading Sandbox
  ☐ Create database/models/Sandbox.ts
  ☐ Create app/api/sandbox/route.ts
  ☐ Create app/api/sandbox/trade/route.ts
  ☐ Create components/sandbox/SandboxDashboard.tsx
  ☐ Create components/sandbox/SandboxTradeButton.tsx
  ☐ Add SandboxTradeButton to AI insight cards
  ☐ Add /sandbox route or dashboard tab
  ☐ Test buy/sell with live Finnhub prices

Task 4 — AI Portfolio Audit
  ☐ npm install jspdf
  ☐ Create app/api/audit/route.ts
  ☐ Create components/audit/AuditReport.tsx
  ☐ Add "Generate Audit" button to main dashboard
  ☐ Verify recharts LineChart renders forecast
  ☐ Test PDF export with jsPDF
  ☐ Verify all 30 forecast data points returned

Final
  ☐ Run npm run build — zero type errors
  ☐ Deploy to Vercel
  ☐ Smoke test all 4 features in production
```

---

*Generated for FinNext by CodeNext — Built on Next.js 15 + Claude AI*
