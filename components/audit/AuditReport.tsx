'use client';

import { useState } from 'react';
import { FileText, Loader2, ShieldAlert, TrendingUp, Download, AlertTriangle } from 'lucide-react';

interface AuditReportProps {
  portfolio?: any[];
  marketData?: any;
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    LOW:    { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
    MEDIUM: { bg: 'rgba(234,179,8,0.15)',   color: '#facc15' },
    HIGH:   { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  };
  const c = colors[level] ?? colors.MEDIUM;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color,
    }}>{level} RISK</span>
  );
}

export function AuditReport({ portfolio = [], marketData = {} }: AuditReportProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio, marketData }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); } else { setReport(data); }
    } catch {
      setError('Failed to generate audit. Please try again.');
    }
    setLoading(false);
  };

  const exportPDF = async () => {
    if (!report) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('FinNext — AI Portfolio Audit Report', 20, 25);
    doc.setFontSize(13);
    doc.text(`Portfolio Health Score: ${report.overallScore}/100`, 20, 40);
    doc.text(`Risk Level: ${report.riskLevel}`, 20, 50);
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(report.exportSummary ?? report.summary ?? '', 170);
    doc.text(summaryLines, 20, 65);
    (report.topRisks ?? []).forEach((r: any, i: number) => {
      doc.text(`Risk ${i + 1}: ${r.risk} — ${r.recommendation}`, 20, 100 + i * 18);
    });
    doc.save('FinNext-Audit-Report.pdf');
  };

  const scoreColor = (score: number) => score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : '#f87171';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Trigger */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={generateAudit} disabled={loading} className="audit-generate-btn">
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={16} />}
          {loading ? 'Generating NVIDIA AI Audit…' : 'Generate AI Portfolio Audit'}
        </button>
        {report && (
          <button
            onClick={exportPDF}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: '#141414', border: '1px solid #30333A',
              color: '#CCDADC', transition: 'all 0.2s',
            }}
          >
            <Download size={15} /> Export PDF
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: 14, borderRadius: 12, background: 'rgba(255,73,91,0.1)', border: '1px solid rgba(255,73,91,0.3)', color: '#FF495B', fontSize: 13, display: 'flex', gap: 8 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Score + Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
            <div style={{
              background: '#141414', border: '1px solid #212328',
              borderRadius: 14, padding: '24px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 56, fontWeight: 900, color: scoreColor(report.overallScore), lineHeight: 1 }}>
                {report.overallScore}
              </div>
              <div style={{ fontSize: 11, color: '#9095A1', marginTop: 4, marginBottom: 10 }}>Portfolio Health Score</div>
              <RiskBadge level={report.riskLevel ?? 'MEDIUM'} />
            </div>
            <div style={{
              background: '#141414', border: '1px solid #212328',
              borderRadius: 14, padding: '20px 24px',
            }}>
              <p style={{ color: '#CCDADC', fontSize: 14, lineHeight: 1.7 }}>{report.summary}</p>
            </div>
          </div>

          {/* Sector Allocation */}
          {report.sectorAllocation && (
            <div style={{ background: '#141414', border: '1px solid #212328', borderRadius: 14, padding: 20 }}>
              <h4 style={{ color: '#f5f5f5', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Sector Allocation vs Benchmark</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report.sectorAllocation.map((s: any) => (
                  <div key={s.sector} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#9095A1', fontSize: 12, width: 110 }}>{s.sector}</span>
                    <div style={{ flex: 1, background: '#0A0A0A', borderRadius: 4, height: 8, position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, height: 8, borderRadius: 4,
                        width: `${Math.min(s.percentage, 100)}%`,
                        background: s.status === 'OVER' ? '#FF495B' : '#FDD458',
                        transition: 'width 0.6s ease',
                      }} />
                      <div style={{
                        position: 'absolute', top: -2, width: 2, height: 12, background: '#9095A1',
                        left: `${s.benchmark}%`,
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, width: 60, textAlign: 'right', color: s.status === 'OVER' ? '#FF495B' : '#0FEDBE' }}>
                      {s.percentage}% {s.status === 'OVER' ? '↑' : '↓'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks & Opportunities */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: '#141414', border: '1px solid #212328', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <ShieldAlert size={16} style={{ color: '#FF495B' }} />
                <h4 style={{ color: '#f5f5f5', fontSize: 13, fontWeight: 700 }}>Top Risks</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(report.topRisks ?? []).map((r: any, i: number) => (
                  <div key={i} style={{ borderLeft: '2px solid #FF495B', paddingLeft: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ color: '#f5f5f5', fontSize: 13, fontWeight: 600 }}>{r.risk}</span>
                      <RiskBadge level={r.severity} />
                    </div>
                    <p style={{ color: '#9095A1', fontSize: 12 }}>{r.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#141414', border: '1px solid #212328', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <TrendingUp size={16} style={{ color: '#0FEDBE' }} />
                <h4 style={{ color: '#f5f5f5', fontSize: 13, fontWeight: 700 }}>Opportunities</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(report.topOpportunities ?? []).map((o: any, i: number) => (
                  <div key={i} style={{ borderLeft: '2px solid #0FEDBE', paddingLeft: 12 }}>
                    <span style={{ color: '#f5f5f5', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>{o.opportunity}</span>
                    <p style={{ color: '#9095A1', fontSize: 12 }}>{o.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Forecast chart — basic CSS bars instead of Recharts to avoid dep issues */}
          {report.forecast30Days && (
            <div style={{ background: '#141414', border: '1px solid #212328', borderRadius: 14, padding: 20 }}>
              <h4 style={{ color: '#f5f5f5', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>30-Day Predictive Forecast Corridor</h4>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120, overflowX: 'auto' }}>
                {(report.forecast30Days as any[]).map((d: any) => {
                  const max = Math.max(...report.forecast30Days.map((x: any) => x.optimistic));
                  const min = Math.min(...report.forecast30Days.map((x: any) => x.pessimistic));
                  const range = max - min || 1;
                  const baseH = ((d.base - min) / range) * 100;
                  const optH = ((d.optimistic - min) / range) * 100;
                  return (
                    <div key={d.day} title={`Day ${d.day}\nBase: ₹${d.base?.toLocaleString('en-IN')}`}
                      style={{ flex: 1, minWidth: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 1, cursor: 'default' }}>
                      <div style={{ width: '100%', height: `${optH}%`, background: 'rgba(15,237,190,0.3)', borderRadius: '2px 2px 0 0' }} />
                      <div style={{ width: '100%', height: `${baseH}%`, background: '#FDD458', borderRadius: '2px 2px 0 0', marginTop: -((optH - baseH) / 100 * 120) }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
                {[{ color: '#0FEDBE', label: 'Optimistic' }, { color: '#FDD458', label: 'Base' }, { color: '#FF495B', label: 'Pessimistic' }].map(l => (
                  <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9095A1' }}>
                    <span style={{ width: 10, height: 3, borderRadius: 2, background: l.color, display: 'inline-block' }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
