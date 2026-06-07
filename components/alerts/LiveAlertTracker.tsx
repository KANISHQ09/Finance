"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Alert {
  _id: string;
  symbol: string;
  targetPrice: number;
  condition: "ABOVE" | "BELOW";
  isActive: boolean;
}

export function LiveAlertTracker() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [triggeredAlert, setTriggeredAlert] = useState<{ alert: Alert, currentPrice: number } | null>(null);
  const router = useRouter();

  // Fetch active alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/alerts", { 
          cache: "no-store", 
          headers: { "Cache-Control": "no-cache" } 
        });
        if (!res.ok) return;
        const data: Alert[] = await res.json();
        const active = data.filter(a => a.isActive);
        console.log("LiveAlertTracker - Fetched active alerts:", active);
        setAlerts(active);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
    };
    fetchAlerts();
    // Refresh alerts list every 10 seconds to pick up newly created ones quickly
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Poll prices for active alerts
  useEffect(() => {
    // If no alerts, or an alert is already on screen, don't poll
    if (alerts.length === 0 || triggeredAlert) return;

    const checkPrices = async () => {
      const symbols = Array.from(new Set(alerts.map(a => a.symbol)));
      const liveQuotes: Record<string, number> = {};

      for (const symbol of symbols) {
        try {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.NEXT_PUBLIC_FINNHUB_API_KEY}`);
          const data = await res.json();
          console.log(`LiveAlertTracker - Finnhub Quote for ${symbol}:`, data);
          if (data && data.c) {
            liveQuotes[symbol] = data.c;
          }
        } catch (e) {
          console.error("Finnhub live quote error:", e);
        }
      }

      for (const alert of alerts) {
        const currentPrice = liveQuotes[alert.symbol];
        if (!currentPrice) continue;

        let isTriggered = false;
        if (alert.condition === "ABOVE" && currentPrice >= alert.targetPrice) {
          isTriggered = true;
        } else if (alert.condition === "BELOW" && currentPrice <= alert.targetPrice) {
          isTriggered = true;
        }

        if (isTriggered) {
          console.log("LiveAlertTracker - Trigger condition met for:", alert.symbol);
          setTriggeredAlert({ alert, currentPrice });
          break; // Show one alert at a time
        } else {
          console.log(`LiveAlertTracker - Condition NOT met for ${alert.symbol}: currentPrice=${currentPrice}, targetPrice=${alert.targetPrice}, condition=${alert.condition}`);
        }
      }
    };

    checkPrices(); // Initial check
    const interval = setInterval(checkPrices, 15000); // 15s polling
    return () => clearInterval(interval);
  }, [alerts, triggeredAlert]);

  const handleAction = async (action: "dismiss" | "trade") => {
    if (!triggeredAlert) return;
    
    const toTrigger = triggeredAlert;
    
    // Optimistically clear it from screen and local state
    setTriggeredAlert(null);
    setAlerts(prev => prev.filter(a => a._id !== toTrigger.alert._id));

    // Call API to mark inactive and send email
    try {
      await fetch("/api/alerts/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          alertId: toTrigger.alert._id, 
          currentPrice: toTrigger.currentPrice 
        })
      });
    } catch (e) {
      console.error("Failed to trigger alert API:", e);
    }

    if (action === "trade") {
      router.push(`/sandbox`);
    }
  };

  if (!triggeredAlert) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#141414] border border-[#212328] p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-[#FDD458]/10 text-[#FDD458] rounded-full flex items-center justify-center mx-auto text-3xl">
          🔔
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#f5f5f5]">Alert Triggered!</h2>
          <p className="text-[#9095A1] text-lg">
            <span className="text-[#f5f5f5] font-semibold">{triggeredAlert.alert.symbol}</span> has crossed your target of <span className="text-[#f5f5f5] font-semibold">${triggeredAlert.alert.targetPrice.toFixed(2)}</span>.
          </p>
          <p className="text-[#9095A1] text-sm">
            Current Price: <span className="text-[#FDD458] font-semibold">${triggeredAlert.currentPrice.toFixed(2)}</span>
          </p>
        </div>
        <div className="flex gap-4 pt-4">
          <Button 
            variant="outline" 
            className="flex-1 border-[#30333A] bg-[#0A0A0A] text-[#CCDADC] hover:bg-[#212328] hover:text-[#f5f5f5] font-semibold"
            onClick={() => handleAction("dismiss")}
          >
            Dismiss
          </Button>
          <Button 
            className="flex-1 bg-[#FDD458] hover:bg-[#FCE082] text-[#050505] font-bold"
            onClick={() => handleAction("trade")}
          >
            Trade Now
          </Button>
        </div>
      </div>
    </div>
  );
}
