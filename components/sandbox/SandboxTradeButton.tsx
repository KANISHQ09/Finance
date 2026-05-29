'use client';

import { useState } from 'react';
import { FlaskConical, Loader2, CheckCircle2, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface SandboxTradeButtonProps {
  ticker: string;
  /** Pass a known price to skip the live fetch (e.g. from stock detail page).
   *  Pass 0 or omit to auto-fetch the live Finnhub price. */
  currentPrice?: number;
  companyName?: string;
  suggestedAction?: 'BUY' | 'SELL';
  suggestedQuantity?: number;
}

export function SandboxTradeButton({
  ticker,
  currentPrice = 0,
  companyName,
  suggestedAction = 'BUY',
  suggestedQuantity = 10,
}: SandboxTradeButtonProps) {
  const [status, setStatus] = useState<'idle' | 'fetching' | 'loading' | 'done' | 'error'>('idle');
  const [livePrice, setLivePrice] = useState<number>(currentPrice);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const executeTrade = async () => {
    setStatus('fetching');
    setErrorMsg('');

    let priceToUse = livePrice;

    // If we don't have a valid price yet, fetch it live
    if (!priceToUse || priceToUse <= 0) {
      try {
        const quoteRes = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(ticker)}`);
        const quoteData = await quoteRes.json();
        if (!quoteRes.ok || !quoteData.price || quoteData.price <= 0) {
          setStatus('error');
          setErrorMsg('Could not fetch live price');
          setTimeout(() => setStatus('idle'), 3000);
          return;
        }
        priceToUse = quoteData.price;
        setLivePrice(priceToUse);
      } catch {
        setStatus('error');
        setErrorMsg('Network error');
        setTimeout(() => setStatus('idle'), 3000);
        return;
      }
    }

    // Execute the sandbox trade with the live price
    setStatus('loading');
    try {
      const res = await fetch('/api/sandbox/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          action: suggestedAction,
          quantity: suggestedQuantity,
          currentPrice: priceToUse,
          companyName: companyName ?? ticker,
        }),
      });

      if (res.ok) {
        setStatus('done');
      } else {
        const data = await res.json();
        setErrorMsg(data.error ?? 'Trade failed');
        setStatus('error');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error');
    }

    setTimeout(() => {
      setStatus('idle');
      setErrorMsg('');
    }, 3500);
  };

  const isWorking = status === 'fetching' || status === 'loading';
  const loadingLabel = status === 'fetching' ? 'Getting price…' : 'Executing…';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        type="button"
        onClick={executeTrade}
        disabled={isWorking || status === 'done'}
        className="sandbox-trade-btn"
        title={
          livePrice > 0
            ? `${suggestedAction} ${suggestedQuantity} × ₹${livePrice.toFixed(2)} = ₹${(suggestedQuantity * livePrice).toFixed(0)}`
            : `${suggestedAction} ${suggestedQuantity} shares of ${ticker} (live price fetched on click)`
        }
      >
        {isWorking && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
        {status === 'done' && <CheckCircle2 size={12} style={{ color: '#0FEDBE' }} />}
        {status === 'error' && <XCircle size={12} style={{ color: '#FF495B' }} />}
        {status === 'idle' && (
          suggestedAction === 'BUY'
            ? <TrendingUp size={12} style={{ color: '#0FEDBE' }} />
            : <TrendingDown size={12} style={{ color: '#FF495B' }} />
        )}
        {isWorking
          ? loadingLabel
          : status === 'done'
          ? `✓ ${suggestedAction} Executed`
          : status === 'error'
          ? errorMsg || 'Failed'
          : `${suggestedAction === 'BUY' ? '↑ BUY' : '↓ SELL'} ${suggestedQuantity} × ${ticker}`}
      </button>

      {/* Show live price preview when known */}
      {livePrice > 0 && status === 'idle' && (
        <span style={{ fontSize: 10, color: '#9095A1', paddingLeft: 2 }}>
          Live price: ₹{livePrice.toFixed(2)} · Est. ₹{(suggestedQuantity * livePrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
      )}
    </div>
  );
}
