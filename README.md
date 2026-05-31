<p align="center">
  <img src="public/assets/images/dashboard.png" width="100%" alt="FinNext Dashboard Preview" style="border-radius: 12px; border: 1px solid #212328; box-shadow: 0 20px 40px rgba(0,0,0,0.5);" />
</p>

<h1 align="center">📈 FinNext — Next-Gen AI Financial & Portfolio Intelligence</h1>
<p align="center">An enterprise-grade, high-performance financial analytics and multi-agent AI dashboard.</p>

---

## ✨ 1. Overview

**FinNext** is an advanced, AI-powered stock analysis and portfolio intelligence platform designed to empower retail investors with institutional-grade insights. Powered by **Next.js 15** (with Turbopack), **Tailwind CSS v4**, and **MongoDB**, it provides real-time market tracking, transaction-based portfolio management, a paper-trading sandbox, and a zero-hallucination multi-agent financial AI ecosystem powered by high-performance **NVIDIA NIM (Inference Microservices)**.

---

## 🤖 2. The NVIDIA NIM Multi-Agent Orchestrator

FinNext's AI assistant is a **true multi-agent system** — not a single chatbot. Every message is routed through a 3-step orchestrator pipeline before a response is generated:

```
User message
    │
    ▼
directIntent()          ← keyword classifier, 0ms, no API call
    │
    ▼
Specialist Agent        ← NVIDIA NIM call #1 (structured JSON analysis)
    │
    ▼
Synthesizer             ← NVIDIA NIM call #2
  Input:  RAG context (profile + portfolio + sandbox from DB)
        + specialist JSON output
        + original user message
  Output: { message, dashboardAction }
```

### Specialist Agents

Each agent lives in `lib/agents/specialists.ts` and is invoked by the orchestrator (`/api/chat`) based on detected intent:

| Intent Detected | Specialist Agent | What It Produces |
| :--- | :--- | :--- |
| _"How risky is my portfolio?"_ | **🛡️ Risk Assessment** | `riskScore`, `riskLevel`, `betaEstimate`, `sharpeEstimate`, `hedgingSuggestions` |
| _"Analyze my portfolio"_ | **💼 Portfolio Analysis** | `diversificationScore`, `sectors[]`, `topRisks[]`, `rebalancingActions[]` |
| _"Recommend stocks for me"_ | **💡 Recommendation** | `recommendations[]` with `action`, `conviction`, `rationale`, `targetEntry`, `stopLoss` |
| _"Predict AAPL next month"_ | **🔮 Forecast** | `marketOutlook`, `perTicker[]` with `thirtyDayOutlook`, `keyLevels`, `keyDrivers` |
| _"What's market sentiment?"_ | **📊 Sentiment** | `overallSentiment`, `sentimentScore`, `perTicker[]`, `keyThemes[]`, `riskEvents[]` |
| _"Find me value stocks"_ | **🔍 Equity Screener** | `results[]` with `ticker`, `sector`, `whyItFits`, `riskRating`, `growthPotential` |
| _General questions_ | _(no specialist)_ | Pure conversational response using RAG context only |

> **Graceful degradation**: if a specialist agent fails, the orchestrator falls back to direct conversational chat — the user experience is never broken.

### AI Depth Report
A separate **depth report agent** (`/api/agents/depth-report`) performs a full cross-account audit — analyzing real portfolio + sandbox side-by-side — and is triggered from the Assistant page sidebar. It produces a combined health score, sector overlap analysis, risk/opportunity cards, and a downloadable PDF.

---

## 🔋 3. Core Capabilities

### 📊 Interactive Live Dashboard (`/`)
* **Real-Time Market Tracking**: Embeds premium live TradingView widgets for high-end candlestick charts and volume trends.
* **Stock Heatmaps**: Fully interactive treemaps visualizing performance across sectors (Technology, Finance, Services) in real-time.
* **Top Stories & Quotes**: Constant news timeline tracking corporate developments.

### 📈 Individual Stock Detail Page (`/stocks/[symbol]`)
* **Symbol Info Banner**: Full-width TradingView Symbol Info widget with live price and change data.
* **Advanced Candlestick Chart**: 680px high-fidelity live chart with configurable intervals.
* **Company Financials**: Live financial statements and ratios via TradingView Financials widget.
* **Technical Analysis Sidebar**: Oscillators, moving average gauges, and buy/sell/neutral summaries.
* **Company Profile**: TradingView Symbol Profile with key fundamental metrics.
* **Quick Actions**: Add to Watchlist, Set Price Alert, and paper-trade directly from the stock page.

### 🤖 Live AI Assistant (`/assistant`)
* **Multi-Agent Orchestrator**: Every message triggers intent detection → specialist agent → synthesizer — two coordinated NVIDIA NIM calls producing a personalized, data-driven answer.
* **RAG-Powered Context**: The assistant reads your real profile (risk tolerance, goals), portfolio holdings, and sandbox positions from MongoDB on every request, so responses are always personalised to _your_ data.
* **Dashboard Actions**: The assistant can trigger UI actions — highlighting stocks, recommending tickers with clickable links, or executing sandbox trades — directly from the chat response.
* **AI Depth Report**: Generate a full strategic audit (real portfolio + sandbox combined) from the assistant sidebar, with PDF export.

