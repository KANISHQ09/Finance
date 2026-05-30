'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, FlaskConical, Wallet, PieChart, Activity, RotateCcw, Loader2 } from 'lucide-react';

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sell Modal States
  const [selectedPos, setSelectedPos] = useState<SandboxPosition | null>(null);
  const [sellQty, setSellQty] = useState<number>(0);
  const [isSellingPos, setIsSellingPos] = useState(false);
  const [sellError, setSellError] = useState<string>('');

  const loadSandbox = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch('/api/sandbox');
      if (res.ok) {
        const data = await res.json();
        setSandbox(data);
      }
    } catch (e) {
      console.error('Failed to load sandbox:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSandbox();

    // Polling every 5 seconds for real-time stock prices
    const interval = setInterval(() => {
      loadSandbox(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleExecuteSell = async () => {
    if (!selectedPos || !sellQty || sellQty <= 0) return;
    if (sellQty > selectedPos.quantity) {
      setSellError(`You cannot sell more than your owned ${selectedPos.quantity} shares.`);
      return;
    }

    setIsSellingPos(true);
    try {
      const res = await fetch('/api/sandbox/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: selectedPos.ticker.toUpperCase(),
          action: 'SELL',
          quantity: sellQty,
          currentPrice: selectedPos.currentPrice,
          companyName: selectedPos.companyName,
        }),
      });

      if (res.ok) {
        setSelectedPos(null);
        await loadSandbox(true);
      } else {
        const data = await res.json();
        setSellError(data.error ?? 'Failed to execute sell.');
      }
    } catch {
      setSellError('Network error executing sell.');
    } finally {
      setIsSellingPos(false);
    }
  };

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
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #212328', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <FlaskConical size={18} style={{ color: '#FDD458' }} />
          <h3 style={{ color: '#f5f5f5', fontWeight: 700, fontSize: 15, flex: 1 }}>Open Positions</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Live pulsing pricing badge */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              background: 'rgba(15,237,190,0.08)',
              border: '1px solid rgba(15,237,190,0.2)',
              padding: '4px 10px',
              borderRadius: 20,
              color: '#0FEDBE',
              fontWeight: 700,
              letterSpacing: '0.03em'
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#0FEDBE',
                boxShadow: '0 0 8px #0FEDBE',
                animation: 'pulse 1.5s infinite'
              }} />
              LIVE PRICING
            </span>

            <button
              onClick={() => loadSandbox(true)}
              disabled={isRefreshing}
              style={{
                background: 'none',
                border: 'none',
                color: '#9095A1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 4,
                borderRadius: 4,
              }}
              title="Refresh price quotes"
            >
              <RotateCcw
                size={14}
                style={{
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  color: isRefreshing ? '#FDD458' : '#9095A1'
                }}
              />
            </button>

            <span style={{ fontSize: 12, color: '#9095A1' }}>{sandbox.positions.length} positions</span>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          {sandbox.positions.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9095A1', fontSize: 14 }}>
              <FlaskConical size={28} style={{ color: '#212328', margin: '0 auto 12px' }} />
              No open positions. Use "Test in Sandbox" buttons from AI insights.
            </div>
          ) : (
            <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #212328' }}>
                  {['Ticker', 'Company', 'Qty', 'Avg Price', 'Current Price', 'P&L', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#9095A1', fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sandbox.positions.map((pos) => {
                  const pnl = (pos.currentPrice - pos.avgBuyPrice) * pos.quantity;
                  const pnlPct = ((pos.currentPrice - pos.avgBuyPrice) / pos.avgBuyPrice) * 100;
                  return (
                    <tr key={pos.ticker} style={{ borderBottom: '1px solid #212328', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '12px 16px', color: '#FDD458', fontWeight: 700 }}>{pos.ticker}</td>
                      <td style={{ padding: '12px 16px', color: '#CCDADC', fontSize: 12 }}>{pos.companyName}</td>
                      <td style={{ padding: '12px 16px', color: '#f5f5f5' }}>{pos.quantity}</td>
                      <td style={{ padding: '12px 16px', color: '#CCDADC' }}>₹{pos.avgBuyPrice.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', color: '#f5f5f5', fontWeight: 500 }}>₹{pos.currentPrice.toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: pnl >= 0 ? '#0FEDBE' : '#FF495B' }}>
                        {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(0)} <span style={{ fontWeight: 400, fontSize: 11 }}>({pnlPct.toFixed(1)}%)</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPos(pos);
                            setSellQty(pos.quantity); // default to max
                            setSellError('');
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: 'rgba(255, 73, 91, 0.1)',
                            border: '1px solid rgba(255, 73, 91, 0.3)',
                            color: '#FF495B',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 73, 91, 0.2)';
                            e.currentTarget.style.borderColor = 'rgba(255, 73, 91, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 73, 91, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 73, 91, 0.3)';
                          }}
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Interactive Sell Modal */}
      {selectedPos && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999,
          padding: 16
        }}>
          <div style={{
            background: '#141414',
            border: '1px solid #212328',
            borderRadius: 16,
            width: '100%',
            maxWidth: 400,
            padding: 24,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <h3 style={{ color: '#f5f5f5', fontWeight: 800, fontSize: 18, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlaskConical size={18} style={{ color: '#FF495B' }} /> Sell {selectedPos.ticker}
            </h3>
            <p style={{ color: '#9095A1', fontSize: 13, marginBottom: 20 }}>
              {selectedPos.companyName} · Owned: <strong>{selectedPos.quantity} shares</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', color: '#CCDADC', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  Shares to Sell (Max: {selectedPos.quantity})
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min={1}
                    max={selectedPos.quantity}
                    value={sellQty || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setSellQty(val);
                      if (val > selectedPos.quantity) {
                        setSellError(`You cannot sell more than ${selectedPos.quantity} shares.`);
                      } else if (val <= 0 || isNaN(val)) {
                        setSellError('Please enter a valid quantity of shares.');
                      } else {
                        setSellError('');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#0A0A0A',
                      border: sellError ? '1px solid #FF495B' : '1px solid #30333A',
                      borderRadius: 8,
                      color: '#f5f5f5',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSellQty(selectedPos.quantity);
                      setSellError('');
                    }}
                    style={{
                      position: 'absolute',
                      right: 8, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(253, 212, 88, 0.1)',
                      border: '1px solid rgba(253, 212, 88, 0.25)',
                      borderRadius: 4,
                      color: '#FDD458',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '3px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    MAX
                  </button>
                </div>
                {sellError && (
                  <p style={{ color: '#FF495B', fontSize: 11, marginTop: 4, fontWeight: 600 }}>{sellError}</p>
                )}
              </div>

              <div style={{ background: '#0A0A0A', padding: 12, borderRadius: 8, border: '1px solid #212328' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9095A1', marginBottom: 4 }}>
                  <span>Current Live Price</span>
                  <span style={{ color: '#f5f5f5', fontWeight: 600 }}>₹{selectedPos.currentPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#9095A1', fontWeight: 600, borderTop: '1px solid #212328', paddingTop: 8, marginTop: 4 }}>
                  <span>Est. Revenue</span>
                  <span style={{ color: '#0FEDBE', fontWeight: 800 }}>
                    ₹{((sellQty || 0) * selectedPos.currentPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedPos(null)}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: 'transparent', border: '1px solid #30333A',
                  color: '#9095A1', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSell}
                disabled={isSellingPos || !!sellError || !sellQty}
                style={{
                  padding: '8px 20px', borderRadius: 8,
                  background: 'linear-gradient(to bottom, #FF495B, #D33647)',
                  border: 'none',
                  color: '#ffffff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  opacity: (isSellingPos || !!sellError || !sellQty) ? 0.5 : 1,
                  boxShadow: '0 4px 12px rgba(255, 73, 91, 0.2)',
                }}
              >
                {isSellingPos && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                {isSellingPos ? 'Selling...' : 'Confirm Sell'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
