import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import { nvidiaChat } from "@/lib/nvidia";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "@/lib/cron/prompts";

interface UserForNewsEmail {
  email: string;
  name?: string;
}

// ─────────────────────────────────────────────────────────
// Helper: Call NVIDIA NIM directly
// ─────────────────────────────────────────────────────────
async function callNvidiaAI(prompt: string, maxTokens = 800): Promise<string> {
  return nvidiaChat(
    "You are a professional financial email content writer. Write concise, engaging, high-quality content.",
    prompt,
    maxTokens
  );
}

// ─────────────────────────────────────────────────────────
// Function 1: Send personalized welcome email on sign-up
// ─────────────────────────────────────────────────────────
export async function sendSignUpEmailTask(data: any) {
  const userProfile = `
    - Country: ${data.country}
    - Investment goals: ${data.investmentGoals}
    - Risk tolerance: ${data.riskTolerance}
    - Preferred industry: ${data.preferredIndustry}
  `;

  const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace("{{userProfile}}", userProfile);

  let introText = "Thanks for joining FinNext. You now have the tools to track markets and make smarter moves with AI-powered insights.";
  try {
    introText = await callNvidiaAI(prompt, 400);
  } catch (e) {
    console.error("Failed to generate welcome intro", e);
  }

  await sendWelcomeEmail({ email: data.email, name: data.name, intro: introText });
  return { success: true, message: "Welcome email sent successfully" };
}

// ─────────────────────────────────────────────────────────
// Function 2: Daily market news summary
// ─────────────────────────────────────────────────────────
export async function sendDailyNewsSummaryTask() {
  const users = await getAllUsersForNewsEmail();
  if (!users || users.length === 0) {
    return { success: false, message: "No users found for news email" };
  }

  const results: Array<{ user: UserForNewsEmail; articles: any[] }> = [];
  for (const user of users as UserForNewsEmail[]) {
    try {
      const symbols = await getWatchlistSymbolsByEmail(user.email);
      let articles = await getNews(symbols);
      articles = (articles || []).slice(0, 6);
      if (!articles || articles.length === 0) {
        articles = ((await getNews()) || []).slice(0, 6);
      }
      results.push({ user, articles });
    } catch (e) {
      console.error("daily-news: error for user", user.email, e);
      results.push({ user, articles: [] });
    }
  }

  const summaries: { user: UserForNewsEmail; newsContent: string | null }[] = [];
  for (const { user, articles } of results) {
    try {
      const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
        "{{newsData}}",
        JSON.stringify(articles, null, 2)
      );
      const content = await callNvidiaAI(prompt, 600);
      summaries.push({ user, newsContent: content });
    } catch (e) {
      console.error("Failed to summarize news for:", user.email, e);
      summaries.push({ user, newsContent: null });
    }
  }

  await Promise.all(
    summaries.map(async ({ user, newsContent }) => {
      if (!newsContent) return false;
      return await sendNewsSummaryEmail({
        email: user.email,
        date: getFormattedTodayDate(),
        newsContent,
      });
    })
  );

  return { success: true, message: "Daily news summary emails sent successfully" };
}

// ─────────────────────────────────────────────────────────
// Function 3: Weekly portfolio digest
// ─────────────────────────────────────────────────────────
export async function sendWeeklyPortfolioDigestTask() {
  const users = await getAllUsersForNewsEmail();
  if (!users || users.length === 0) return { success: false };

  for (const user of users as UserForNewsEmail[]) {
    try {
      const symbols = await getWatchlistSymbolsByEmail(user.email);
      const tickerList = symbols.join(", ") || "your tracked stocks";

      const summary = await callNvidiaAI(
        `Write a concise weekly portfolio digest intro (3 sentences) for an investor tracking: ${tickerList}. 
        Mention market conditions, what to watch this week, and one AI-powered insight. Keep it professional and actionable.`,
        300
      );

      await sendWelcomeEmail({
        email: user.email,
        name: user.name ?? "Investor",
        intro: `📊 Your Weekly FinNext Digest\n\n${summary}`,
      });
    } catch (e) {
      console.error("Weekly digest failed for:", user.email, e);
    }
  }

  return { success: true, message: "Weekly portfolio digests sent" };
}

// ─────────────────────────────────────────────────────────
// Function 4: Hourly Stock Price Alerts
// ─────────────────────────────────────────────────────────
export async function checkStockAlertsTask() {
  const { connectToDatabase } = await import("@/database/mongoose");
  const { StockAlert } = await import("@/database/models/StockAlert");
  const { sendStockAlertEmail } = await import("@/lib/nodemailer");
  
  await connectToDatabase();
  
  const activeAlerts = await StockAlert.find({ isActive: true }).lean() as any[];

  if (!activeAlerts || activeAlerts.length === 0) {
    return { success: true, message: "No active alerts to process" };
  }

  const uniqueSymbols = [...new Set(activeAlerts.map(a => a.symbol))] as string[];
  
  const liveQuotes: Record<string, number> = {};
  for (const symbol of uniqueSymbols) {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.NEXT_PUBLIC_FINNHUB_API_KEY}`);
      const data = await res.json();
      if (data && data.c) {
        liveQuotes[symbol] = data.c;
      }
    } catch (e) {
      console.error(`Failed to fetch quote for ${symbol}`, e);
    }
  }

  for (const alert of activeAlerts) {
    const currentPrice = liveQuotes[alert.symbol];
    if (!currentPrice) continue;

    let triggered = false;
    if (alert.condition === "ABOVE" && currentPrice >= alert.targetPrice) {
      triggered = true;
    } else if (alert.condition === "BELOW" && currentPrice <= alert.targetPrice) {
      triggered = true;
    }

    if (triggered) {
      try {
        await sendStockAlertEmail({
          email: alert.email,
          symbol: alert.symbol,
          targetPrice: alert.targetPrice,
          currentPrice,
          condition: alert.condition
        });
        
        await StockAlert.findByIdAndUpdate(alert._id, { isActive: false });
      } catch (e) {
        console.error(`Failed to send alert email for ${alert._id}`, e);
      }
    }
  }

  return { success: true, message: "Stock alerts check completed" };
}