### 🧪 Paper Trading Sandbox (`/sandbox`)
* **Virtual Portfolio**: Start with a virtual balance and execute risk-free BUY/SELL trades.
* **Live Pricing Polling**: Positions update every 5 seconds via real-time price feeds.
* **P&L Tracking**: Per-position P&L, percentage returns, and overall portfolio performance metrics.
* **Trade Execution Modal**: Inline Sell modal with quantity validation, MAX shortcut, and estimated revenue preview.
* **Sandbox Trade Widget**: Accessible directly from any stock detail page for instant paper trading.
* **Reset Support**: Full portfolio reset available at any time.

### 🧾 AI Portfolio Audit (`/profile`)
* **NVIDIA NIM-Powered Audit**: On-demand AI audit generating a Portfolio Health Score (0–100), risk level badge (LOW/MEDIUM/HIGH), and narrative summary.
* **Sector Allocation vs Benchmark**: Visual progress bar comparison of portfolio sector weight vs benchmark allocation.
* **Top Risks & Opportunities**: Itemized risk cards with severity tags and actionable recommendations.
* **30-Day Predictive Forecast**: CSS bar chart corridor showing optimistic, base, and pessimistic price trajectories.
* **PDF Export**: One-click PDF generation via `jsPDF` with score, risk level, summary, and risk breakdown.

### 📥 Universal CSV Portfolio Importer
* **Drag-and-Drop CSV Import**: Upload transaction histories from standard brokers.
* **Automated Syncing**: Automatically maps ticker symbols, transaction types, share counts, and average purchase prices directly to your profile.

### 🔔 Smart Stock Alerts & Volume Triggers
* **Boundary Threshold Alerts**: Set alerts for stock prices moving `ABOVE` or `BELOW` customized targets.
* **Spike Alerts**: Triggers real-time notifications for anomalous volume spikes.
* **Nodemailer Service**: Instant email dispatch via SMTP using clean, highly-stylized layouts.
* **Cron Job Integration**: Scheduled alert checks via a secured cron endpoint (`/api/cron`).

### 🔎 Search & Watchlist
* **Command Palette Search** (`SearchCommand`): `cmdk`-powered command palette for instant stock lookup across a curated symbol list of 60+ equities.
* **Watchlist Table**: Tracks symbols with live price, change %, and market cap via Finnhub API with add/remove controls.

---

## ⚙️ 4. Technology Stack

| Category | Technology | Version / Notes |
| :--- | :--- | :--- |
| **Core Framework** | Next.js (App Router + Turbopack) | `15.5.9` — SSR, Server Actions, dynamic routes |
| **Language** | TypeScript | `^5` |
| **Database** | MongoDB / Mongoose | `^6.19.0` / `^8.18.0` |
| **Authentication** | Better Auth | `^1.3.7` — session-based, email verification |
| **AI Processing** | NVIDIA NIM API | Multi-agent financial intelligence microservices |
| **Styling** | Tailwind CSS v4 + Vanilla CSS | Dark-mode design, custom animations |
| **UI Primitives** | Radix UI | Avatar, Dialog, Dropdown, Select, Popover, Label |
| **Icons** | Lucide React | `^0.542.0` |
| **Forms** | React Hook Form | `^7.62.0` |
| **Command Palette** | cmdk | `^1.1.1` |
| **Toast Notifications** | Sonner | `^2.0.7` |
| **PDF Generation** | jsPDF | `^4.2.1` |
| **Mail Transport** | Nodemailer | `^7.0.6` — transactional & alert emails |
| **Market Data** | Finnhub API | Real-time quotes, company profiles, news |
| **Charts & Widgets** | TradingView Embed Widgets | Candlestick, Heatmap, Financials, Technical Analysis |
| **Hooks** | Custom (`useDebounce`, `useTradingViewWidget`) | Reusable async/widget lifecycle helpers |

---

## 🗂️ 5. Database Models

| Model | File | Description |
| :--- | :--- | :--- |
| **Profile** | `Profile.ts` | User investment profile (goals, risk tolerance, industry preferences) |
| **ExternalPortfolio** | `ExternalPortfolio.ts` | CSV-imported broker transactions |
| **Sandbox** | `Sandbox.ts` | Virtual trading account (balance, positions, transaction log) |
| **StockAlert** | `StockAlert.ts` | Price & volume threshold alerts with notification history |
| **Watchlist** | `watchlist.model.ts` | User watchlist items with symbol metadata |

---

## 🔑 6. Environment Variables Setup

Create a `.env` file in the root of your project:

