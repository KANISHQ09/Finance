import { SandboxDashboard } from '@/components/sandbox/SandboxDashboard';
import { FlaskConical, Info } from 'lucide-react';

export const metadata = {
  title: 'Paper Trading Sandbox — FinNext',
  description: 'Risk-free paper trading with ₹1,00,000 virtual balance. Test strategies powered by NVIDIA AI.',
};

export default function SandboxPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(253,212,88,0.15), rgba(253,212,88,0.05))',
          border: '1px solid rgba(253,212,88,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <FlaskConical size={24} style={{ color: '#FDD458' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f5f5f5', marginBottom: 4 }}>
            Paper Trading Sandbox
          </h1>
          <p style={{ color: '#9095A1', fontSize: 14 }}>
            Practice strategies risk-free with ₹1,00,000 virtual balance.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '14px 18px', marginBottom: 24,
        background: '#141414', border: '1px solid #212328',
        borderRadius: 12, fontSize: 13, color: '#CCDADC',
      }}>
        <Info size={15} style={{ flexShrink: 0, marginTop: 1, color: '#FDD458' }} />
        <span>
          All trades are <strong>virtual</strong> — no real money involved. Use the <strong>Test in Sandbox</strong> buttons on AI insight cards, or trade directly from stock pages.
          Prices update when you interact with a stock.
        </span>
      </div>

      <SandboxDashboard />
    </main>
  );
}
