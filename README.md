<p align="center">
  <img src="public/assets/images/dashboard.png" width="100%" alt="FinNext Dashboard Preview" style="border-radius: 12px; border: 1px solid #212328; box-shadow: 0 20px 40px rgba(0,0,0,0.5);" />
</p>

<h1 align="center">📈 FinNext — Next-Gen AI Financial & Portfolio Intelligence</h1>
<p align="center">An enterprise-grade, high-performance financial analytics and multi-agent AI dashboard.</p>

---

## ✨ 1. Overview

**FinNext** is an advanced, AI-powered stock analysis and portfolio intelligence platform designed to empower retail investors with institutional-grade insights. Powered by **Next.js 15**, **Tailwind CSS**, and **MongoDB**, it provides real-time market tracking, transaction-based portfolio management, and a zero-hallucination multi-agent financial AI ecosystem powered by high-performance **NVIDIA NIM (Inference Microservices)**.

---

## 🤖 2. The NVIDIA NIM Multi-Agent System

FinNext replaces generic generative AI models with specialized financial agents built on high-throughput **NVIDIA NIM V3 Inference endpoints**. These agents leverage dedicated context windows and prompt-engineering protocols to perform precise financial analyses:

| Agent | Purpose & Key Metrics | Endpoint |
| :--- | :--- | :--- |
| **💼 Portfolio Analysis** | Evaluates diversification, sector weights, allocation health, and cash ratios. | `/api/agents/portfolio` |
| **🛡️ Risk Assessment** | Measures market volatility, historical beta, Sharpe ratios, and calculates tailored risk scores. | `/api/agents/risk` |
| **📊 Market Sentiment** | Aggregates real-time news streams, social trends, and filings for aggregate sentiment scores. | `/api/agents/sentiment` |
| **🔮 Short-Term Forecast** | Performs numeric, regression-based technical analysis for short-term price movements. | `/api/agents/forecast` |
| **🔍 Equity Screener** | Filters stocks dynamically utilizing critical fundamental & technical indicators. | `/api/agents/screener` |
| **💡 Recommendation** | Synthesis agent producing holistic buy/sell/hold ideas with target entries and exits. | `/api/agents/recommendation` |

---

## 🔋 3. Core Capabilities

### 📊 Interactive Live Dashboard (`/`)
* **Real-Time Market Tracking**: Embeds premium live TradingView widgets for high-end candlestick charts and volume trends.
* **Stock Heatmaps**: Fully interactive treemaps visualizing performance across sectors (Technology, Finance, Services) in real-time.
* **Top Stories & Quotes**: Constant news timeline tracking corporate developments.

### 🤖 Live AI Assistant (Chatbot)
* **Real-Time Interactive Panel**: Chat directly with our finance models about watchlist items, portfolio status, or current stock trends.
* **Context-Aware Memory**: Recalls conversation history for deeper equity deep-dives.

### 📥 Universal CSV Portfolio Importer
* **Drag-and-Drop CSV Import**: Upload transaction histories from standard brokers.
* **Automated Syncing**: Automatically maps ticker symbols, transaction types, share counts, and average purchase prices directly to your profile.

### 🔔 Smart Stock Alerts & Volume Triggers
* **Boundary Threshold Alerts**: Set alerts for stock prices moving `ABOVE` or `BELOW` customized targets.
* **Spike Alerts**: Triggers real-time notifications for anomalous volume spikes.
* **Nodemailer Service**: Instant email dispatch via SMTP using clean, highly-stylized layouts.

---

## ⚙️ 4. Technology Stack

| Category | Technology | Usage & Integration |
| :--- | :--- | :--- |
| **Core Framework** | Next.js 15 (App Router) | High-performance full-stack Server-Side Rendering (SSR) & Server Actions |
| **Database** | MongoDB / Mongoose | Relational-NoSQL modeling for user profiles, alerts, watchlists, and imports |
| **Authentication** | Better Auth | Session-based security, verification links, and secure sign-up paths |
| **AI Processing** | NVIDIA NIM API | High-throughput financial intelligence microservices |
| **Styling & UI** | Vanilla CSS + Tailwind | Seamless dark-mode design with sleek transitions and accessible typography |
| **Mail Transport** | Nodemailer | Transactional and digest emails (Welcome, Verify Email, Price Alerts) |

---

## 🔑 5. Environment Variables Setup

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

## 🛠️ 6. Quick Start & Local Run

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

### **3. Launch local developer server**
```bash
npm run dev
```
👉 Access the local interface at: **[http://localhost:3000](http://localhost:3000)**

---

## 📁 7. Project Structure

```
├── app/
│   ├── (auth)/             # Authentication views (sign-in, sign-up, verify-email)
│   ├── (root)/             # Dashboard layouts & primary analytics modules
│   └── api/                # NVIDIA NIM proxies, alerts, and auth endpoints
├── components/             # Reusable UI widgets (Charts, Heatmaps, Chatbot, Importer)
├── database/               # Mongoose models (User, Sandbox, Profile, Alerts)
├── lib/                    # Helpers, nodemailer templates, and auth clients
└── public/                 # Custom graphic assets & icons
```

---

## 🤝 8. Contributing & Standards

* We welcome contributions! Ensure you run ESLint and Prettier before opening PRs.
* Adhere to TypeScript typing conventions—avoid using `any` types.

## 📜 9. License

This project is licensed under the MIT License - see the LICENSE file for details.
