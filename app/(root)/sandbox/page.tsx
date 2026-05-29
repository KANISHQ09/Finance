import { SandboxDashboard } from '@/components/sandbox/SandboxDashboard';
import { FlaskConical, Info } from 'lucide-react';

export const metadata = {
  title: 'Paper Trading Sandbox — FinNext',
  description: 'Risk-free paper trading with ₹1,00,000 virtual balance. Test strategies powered by NVIDIA AI.',
};

export default function SandboxPage() {
  return (
    <main className="sandbox-container">
      {/* Header */}
      <div className="sandbox-header">
        <div className="sandbox-header-icon">
          <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#3B82F6' }} />
        </div>
        <div>
          <h1 className="sandbox-header-title">
            Paper Trading Sandbox
          </h1>
          <p style={{ color: '#9095A1', fontSize: 14 }}>
            Practice strategies risk-free with ₹1,00,000 virtual balance.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="sandbox-info-banner">
        <Info size={15} style={{ flexShrink: 0, marginTop: 1, color: '#3B82F6' }} />
        <span>
          All trades are <strong>virtual</strong> — no real money involved. Use the <strong>Test in Sandbox</strong> buttons on AI insight cards, or trade directly from stock pages.
          Prices update when you interact with a stock.
        </span>
      </div>

      <SandboxDashboard />
    </main>
  );
}
