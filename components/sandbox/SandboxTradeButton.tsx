'use client';

import { useState } from 'react';
import { FlaskConical, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface SandboxTradeButtonProps {
  ticker: string;
  currentPrice: number;
  companyName?: string;
  suggestedAction?: 'BUY' | 'SELL';
  suggestedQuantity?: number;
}

export function SandboxTradeButton({
  ticker,
  currentPrice,
  companyName,
  suggestedAction = 'BUY',
  suggestedQuantity = 10,
}: SandboxTradeButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const executeTrade = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/sandbox/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          action: suggestedAction,
          quantity: suggestedQuantity,
          currentPrice,
          companyName: companyName ?? ticker,
        }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <button
      type="button"
      onClick={executeTrade}
      disabled={status === 'loading'}
      className="sandbox-trade-btn"
    >
      {status === 'loading' && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
      {status === 'done' && <CheckCircle2 size={12} style={{ color: '#0FEDBE' }} />}
      {status === 'error' && <XCircle size={12} style={{ color: '#FF495B' }} />}
      {status === 'idle' && <FlaskConical size={12} />}
      {status === 'done' ? '✓ Added to Sandbox' : status === 'error' ? 'Failed' : `Test ${suggestedAction} in Sandbox`}
    </button>
  );
}
