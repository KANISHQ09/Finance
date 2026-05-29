'use client';

import { useState } from 'react';
import { Chatbot } from '@/components/Chatbot';
import { Bot, TrendingUp, FlaskConical, ShieldCheck, BarChart2, Sparkles, X, Loader2, Download, RefreshCw, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const CAPABILITIES = [
  {
    icon: TrendingUp,
    title: 'Strategic Picks',
    desc: 'Get personalised stock recommendations aligned with your risk tolerance and goals.',
    color: '#0FEDBE',
  },
  {
    icon: FlaskConical,
    title: 'Virtual Sandbox Trades',
    desc: 'Ask the assistant to execute paper-trades directly inside your virtual sandbox.',
    color: '#FDD458',
  },
  {
    icon: ShieldCheck,
    title: 'Strategic Audits',
    desc: 'Understand diversification gaps, capital exposure, and sector double-expositions.',
    color: '#818cf8',
  },
];

const EXAMPLE_PROMPTS = [
  'Based on my goals, which sector should I focus on?',
  'Recommend 3 tech stocks for my sandbox.',
  'What is my current sandbox balance?',
  'How diversified is my portfolio?',
];

export default function AssistantPage() {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [depthReport, setDepthReport] = useState<any>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const handleGenerateReport = async () => {
    setIsReportLoading(true);
    setReportError(null);
    setDepthReport(null);
    setLoadingStep(0);
    
    // Cycle through loading steps for a premium look
    const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 5);
    }, 1500);

    try {
        const response = await fetch("/api/agents/depth-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ generateOnly: true }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to generate AI strategic report.");
        }

        const data = await response.json();
        if (data.error) {
            setReportError(data.error);
        } else {
            setDepthReport(data.report);
        }
    } catch (err: any) {
        setReportError(err.message || "An unexpected error occurred while generating the report.");
    } finally {
        clearInterval(interval);
        setIsReportLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!depthReport) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Premium Header background
    doc.setFillColor(20, 20, 20);
    doc.rect(0, 0, 210, 42, 'F');

    doc.setFontSize(22);
    doc.setTextColor(253, 212, 88); // Yellow primary
    doc.text('FINNEXT — AI PORTFOLIO DEPTH REPORT', 20, 25);
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`CONFIDENTIAL // COMPILED SECURELY VIA FINNEXT AI & MONGOOSE DATA`, 20, 34);

    doc.setDrawColor(253, 212, 88);
    doc.setLineWidth(1);
    doc.line(20, 42, 190, 42);

    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text('1. Executive Portfolio Health Overview', 20, 56);

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`- Real Portfolio Health Score: ${depthReport.portfolioScore}/100`, 25, 66);
    doc.text(`- Virtual Sandbox Performance Score: ${depthReport.sandboxScore}/100`, 25, 73);
    doc.text(`- Combined Strategic Health Score: ${depthReport.combinedScore}/100`, 25, 80);

    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text('2. Risk Management & Vulnerability Assessment', 20, 94);
    
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`- Real Account Risk Category: ${depthReport.riskAssessment?.portfolioRisk}`, 25, 104);
    doc.text(`- Virtual Sandbox Trading Risk: ${depthReport.riskAssessment?.sandboxRisk}`, 25, 111);
    doc.text(`- Combined Strategic Risk Profile: ${depthReport.riskAssessment?.combinedRisk}`, 25, 118);
    
    const riskDescLines = doc.splitTextToSize(depthReport.riskAssessment?.description || '', 165);
    doc.text(riskDescLines, 25, 126);

    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text('3. Account Synchronization & Correlation Metrics', 20, 148);
    
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`- Real Portfolio Capital Valuation: INR ${depthReport.comparison?.portfolioValue?.toLocaleString('en-IN')}`, 25, 158);
    doc.text(`- Sandbox Virtual Trading Balance: INR ${depthReport.comparison?.sandboxValue?.toLocaleString('en-IN')}`, 25, 165);
    doc.text(`- Security Allocation Counts (Real vs Virtual): ${depthReport.comparison?.portfolioHoldingsCount} holdings vs ${depthReport.comparison?.sandboxHoldingsCount} sandbox positions`, 25, 172);
    
    const diffLines = doc.splitTextToSize(`- Correlation Analysis: ${depthReport.comparison?.keyDifference}`, 165);
    doc.text(diffLines, 25, 179);

    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text('4. Core Risks & Actions identified by FinNext AI', 20, 200);
    
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    let currentY = 210;
    
    if (depthReport.topRisks && depthReport.topRisks.length > 0) {
        doc.setTextColor(200, 50, 50);
        doc.text(`Identified Concentration / Capital Risks:`, 25, currentY);
        doc.setTextColor(60, 60, 60);
        currentY += 6;
        depthReport.topRisks.forEach((r: any) => {
            const riskLines = doc.splitTextToSize(`* [${r.severity} Severity] ${r.risk} -> Recommendation: ${r.recommendation}`, 160);
            doc.text(riskLines, 28, currentY);
            currentY += riskLines.length * 6;
        });
    }

    if (depthReport.opportunities && depthReport.opportunities.length > 0) {
        currentY += 4;
        doc.setTextColor(20, 150, 100);
        doc.text(`Strategic Opportunities:`, 25, currentY);
        doc.setTextColor(60, 60, 60);
        currentY += 6;
        depthReport.opportunities.forEach((o: any) => {
            const oppLines = doc.splitTextToSize(`* ${o.opportunity} -> Suggested Action: ${o.action}`, 160);
            doc.text(oppLines, 28, currentY);
            currentY += oppLines.length * 6;
        });
    }

    if (depthReport.recommendations && depthReport.recommendations.length > 0) {
        currentY += 4;
        doc.setTextColor(20, 20, 20);
        doc.text(`Core Integration Recommendations:`, 25, currentY);
        doc.setTextColor(60, 60, 60);
        currentY += 6;
        depthReport.recommendations.forEach((rec: string) => {
            const recLines = doc.splitTextToSize(`- ${rec}`, 160);
            doc.text(recLines, 28, currentY);
            currentY += recLines.length * 6;
        });
    }

    doc.save('FinNext-Combined-Depth-Report.pdf');
  };

  return (
    <main className="assistant-container">

      {/* Header */}
      <div className="assistant-header">
        <div className="assistant-header-icon">
          <Bot className="w-6 h-6 sm:w-[30px] sm:h-[30px]" style={{ color: '#FDD458' }} />
        </div>
        <div>
          <h1 className="assistant-header-title">
            AI Financial Assistant
          </h1>
          <p className="assistant-header-subtitle">
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#0FEDBE',
              display: 'inline-block', boxShadow: '0 0 8px #0FEDBE',
            }} />
            Personalised to your profile, portfolio &amp; sandbox
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="assistant-grid">

        {/* Left sidebar */}
        <div className="assistant-sidebar">

          {/* Depth Report trigger card */}
          <div className="assistant-card" style={{ background: 'linear-gradient(135deg, rgba(253,212,88,0.08) 0%, rgba(20,20,20,0.6) 100%)', borderColor: 'rgba(253,212,88,0.2)' }}>
            <h3 style={{ color: '#f5f5f5', fontSize: 17, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <BarChart2 size={18} style={{ color: '#FDD458' }} /> AI Strategic Audit
            </h3>
            <p style={{ color: '#9095A1', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
              Run a strategic AI audit of your profile, portfolio, and virtual sandbox trades.
            </p>
            <button
              onClick={() => setIsReportOpen(true)}
              className="audit-generate-btn"
              style={{ width: '100%', justifyContent: 'center', gap: 8 }}
            >
              <Sparkles size={16} /> Generate AI Depth Report
            </button>
          </div>

          {/* Example prompts */}
          <div className="assistant-card">
            <h3 style={{ color: '#f5f5f5', fontSize: 17, fontWeight: 700, marginBottom: 18 }}>
              Try asking...
            </h3>
            <div className="assistant-prompts-grid">
              {EXAMPLE_PROMPTS.map((p, i) => (
                <div
                  key={i}
                  style={{
                    background: '#0A0A0A', border: '1px solid #212328',
                    borderRadius: 10, padding: '12px 16px',
                    color: '#CCDADC', fontSize: 14, lineHeight: 1.6,
                  }}
                >
                  "{p}"
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="assistant-chat-wrapper">
          <Chatbot fullPage={true} />
        </div>

        {/* Right sidebar */}
        <div className="assistant-sidebar">
          {/* Capabilities */}
          <div className="assistant-card">
            <h3 style={{ color: '#f5f5f5', fontSize: 17, fontWeight: 700, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={18} style={{ color: '#FDD458' }} /> What I can do
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {CAPABILITIES.map((cap) => (
                <div key={cap.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: `${cap.color}18`,
                    border: `1px solid ${cap.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <cap.icon size={18} style={{ color: cap.color }} />
                  </div>
                  <div>
                    <p style={{ color: '#f5f5f5', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{cap.title}</p>
                    <p style={{ color: '#9095A1', fontSize: 14, lineHeight: 1.6 }}>{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Glassmorphic Depth Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="relative max-w-4xl w-full max-h-[85vh] overflow-y-auto bg-[#141414] border border-[#212328] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 scrollbar-hide-default">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-700/50 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-100">AI Strategic Depth Report</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Mongoose Sync &amp; AI Strategic Audit</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportOpen(false)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-gray-100 transition-all cursor-pointer border-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6">
              {/* 1. Intro Screen */}
              {!depthReport && !isReportLoading && (
                <div className="py-8 flex flex-col items-center text-center space-y-6 max-w-xl mx-auto">
                  <div className="size-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 animate-pulse text-3xl">
                      📊
                  </div>
                  <div>
                      <h4 className="text-lg font-bold text-gray-100">Analyze Real &amp; Virtual Allocations</h4>
                      <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                          This strategic report evaluates double exposure, correlation indices, volatility ratings, and yield actions from your active profile, portfolio, and sandbox data. Powered by high-performance FinNext AI.
                      </p>
                  </div>

                  {reportError && (
                      <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                          <AlertTriangle className="size-4 shrink-0" />
                          <span>{reportError}</span>
                      </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left mt-2">
                      <div className="p-3.5 bg-gray-800/30 border border-gray-700/20 rounded-xl">
                          <div className="text-yellow-500 font-bold mb-1 flex items-center gap-1.5 text-xs">
                              <BarChart2 className="size-3.5" /> Overlaps
                          </div>
                          <p className="text-gray-400 text-[11px] leading-relaxed">Cross-check sector concentrations.</p>
                      </div>
                      <div className="p-3.5 bg-gray-800/30 border border-gray-700/20 rounded-xl">
                          <div className="text-yellow-500 font-bold mb-1 flex items-center gap-1.5 text-xs">
                              <ShieldCheck className="size-3.5" /> Risk Ratings
                          </div>
                          <p className="text-gray-400 text-[11px] leading-relaxed">Assess beta leverage scales.</p>
                      </div>
                      <div className="p-3.5 bg-gray-800/30 border border-gray-700/20 rounded-xl">
                          <div className="text-yellow-500 font-bold mb-1 flex items-center gap-1.5 text-xs">
                              <TrendingUp className="size-3.5" /> Sandbox Tips
                          </div>
                          <p className="text-gray-400 text-[11px] leading-relaxed">Sync virtual strategies to real yields.</p>
                      </div>
                  </div>

                  <button
                      onClick={handleGenerateReport}
                      className="audit-generate-btn h-12 w-full max-w-sm rounded-xl font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 mt-4 hover:scale-[1.01] active:scale-100 transition-all duration-200"
                  >
                      <Sparkles className="size-4 text-gray-900" />
                      Generate Combined Depth Report
                  </button>
                </div>
              )}

              {/* 2. Loading Screen */}
              {isReportLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
                    <div className="relative flex items-center justify-center">
                        <Loader2 className="animate-spin size-12 text-yellow-500" />
                        <span className="absolute text-yellow-500/80 font-bold text-[9px]">AI</span>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-lg font-bold text-gray-100">Running AI Strategic Audit</h4>
                        <p className="text-yellow-500/80 font-semibold text-xs tracking-wider animate-pulse transition-all">
                            {loadingStep === 0 && "🔌 ESTABLISHING SECURE SESSION CONTEXT..."}
                            {loadingStep === 1 && "📂 SYNCING EXTERNAL MONGOOSE HOLDINGS..."}
                            {loadingStep === 2 && "🧪 RETRIEVING SANDBOX VIRTUAL POSITIONS..."}
                            {loadingStep === 3 && "🔮 INVOKING FINNEXT AI COMPILER..."}
                            {loadingStep === 4 && "✍️ COMPILING HIGH-FIDELITY DEPTH REPORT..."}
                        </p>
                        <p className="text-gray-500 text-xs leading-relaxed">Analyzing multi-agent portfolio parameters.</p>
                    </div>
                </div>
              )}

              {/* 3. Report Screen */}
              {depthReport && (
                <div className="space-y-6">
                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-850/60 border border-gray-700/40 rounded-xl">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold px-2.5 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full tracking-wider uppercase">Premium AI Audit</span>
                            <span className="text-gray-400 text-xs">FinNext AI Synthesized</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportPDF}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs font-bold rounded-lg cursor-pointer transition-all hover:scale-[1.02] shadow-md border-none"
                            >
                                <Download className="size-3.5" /> Export PDF
                            </button>
                            <button
                                onClick={handleGenerateReport}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-750 hover:bg-gray-700 text-gray-100 text-xs font-bold rounded-lg cursor-pointer transition-all border border-gray-650"
                            >
                                <RefreshCw className="size-3.5" /> Regenerate
                            </button>
                        </div>
                    </div>

                    {/* Score cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-850/40 border border-gray-700/20 rounded-xl text-center flex flex-col justify-between">
                            <div className="text-gray-400 text-xs font-semibold">Real Portfolio Score</div>
                            <div className="text-3xl font-extrabold my-2 text-green-400">{depthReport.portfolioScore}/100</div>
                            <div className="text-gray-500 text-[10px]">Real asset safety</div>
                        </div>
                        <div className="p-4 bg-gray-850/40 border border-gray-700/20 rounded-xl text-center flex flex-col justify-between">
                            <div className="text-gray-400 text-xs font-semibold">Sandbox Performance Score</div>
                            <div className="text-3xl font-extrabold my-2 text-yellow-500">{depthReport.sandboxScore}/100</div>
                            <div className="text-gray-500 text-[10px]">Virtual activity rating</div>
                        </div>
                        <div className="p-5 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30 rounded-xl text-center flex flex-col justify-between shadow-lg">
                            <div className="text-yellow-500 text-xs font-bold tracking-wider uppercase">Combined Score</div>
                            <div className="text-4xl font-black my-2 text-yellow-400 drop-shadow-md">{depthReport.combinedScore}/100</div>
                            <div className="text-yellow-500/80 text-[10px] font-semibold">Composite strategic rating</div>
                        </div>
                    </div>

                    {/* Risk Assessment block */}
                    <div className="p-5 bg-gray-850/40 border border-gray-700/20 rounded-xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-700/40 pb-3">
                            <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                <ShieldCheck className="size-4 text-yellow-500" />
                                Combined Risk Vulnerability
                            </h4>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-800 border border-gray-700 text-gray-400 rounded-full">
                                    Real: {depthReport.riskAssessment?.portfolioRisk}
                                </span>
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-800 border border-gray-700 text-gray-400 rounded-full">
                                    Sandbox: {depthReport.riskAssessment?.sandboxRisk}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full">
                                    Combined: {depthReport.riskAssessment?.combinedRisk}
                                </span>
                            </div>
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed italic">
                            "{depthReport.riskAssessment?.description}"
                        </p>
                    </div>

                    {/* General metrics comparison table */}
                    <div className="p-5 bg-gray-850/40 border border-gray-700/30 rounded-xl space-y-4">
                        <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                            <FileText className="size-4 text-yellow-500" /> Key Account Metrics
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs py-1 border-b border-gray-800">
                                    <span className="text-gray-400">Real Portfolio Est. Valuation</span>
                                    <span className="font-semibold text-gray-200">
                                        ₹{depthReport.comparison?.portfolioValue?.toLocaleString('en-IN') ?? "0"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs py-1 border-b border-gray-800">
                                    <span className="text-gray-400">Sandbox Virtual Balance</span>
                                    <span className="font-semibold text-gray-200">
                                        ₹{depthReport.comparison?.sandboxValue?.toLocaleString('en-IN') ?? "0"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs py-1">
                                    <span className="text-gray-400">Positions Count (Real vs Sandbox)</span>
                                    <span className="font-semibold text-gray-200">
                                        {depthReport.comparison?.portfolioHoldingsCount} vs {depthReport.comparison?.sandboxHoldingsCount}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-800/20 border border-gray-700/20 rounded-lg flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-bold text-yellow-500/85 tracking-wider">Correlation Note</span>
                                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                                    {depthReport.comparison?.keyDifference}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sector Allocation comparison progress bars */}
                    {depthReport.sectorAllocation && depthReport.sectorAllocation.length > 0 && (
                        <div className="p-5 bg-gray-850/40 border border-gray-700/30 rounded-xl space-y-4">
                            <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                <BarChart2 className="size-4 text-yellow-500" /> Sector Overlaps &amp; Overweights
                            </h4>
                            <div className="space-y-4">
                                {depthReport.sectorAllocation.map((sec: any) => (
                                    <div key={sec.sector} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium text-gray-300">{sec.sector}</span>
                                            <span className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                sec.status === 'OVERWEIGHT' && "bg-red-500/10 text-red-400",
                                                sec.status === 'UNDERWEIGHT' && "bg-blue-500/10 text-blue-400",
                                                sec.status === 'NEUTRAL' && "bg-green-500/10 text-green-400"
                                            )}>
                                                {sec.status}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[10px]">
                                                <span className="w-10 text-gray-500 text-right">Real</span>
                                                <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-yellow-500 h-full rounded-full transition-all duration-500" style={{ width: `${sec.portfolioPercent}%` }} />
                                                </div>
                                                <span className="w-8 font-bold text-gray-400 text-left">{sec.portfolioPercent}%</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px]">
                                                <span className="w-10 text-gray-500 text-right">Virtual</span>
                                                <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-yellow-500/40 h-full rounded-full transition-all duration-500" style={{ width: `${sec.sandboxPercent}%` }} />
                                                </div>
                                                <span className="w-8 font-bold text-gray-400 text-left">{sec.sandboxPercent}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Risks and Opportunities */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Risks */}
                        <div className="p-4 bg-gray-850/40 border border-gray-700/20 rounded-xl space-y-3">
                            <h5 className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                                ⚠️ Concentration &amp; Capital Risks
                            </h5>
                            <div className="space-y-3">
                                {depthReport.topRisks?.map((r: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-gray-200">{r.risk}</span>
                                            <span className="text-[9px] font-bold px-1.5 py-0.25 bg-red-500/10 text-red-400 rounded-full">{r.severity}</span>
                                        </div>
                                        <p className="text-gray-400 text-[11px] leading-relaxed">{r.recommendation}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Opportunities */}
                        <div className="p-4 bg-gray-850/40 border border-gray-700/20 rounded-xl space-y-3">
                            <h5 className="text-xs font-bold text-green-400 flex items-center gap-1.5 uppercase tracking-wider">
                                🚀 Yield &amp; Execution Opportunities
                            </h5>
                            <div className="space-y-3">
                                {depthReport.opportunities?.map((o: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-green-500/5 border border-green-500/10 rounded-lg space-y-1">
                                        <span className="font-bold text-gray-200 text-xs block">{o.opportunity}</span>
                                        <p className="text-gray-400 text-[11px] leading-relaxed">{o.action}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Institutional recommendations list */}
                    {depthReport.recommendations && depthReport.recommendations.length > 0 && (
                        <div className="p-5 bg-gray-850/40 border border-gray-700/20 rounded-xl space-y-3">
                            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Strategic Integration Guide</h4>
                            <ul className="space-y-2">
                                {depthReport.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx} className="text-xs text-gray-400 flex items-start gap-2 leading-relaxed">
                                        <span className="text-yellow-500 shrink-0 mt-0.5">•</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Strategic prompt at the bottom */}
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-center">
                        <p className="text-yellow-500/90 text-xs font-medium">
                            💡 Tip: Close this report to chat directly with your AI Assistant about these findings!
                        </p>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
