'use client';

import { useState, useEffect } from 'react';
import { FlaskConical, Loader2, DollarSign, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';

interface SandboxTradeWidgetProps {
  symbol: string;
  companyName: string;
  currentPrice: number;
}

export function SandboxTradeWidget({ symbol, companyName, currentPrice }: SandboxTradeWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState<number>(10);
  const [virtualBalance, setVirtualBalance] = useState<number | null>(null);

  // Fetch sandbox state when dialog opens to display the available virtual balance
  useEffect(() => {
    if (isOpen) {
      fetchSandboxBalance();
    }
  }, [isOpen]);

  const fetchSandboxBalance = async () => {
    try {
      const res = await fetch('/api/sandbox');
      if (res.ok) {
        const data = await res.json();
        setVirtualBalance(data.virtualBalance);
      }
    } catch (e) {
      console.error('Failed to fetch sandbox balance:', e);
    }
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      toast.error('Invalid Quantity', { description: 'Please enter a quantity greater than 0.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/sandbox/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: symbol.toUpperCase(),
          action,
          quantity,
          currentPrice,
          companyName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Trade Successful!`, {
          description: `Successfully ${action === 'BUY' ? 'bought' : 'sold'} ${quantity} shares of ${symbol.toUpperCase()}.`,
        });
        setIsOpen(false);
      } else {
        toast.error('Trade Failed', {
          description: data.error || 'Something went wrong during execution.',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Trade Failed', { description: 'Network error. Please try again.' });
    }
    setLoading(false);
  };

  const estimatedTotal = quantity * currentPrice;

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:bg-[rgba(253,212,88,0.25)]"
          style={{
            background: 'rgba(253,212,88,0.15)',
            color: '#FDD458',
            border: '1px solid rgba(253,212,88,0.3)',
          }}
          title={`Trade ${symbol} in Sandbox`}
        >
          <FlaskConical size={16} />
          Trade in Sandbox
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#141414] border border-[#212328] p-6 rounded-2xl shadow-xl z-50 animate-in zoom-in-95 focus:outline-none"
        >
          <Dialog.Title className="text-lg font-bold text-[#f5f5f5] mb-1 flex items-center gap-2">
            <FlaskConical style={{ color: '#FDD458' }} size={20} /> Trade {symbol.toUpperCase()}
          </Dialog.Title>
          <Dialog.Description className="text-xs text-[#9095A1] mb-5">
            {companyName} · Current Price: <span className="text-[#f5f5f5] font-semibold">₹{currentPrice.toFixed(2)}</span>
          </Dialog.Description>

          {/* Virtual Balance Status */}
          <div className="flex items-center justify-between bg-[#0A0A0A] border border-[#212328] px-4 py-3 rounded-xl mb-5">
            <div className="flex items-center gap-2 text-xs text-[#9095A1]">
              <Wallet size={14} className="text-[#FDD458]" />
              <span>Available Virtual Balance</span>
            </div>
            <div className="text-sm font-bold text-[#f5f5f5]">
              {virtualBalance !== null ? `₹${virtualBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 'Loading...'}
            </div>
          </div>

          <form onSubmit={handleTrade} className="flex flex-col gap-4">
            {/* Segmented control for BUY / SELL */}
            <div>
              <label className="block text-xs font-semibold text-[#CCDADC] mb-2">Order Type</label>
              <div className="grid grid-cols-2 gap-2 bg-[#0A0A0A] p-1.5 rounded-xl border border-[#212328]">
                <button
                  type="button"
                  onClick={() => setAction('BUY')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs transition-all ${
                    action === 'BUY'
                      ? 'bg-[#0FEDBE]/20 text-[#0FEDBE] border border-[#0FEDBE]/30'
                      : 'text-[#9095A1] hover:text-[#CCDADC]'
                  }`}
                >
                  <ArrowUpRight size={14} />
                  BUY (Long)
                </button>
                <button
                  type="button"
                  onClick={() => setAction('SELL')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs transition-all ${
                    action === 'SELL'
                      ? 'bg-[#FF495B]/20 text-[#FF495B] border border-[#FF495B]/30'
                      : 'text-[#9095A1] hover:text-[#CCDADC]'
                  }`}
                >
                  <ArrowDownRight size={14} />
                  SELL (Short)
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-xs font-semibold text-[#CCDADC] mb-2">Quantity (Shares)</label>
              <div className="flex items-center bg-[#0A0A0A] border border-[#30333A] rounded-xl overflow-hidden focus-within:border-[#FDD458]">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-4 py-2.5 text-[#9095A1] hover:text-[#f5f5f5] text-lg font-semibold border-r border-[#212328]"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  required
                  className="flex-1 bg-transparent text-[#f5f5f5] text-sm text-center outline-none py-2.5 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-4 py-2.5 text-[#9095A1] hover:text-[#f5f5f5] text-lg font-semibold border-l border-[#212328]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Estimated Total */}
            <div className="flex items-center justify-between border-t border-[#212328] pt-4 mt-2">
              <div className="text-xs text-[#9095A1]">Estimated Total</div>
              <div className="text-base font-bold text-[#f5f5f5]">
                ₹{estimatedTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || quantity <= 0}
              className="w-full flex justify-center items-center gap-2 bg-[#FDD458] text-[#050505] font-bold text-sm py-3 rounded-xl mt-3 hover:bg-[#FCE082] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <FlaskConical size={16} />
                  Execute {action} Order
                </>
              )}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
