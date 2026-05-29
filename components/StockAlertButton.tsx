'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing, Loader2, Trash2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface StockAlertButtonProps {
  symbol: string;
  currentPrice?: number;
  iconOnly?: boolean;
}

export function StockAlertButton({ symbol, currentPrice = 0, iconOnly = false }: StockAlertButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  // Form state
  const [targetPrice, setTargetPrice] = useState<string>(currentPrice.toString() || '');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen]);

  const fetchAlerts = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/alerts?symbol=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setActiveAlerts(data);
      }
    } catch (e) {
      console.error(e);
    }
    setFetching(false);
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice) return;
    setLoading(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          targetPrice: parseFloat(targetPrice),
          condition
        }),
      });
      if (res.ok) {
        setTargetPrice('');
        await fetchAlerts();
      } else {
        alert('Failed to set alert');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const hasActiveAlert = activeAlerts.some(a => a.isActive);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className={iconOnly 
            ? `watchlist-icon-btn ${hasActiveAlert ? 'watchlist-icon-added' : ''}` 
            : "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"}
          style={iconOnly ? undefined : {
            background: hasActiveAlert ? 'rgba(59,130,246,0.15)' : '#212328',
            color: hasActiveAlert ? '#3B82F6' : '#CCDADC',
            border: `1px solid ${hasActiveAlert ? 'rgba(59,130,246,0.3)' : '#30333A'}`
          }}
          title={hasActiveAlert ? 'Manage Alerts' : 'Set Alert'}
        >
          {hasActiveAlert ? <BellRing size={iconOnly ? 20 : 16} /> : <Bell size={iconOnly ? 20 : 16} />}
          {!iconOnly && (hasActiveAlert ? 'Alert Set' : 'Set Alert')}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#141414] border border-[#212328] p-6 rounded-2xl shadow-xl z-50 animate-in zoom-in-95"
        >
          <Dialog.Title className="text-lg font-bold text-[#f5f5f5] mb-2 flex items-center gap-2">
            <Bell style={{ color: '#3B82F6' }} size={20} /> Price Alerts for {symbol}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-[#9095A1] mb-6">
            Get an email notification when {symbol} crosses your target price.
          </Dialog.Description>

          <form onSubmit={handleCreateAlert} className="flex flex-col gap-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#CCDADC] mb-2">Condition</label>
                <select 
                  value={condition} 
                  onChange={(e) => setCondition(e.target.value as 'ABOVE' | 'BELOW')}
                  className="w-full bg-[#0A0A0A] border border-[#30333A] text-[#f5f5f5] text-sm rounded-lg p-2.5 outline-none focus:border-[#3B82F6]"
                >
                  <option value="ABOVE">Rises Above</option>
                  <option value="BELOW">Drops Below</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[#CCDADC] mb-2">Target Price ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-[#0A0A0A] border border-[#30333A] text-[#f5f5f5] text-sm rounded-lg p-2.5 outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-[#3B82F6] text-[#050505] font-bold text-sm py-2.5 rounded-lg mt-2 hover:bg-[#FCE082] transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><Bell size={16} /> Create Alert</>}
            </button>
          </form>

          <div>
            <h4 className="text-xs font-semibold text-[#CCDADC] uppercase tracking-wider mb-3">Active Alerts</h4>
            {fetching ? (
              <div className="flex justify-center p-4"><Loader2 size={16} className="animate-spin text-[#9095A1]" /></div>
            ) : activeAlerts.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {activeAlerts.map(alert => (
                  <div key={alert._id} className="flex items-center justify-between bg-[#0A0A0A] border border-[#212328] p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${alert.isActive ? 'bg-[#0FEDBE]' : 'bg-[#30333A]'}`}></div>
                      <div>
                        <span className="text-sm font-semibold text-[#f5f5f5]">
                          {alert.condition === 'ABOVE' ? '↑' : '↓'} ${alert.targetPrice.toFixed(2)}
                        </span>
                        {!alert.isActive && <span className="ml-2 text-xs text-[#FF495B]">(Triggered)</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteAlert(alert._id)}
                      className="text-[#9095A1] hover:text-[#FF495B] transition-colors"
                      title="Delete alert"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9095A1] text-center p-4 bg-[#0A0A0A] rounded-lg border border-dashed border-[#30333A]">No active alerts</p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
