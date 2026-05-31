# 📈 FinNext — Next-Gen AI Financial & Portfolio Intelligence

> _An enterprise-grade, multi-agent AI financial dashboard built for retail investors who deserve institutional-grade tools._

---

## 💡 Inspiration

The financial markets have always had two tiers: **institutions** with Bloomberg terminals, quantitative analysts, and AI-driven risk models — and **retail investors** armed with little more than a brokerage app and a gut feeling.

We built FinNext to collapse that gap entirely.

The inspiration came from watching everyday investors make emotionally-driven decisions — panic-selling during volatility, holding over-concentrated positions, or blindly following social media tips — not because they lacked intelligence, but because they lacked **access to the right tools**.

We asked ourselves: _What if a retail investor had the same AI-powered portfolio intelligence that a hedge fund analyst does?_ What if their chat assistant could actually analyze their real holdings, assess risk against their personal tolerance, forecast price trajectories, and screen for new opportunities — all in a single conversation?

That question became FinNext.

---

## 🔋 What It Does

FinNext is a **full-stack AI financial analytics platform** that gives retail investors institutional-grade insights through five core pillars:

### 1. 🤖 Multi-Agent AI Orchestrator
The assistant at the heart of FinNext is not a single chatbot — it's a **true multi-agent system**. When you ask a question, an intent classifier routes your message to the correct specialist agent:

| You ask... | Agent invoked |
| :--- | :--- |
| _"How risky is my portfolio?"_ | **Risk Assessment Agent** — computes risk score, beta estimate, Sharpe ratio, hedging suggestions |
| _"Analyze my portfolio"_ | **Portfolio Analysis Agent** — diversification score, sector weights, rebalancing actions |
| _"Recommend stocks for me"_ | **Recommendation Agent** — personalized buy/sell/hold picks aligned with your profile |
| _"Predict AAPL next month"_ | **Forecast Agent** — 30-day outlook, key support/resistance levels, macro drivers |
| _"What's market sentiment on my holdings?"_ | **Sentiment Agent** — per-ticker sentiment scores, key market themes, risk events |
| _"Find me value stocks"_ | **Equity Screener Agent** — screens 60+ equities matching your risk tolerance & goals |

Every specialist agent produces a structured JSON analysis, which a **synthesis agent** then uses to write a clear, personalized, conversational response.

### 2. 📊 Interactive Live Dashboard
- Real-time **TradingView** candlestick charts, sector heatmaps, and market overview widgets
- Live stock data via **Finnhub API** (price, change %, market cap)
- Per-stock detail pages with advanced chart, technical analysis sidebar, financials, and company profile

### 3. 🧪 Paper Trading Sandbox
- A full paper trading environment with a virtual starting balance
- Execute BUY/SELL trades on any real ticker, track open positions with live P&L
- Prices update every **5 seconds** via real-time polling
- Ask the AI assistant to suggest sandbox trades and execute them in one click

### 4. 🧾 AI Portfolio Audit
- On-demand **Portfolio Health Score** (0–100) with sector allocation vs. benchmark bars
- Itemized risks with severity tags (LOW / MEDIUM / HIGH) and actionable recommendations  
- **30-day predictive forecast corridor** (optimistic, base, pessimistic)
- **Export to PDF** with a single click using jsPDF

### 5. 🔔 Smart Stock Alerts
- Set price threshold alerts (above or below a target)
- Volume spike detection
- Email delivery via **Nodemailer SMTP** with styled templates
- Automated checking via a secured **cron job**

---

## 🛠️ How We Built It

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS 15 APP ROUTER                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │Dashboard │  │ Stocks   │  │Sandbox   │  │ Assistant  │  │
│  │   /      │  │/[symbol] │  │/sandbox  │  │/assistant  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ Server Actions + API Routes
         ┌───────────────┼───────────────────────────┐
         │               │                           │
  ┌──────▼──────┐  ┌─────▼──────┐          ┌────────▼───────┐
  │  MongoDB    │  │ Finnhub    │          │  NVIDIA NIM    │
  │  (Mongoose) │  │   API      │          │  Multi-Agent   │
  │  5 Models   │  │ Real-time  │          │  Orchestrator  │
  └─────────────┘  └────────────┘          └────────────────┘
```

### Multi-Agent Orchestrator (the core innovation)

```
User message
    │
    ▼
detectIntent()          ← keyword classifier, 0ms, no API call
    │
    ▼
runSpecialistAgent()    ← NVIDIA NIM call #1 (structured JSON output)
    │
    ▼
Synthesizer             ← NVIDIA NIM call #2
  Input: RAG context (profile + portfolio + sandbox from DB)
       + specialist JSON analysis
       + original user message
  Output: { message, dashboardAction }
    │
    ▼
Chatbot renders personalized response + action pill
```

### Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Database** | MongoDB + Mongoose |
| **Auth** | Better Auth (session-based, email verification) |
| **AI** | NVIDIA NIM — `nvidia/nemotron-3-nano-30b-a3b` |
| **Styling** | Tailwind CSS v4 + Vanilla CSS |
| **UI Primitives** | Radix UI (Dialog, Dropdown, Select, Popover) |
| **Charts** | TradingView Embed Widgets |
| **Market Data** | Finnhub REST API |
| **Email** | Nodemailer (SMTP) |
| **PDF** | jsPDF |
| **Forms** | React Hook Form |
| **Search** | cmdk (command palette) |
| **Notifications** | Sonner |

---

## 🧱 Challenges We Ran Into

### 1. Building a True Multi-Agent System Without an Agent Framework
Most multi-agent frameworks (LangChain, AutoGen) add heavy dependencies and opinionated abstractions. We built our orchestrator from scratch — a **zero-dependency intent classifier → specialist router → synthesizer** pipeline using pure TypeScript. Getting the specialist agents to produce reliably parseable JSON (not markdown-wrapped JSON, not partial JSON) required careful prompt engineering and a fallback parser.

### 2. NVIDIA NIM JSON Reliability
The NVIDIA NIM model sometimes wraps JSON in markdown fences (` ```json `) or includes preamble text before the JSON object. We implemented a **multi-layer parse strategy**: strip fences, trim whitespace, attempt `JSON.parse`, and fall back to raw text delivery if parsing fails — ensuring the UI never breaks regardless of model output format.