```env
# ENVIRONMENT STATE
NODE_ENV='development'
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# DATABASE
MONGODB_URI=your_mongodb_connection_string_here

# BETTER AUTH CONFIG
BETTER_AUTH_SECRET=your_better_auth_secret_here
BETTER_AUTH_URL=http://localhost:3000

# FINNHUB API
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_api_key_here
FINNHUB_BASE_URL=https://finnhub.io/api/v1

# NODEMAILER (SMTP) EMAIL DELIVERABILITY
NODEMAILER_EMAIL=your_email@gmail.com
NODEMAILER_PASSWORD=your_app_specific_password

# NVIDIA NIM AI
NVIDIA_API_KEY=your_nvidia_nim_api_key_here

# CRON SECURE SECRET
CRON_SECRET=your_cron_job_secret_here
```

---

## 🛠️ 7. Quick Start & Local Run

### **Prerequisites**
Ensure you have [Node.js v18+](https://nodejs.org/) and a running [MongoDB](https://www.mongodb.com/) instance.

### **1. Clone the repository**
```bash
git clone https://github.com/KANISHQ09/Finance.git
cd Finance
```

### **2. Install dependencies**
```bash
npm install
```

### **3. Configure environment**
Copy `.env.example` to `.env` and fill in your keys (see Section 6).

### **4. Launch local developer server**
```bash
npm run dev
```
👉 Access the local interface at: **[http://localhost:3000](http://localhost:3000)**

### **5. Verify database connection**
```bash
npm run test:db
```

---

## 📁 8. Project Structure

```
├── app/
│   ├── (auth)/                 # Authentication views (sign-in, sign-up, verify-email)
│   ├── (root)/                 # Core application pages & layouts
│   │   ├── page.tsx            # Main dashboard (TradingView widgets, heatmap, news)
│   │   ├── stocks/[symbol]/    # Individual stock detail page
│   │   ├── assistant/          # AI chat assistant interface
│   │   ├── sandbox/            # Paper trading sandbox dashboard
│   │   ├── watchlist/          # Watchlist manager
│   │   ├── profile/            # User profile, CSV importer, AI audit
│   │   ├── pricing/            # Pricing/plans page
│   │   └── ai/                 # AI hub entry point
│   └── api/
│       ├── agents/             # NVIDIA NIM agent routes (portfolio, risk, sentiment,
│       │   ├── depth-report/   #   forecast, screener, recommendation, depth-report)
│       │   └── ...
│       ├── alerts/             # Price & volume alert CRUD
│       ├── audit/              # AI portfolio audit endpoint
│       ├── chat/               # AI assistant chat streaming
│       ├── cron/               # Scheduled alert-check cron job
│       ├── portfolio/          # Portfolio data endpoints
│       ├── profile/            # User profile endpoints
│       ├── sandbox/            # Sandbox state & trade execution
│       │   └── trade/          #   /api/sandbox/trade (BUY / SELL)
│       └── stocks/             # Finnhub stock data proxy
├── components/
│   ├── audit/                  # AuditReport — AI audit UI with PDF export
│   ├── forms/                  # Auth & profile forms
│   ├── portfolio/              # UniversalImport — CSV drag-and-drop importer
│   ├── sandbox/                # SandboxDashboard, SandboxTradeWidget, SandboxTradeButton
│   ├── ui/                     # Shared Radix-based UI primitives
│   ├── Chatbot.tsx             # AI assistant chat panel
│   ├── SearchCommand.tsx       # cmdk command palette
│   ├── StockAlertButton.tsx    # Alert creation modal
│   ├── TradingViewWidget.tsx   # Generic TradingView iframe wrapper
│   ├── WatchlistButton.tsx     # Add/remove from watchlist toggle
│   └── WatchlistTable.tsx      # Watchlist data table
├── database/
│   ├── models/                 # Mongoose models (Profile, ExternalPortfolio, Sandbox, StockAlert, Watchlist)
│   └── mongoose.ts             # Connection pooling & caching
├── hooks/
│   ├── useDebounce.ts          # Generic debounce hook
│   └── useTradingViewWidget.tsx # TradingView script lifecycle management
├── lib/
│   ├── actions/                # Next.js Server Actions (auth, finnhub, user, watchlist)
│   ├── agents/                 # Agent prompt builders & parsers
│   ├── better-auth/            # Better Auth client/server setup
│   ├── cron/                   # Cron job logic
│   ├── nodemailer/             # Email templates & transporter config
│   ├── constants.ts            # Nav items, TradingView widget configs, symbol lists
│   ├── nvidia.ts               # NVIDIA NIM client setup
│   └── utils.ts                # Shared utility functions
├── middleware/                 # Route protection middleware
├── public/                     # Static assets & images
├── scripts/                    # DB test scripts
└── types/                      # Global TypeScript type declarations
```

---

## 🤝 9. Contributing & Standards

* We welcome contributions! Ensure you run ESLint and Prettier before opening PRs.
* Adhere to TypeScript typing conventions — avoid using `any` types.
* All new API routes must validate the session before processing.
* Server Actions should use typed return objects with `{ success, error }` shapes.

## 📜 10. License

This project is licensed under the MIT License - see the LICENSE file for details.
