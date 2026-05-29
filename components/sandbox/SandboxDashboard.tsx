'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, FlaskConical, Wallet, PieChart, Activity, RotateCcw } from 'lucide-react';

interface SandboxPosition {
  ticker: string;
  companyName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  openedAt: string;
}

interface SandboxState {
  virtualBalance: number;
  initialBalance: number;
  positions: SandboxPosition[];
  transactions: any[];
  totalPnL: number;
}

export function SandboxDashboard() {
  const [sandbox, setSandbox] = useState<SandboxState | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const loadSandbox = async () => {
    setLoading(true);
    const res = await fetch('/api/sandbox');
    const data = await res.json();
    setSandbox(data);
    setLoading(false);
  };

  useEffect(() => { loadSandbox(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ height: 80, borderRadius: 14, background: 'rgba(30,41,59,0.4)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
    );
  }

  if (!sandbox) return null;

  const portfolioValue = sandbox.positions.reduce(
    (sum, p) => sum + p.currentPrice * p.quantity, 0
  );
  const totalValue = sandbox.virtualBalance + portfolioValue;
  const totalReturn = ((totalValue - sandbox.initialBalance) / sandbox.initialBalance) * 100;

  const stats = [
    { label: 'Virtual Cash', value: `₹${sandbox.virtualBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: Wallet, color: '#e2e8f0' },
    { label: 'Portfolio Value', value: `₹${portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: PieChart, color: '#818cf8' },
    { label: 'Total Value', value: `₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: Activity, color: '#e2e8f0' },
    {
      label: 'Total Return',
      value: `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`,
      icon: totalReturn >= 0 ? TrendingUp : TrendingDown,
      color: totalReturn >= 0 ? '#4ade80' : '#f87171',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats row */}
      <div className="sandbox-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="sandbox-stat-card">
            <div className="sandbox-stat-body">
              <div>
                <p className="sandbox-stat-label">{s.label}</p>
                <p className="sandbox-stat-value" style={{ color: s.color }}>{s.value}</p>
              </div>
              <div className="sandbox-stat-icon-box" style={{
                background: `${s.color}15`,
                border: `1px solid ${s.color}25`,
              }}>
                <s.icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Open positions */}
      <div className="sandbox-table-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #212328', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FlaskConical size={18} style={{ color: '#3B82F6' }} />
          <h3 style={{ color: '#f5f5f5', fontWeight: 700, fontSize: 15, flex: 1 }}>Open Positions</h3>
          <span style={{ fontSize: 12, color: '#9095A1' }}>{sandbox.positions.length} positions</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {sandbox.positions.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9095A1', fontSize: 14 }}>
              <FlaskConical size={28} style={{ color: '#212328', margin: '0 auto 12px' }} />
              No open positions. Use "Test in Sandbox" buttons from AI insights.
            </div>
          ) : (
            <table style={{ width: '100%', minWidth: 550, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #212328' }}>
                  {['Ticker', 'Company', 'Qty', 'Avg Price', 'Current', 'P&L'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: '#9095A1', fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sandbox.positions.map((pos) => {
                  const pnl = (pos.currentPrice - pos.avgBuyPrice) * pos.quantity;
                  const pnlPct = ((pos.currentPrice - pos.avgBuyPrice) / pos.avgBuyPrice) * 100;
                  return (
                    <tr key={pos.ticker} style={{ borderBottom: '1px solid #212328' }}>
                      <td style={{ padding: '12px 16px', color: '#3B82F6', fontWeight: 700 }}>{pos.ticker}</td>
                      <td style={{ padding: '12px 16px', color: '#CCDADC', fontSize: 12 }}>{pos.companyName}</td>
                      <td style={{ padding: '12px 16px', color: '#f5f5f5' }}>{pos.quantity}</td>
                      <td style={{ padding: '12px 16px', color: '#CCDADC' }}>₹{pos.avgBuyPrice.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', color: '#f5f5f5' }}>₹{pos.currentPrice.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: pnl >= 0 ? '#0FEDBE' : '#FF495B' }}>
                        {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(0)} <span style={{ fontWeight: 400, fontSize: 11 }}>({pnlPct.toFixed(1)}%)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