### 3. Real-Time Sandbox Pricing Without WebSockets
We needed live P&L updates in the sandbox without the complexity of WebSocket infrastructure. We solved this with **server-side polling** — the `SandboxDashboard` component polls `/api/sandbox` every 5 seconds in a `setInterval`, which fetches fresh Finnhub prices and recomputes P&L on each request. It gives a live feel without adding socket complexity.

### 4. RAG Context Size vs. Latency
Injecting the full user context (profile + all portfolio assets + sandbox positions) into every chat request risks hitting token limits and increasing latency. We solved this with **selective context summarization** — assets are formatted as compact strings (`AAPL(qty:10,avg:₹180)`), positions are similarly compressed, and the specialist agent output is capped at 1200–1400 tokens to keep the synthesis step fast.

### 5. Better Auth Integration with Next.js 15 App Router
Better Auth's session retrieval requires reading headers from the incoming request. In Next.js 15 Server Components and Route Handlers, this required careful handling of the new `async params` pattern and ensuring `auth.api.getSession({ headers: req.headers })` was called correctly in every protected route without middleware conflicts.

---

## 🏆 Accomplishments That We're Proud Of

- **Built a genuine multi-agent AI system from scratch** — no LangChain, no AutoGen, pure TypeScript. Intent detection → specialist agent → synthesizer, all in one clean pipeline.

- **Every agent actually works end-to-end** — all 6 specialist agents (portfolio, risk, sentiment, forecast, screener, recommendation) are connected to the assistant through the orchestrator and return personalized, context-aware analysis.

- **Zero hallucination guard through structured JSON schemas** — every specialist agent is prompted to return a strict JSON shape. The synthesizer doesn't invent data; it only narrates what the specialist found.

- **Full-featured paper trading sandbox** with real live pricing, position management, P&L tracking, and AI-triggered trades — all connected to the same NVIDIA NIM backend.

- **Enterprise-grade UI** — dark mode, TradingView widgets, animated loading states, command palette search, PDF export — all built with Tailwind CSS v4 and Radix UI primitives.

- **Graceful degradation everywhere** — if a specialist agent fails, the orchestrator falls back to pure conversational chat. If PDF generation fails, the page doesn't crash. If Finnhub returns an error, `notFound()` is called cleanly.

---

## 📚 What We Learned

- **Prompt engineering for structured output is its own discipline.** Getting an LLM to reliably return valid JSON — not markdown JSON, not partial JSON, not JSON with a paragraph before it — requires very specific instruction and defensive parsing on the application side.

- **Intent detection doesn't need AI.** A carefully constructed set of keyword regexes can classify financial queries with high accuracy and zero latency. Saving one API round-trip per message makes the assistant noticeably faster.

- **RAG (Retrieval Augmented Generation) transforms a generic chatbot into a genuinely useful tool.** The moment the assistant knows your actual holdings, risk tolerance, and sandbox balance, the quality of its responses jumps dramatically. Context is everything.

- **Next.js 15 App Router is powerful but opinionated.** `async params`, server vs. client component boundaries, and the interaction between Server Actions and route handlers required careful architecture decisions upfront to avoid hydration mismatches and auth leaks.

- **MongoDB is a natural fit for financial user data.** Flexible schemas made it trivial to evolve the `ExternalPortfolio` and `Sandbox` models as requirements changed without running migrations.

---

## 🚀 What's Next for FinNext

### Near-term
- **Agent Memory** — store past conversations in MongoDB so the assistant remembers what you discussed last session and builds a long-term picture of your investment journey.
- **AuditReport on Profile Page** — surface the AI Portfolio Audit card directly on the profile page (the component exists; it just needs to be re-connected to the page).
- **Real-time WebSocket alerts** — replace polling with a WebSocket connection so price alerts fire instantly in the browser without needing an email.

### Medium-term
- **Parallel agent calls** — for complex queries, invoke multiple specialist agents simultaneously (`Promise.all`) and merge their outputs, rather than one agent per intent.
- **Historical data integration** — pull 90-day OHLCV data from Finnhub into the Forecast Agent for true quantitative regression, rather than training-data-based estimates.
- **Portfolio import from more brokers** — extend the CSV importer to auto-detect and map formats from Zerodha, Groww, Angel One, and other Indian brokers.

### Long-term
- **Options & derivatives tracking** — extend the Sandbox to support paper-trading options contracts with Greeks visualization.
- **Macro economic agent** — a dedicated agent that monitors Fed/RBI policy decisions, inflation data, and earnings calendars and proactively surfaces relevant alerts to the user.
- **Mobile app** — React Native client sharing the same Next.js API layer, bringing the full FinNext intelligence to a mobile-native experience.

---

_Built with ❤️ using Next.js 15, NVIDIA NIM, MongoDB, and TradingView._
