<p align="center">
  <img src="https://raw.githubusercontent.com/codenext-labs/banner/main/finnext-banner.png" alt="FinNext Banner" width="100%" />
</p>

<h1 align="center">🚀 FinNext — AI-Powered Stock Analysis Platform</h1>
<p align="center">Made by <strong>CodeNext</strong></p>

---

## ✨ 1. Overview

FinNext is a next-generation AI-powered stock analysis platform that provides investors and traders with **real-time data**, **portfolio intelligence**, **automated insights**, and a **multi-agent financial AI system** powered by Lyzr AI.

Designed with **Next.js 15**, **Tailwind**, and **TypeScript**, it offers a sleek dark UI and enterprise-level performance.

---

## 🔋 2. Core Features

### 📊 Stock Dashboard
- Live stock prices (via Finnhub)
- TradingView advanced charts
- Market overviews & detailed metrics

### ⭐ Watchlist & Alerts
- Create custom watchlists  
- Set price alerts  
- Automated email notifications  

### 🤖 AI Agents (Lyzr AI — V3 Inference)
Six specialized agents with zero hallucination mode:

| Agent | Purpose |
|-------|---------|
| **Portfolio Analysis** | Diversification, allocation & portfolio health |
| **Risk** | Personalized risk score |
| **Sentiment** | Market + news sentiment |
| **Forecast** | Short-term numeric price prediction |
| **Screener** | Filters stocks using technical & fundamental criteria |
| **Recommendation** | Holistic investment suggestions |

### 🔐 Authentication  
Powered by **BetterAuth**.

### 🔄 Event-Driven Workflows  
Using **Inngest** for:
- Welcome emails  
- Daily market news  
- Price alert notifications  

### 📈 Real-Time Data  
Powered by **Finnhub API**.

---

## ⚙️ 3. Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Next.js 15 | Full-stack SSR |
| **Language** | TypeScript | Scalable, typed code |
| **Styling** | Tailwind + Shadcn UI | Modern dark UI |
| **Database** | MongoDB / Mongoose | Store users, alerts, watchlists |
| **Auth** | Better Auth | Secure authentication |
| **AI** | Lyzr AI | Multi-agent AI system |
| **Workflows** | Inngest | Background jobs |
| **Finance API** | Finnhub | Stock market data |

---

## 🛠️ 4. Installation

### **Clone the repo**
```bash
git clone <repository_url>
cd finnext
npm install
```

## 🔑 5. Environment Variables

Create a `.env` file in the project root:

```env
# NEXT.JS & AUTH
NODE_ENV='development'
NEXT_PUBLIC_BASE_URL=http://localhost:3000
BETTER_AUTH_SECRET=YOUR_BETTER_AUTH_SECRET
BETTER_AUTH_URL=http://localhost:3000

# MONGODB
MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING

# FINNHUB API
NEXT_PUBLIC_FINNHUB_API_KEY=YOUR_FINNHUB_API_KEY
FINNHUB_BASE_URL=https://finnhub.io/api/v1

# INNGEST & EMAIL
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_FOR_INNGEST_SUMMARIES
NODEMAILER_EMAIL=YOUR_NODEMAILER_EMAIL
NODEMAILER_PASSWORD=YOUR_NODEMAILER_APP_PASSWORD

# LYZR AI (V3 INFERENCE)
PORTFOLIO_AGENT_API_KEY=YOUR_PORTFOLIO_AGENT_API_KEY
RISK_AGENT_API_KEY=YOUR_RISK_AGENT_API_KEY
SENTIMENT_AGENT_API_KEY=YOUR_SENTIMENT_AGENT_API_KEY
FORECAST_AGENT_API_KEY=YOUR_FORECAST_AGENT_API_KEY
SCREENER_AGENT_API_KEY=YOUR_SCREENER_AGENT_API_KEY
RECOMMENDATION_AGENT_API_KEY=YOUR_RECOMMENDATION_AGENT_API_KEY
```

## 🤖 6. AI Agent Endpoints (Proxy Routes)

| Agent | Endpoint | Lyzr Agent ID | Auth |
|--------|----------|----------------|------|
| Portfolio | `/api/agents/portfolio` | `692726db642e89081dd9da52` | x-api-key |
| Risk | `/api/agents/risk` | `702827dc753f90192ee0eb03` | x-api-key |
| Sentiment | `/api/agents/sentiment` | `713938ed864g01203ff1fc14` | x-api-key |
| Forecast | `/api/agents/forecast` | `724049fe975h12314002gd25` | x-api-key |
| Screener | `/api/agents/screener` | `735150gf086i23425113he36` | x-api-key |
| Recommendation | `/api/agents/recommendation` | `746261hg197j34536224if47` | x-api-key |

---

## 🏃 7. Running the Project

### Start Next.js app
```bash
npm run dev
```

### Start Inngest server
```bash
npx inngest-cli@latest dev
```

### App runs at:
👉 http://localhost:3000

📁 8. Project Structure
```
/app
  /dashboard
  /watchlist
  /agents
/api
  /agents
/components
/lib
/styles
```

🤝 9. Contributing

PRs are welcome!
Use TypeScript + ESLint + Prettier for clean code.

📜 10. License

MIT © 2025 CodeNext
