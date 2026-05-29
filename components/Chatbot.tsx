'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, X, ChevronUp, TrendingUp, HelpCircle, FlaskConical, BarChart2 } from 'lucide-react';
import type { DashboardAction, ChatResponse } from '@/types/chatActions';
import { SandboxTradeButton } from './sandbox/SandboxTradeButton';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: DashboardAction;
}

interface ChatbotProps {
  portfolioTickers?: string[];
  onDashboardAction?: (action: DashboardAction) => void;
  fullPage?: boolean;
}

const SUGGESTIONS = [
  { icon: TrendingUp, label: 'Recommend stocks for me' },
  { icon: HelpCircle, label: 'Based on my risk profile, what should I buy?' },
  { icon: FlaskConical, label: 'What is my sandbox balance?' },
  { icon: BarChart2, label: 'Analyze my portfolio risk' },
];

/** Render line breaks in message text */
function MessageText({ text }: { text: string }) {
  const lines = text.split('\n').filter(Boolean);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {lines.map((line, i) => (
        <p key={i} style={{ margin: 0, lineHeight: 1.65 }}>{line}</p>
      ))}
    </div>
  );
}

export function Chatbot({ portfolioTickers = [], onDashboardAction, fullPage = false }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your personal AI financial assistant. I have full context of your portfolio, risk profile, and sandbox. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const userMsg = (text ?? input).trim();
    if (!userMsg || isLoading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data: ChatResponse = await res.json();

      // Sanitise the message — strip any residual JSON leakage
      let cleanMessage = data.message ?? '⚠️ I could not generate a response. Please try again.';
      // If the response looks like raw JSON, strip it
      if (cleanMessage.trim().startsWith('{') || cleanMessage.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(cleanMessage);
          cleanMessage = parsed.message ?? cleanMessage;
        } catch {
          cleanMessage = 'Something went wrong parsing the response. Please try again.';
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: cleanMessage, action: data.dashboardAction },
      ]);
      if (data.dashboardAction && data.dashboardAction.action !== 'NONE' && data.dashboardAction.action !== 'SANDBOX_TRADE') {
        onDashboardAction?.(data.dashboardAction);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }]);
    }
    setIsLoading(false);
  };

  return (
    <div
      className="chatbot-container"
      style={{
        minHeight: minimized ? 'auto' : (fullPage ? 720 : 580),
        height: fullPage ? '100%' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div className="chatbot-header">
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #3B82F6, #f5a623)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 0 16px rgba(59,130,246,0.4)',
        }}>
          <Bot size={20} style={{ color: '#050505' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f5f5f5', fontWeight: 700, fontSize: 15 }}>FinNext Assistant</div>
          <div style={{ color: '#9095A1', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#0FEDBE',
              display: 'inline-block',
              boxShadow: '0 0 6px #0FEDBE',
            }} />
            Online · Personalised to your profile
          </div>
        </div>
        {!fullPage && (
          <button
            onClick={() => setMinimized((v) => !v)}
            style={{ background: 'none', border: 'none', color: '#9095A1', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f5f5f5')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9095A1')}
          >
            {minimized ? <ChevronUp size={16} /> : <X size={16} />}
          </button>
        )}
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="chatbot-messages" style={{ flex: 1 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
                {/* Avatar row for assistant */}
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 7,
                      background: 'linear-gradient(135deg, #3B82F6, #f5a623)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Bot size={14} style={{ color: '#050505' }} />
                    </div>
                    <span style={{ color: '#9095A1', fontSize: 12, fontWeight: 600 }}>FinNext AI</span>
                  </div>
                )}

                <div style={{
                  maxWidth: '86%',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  padding: '13px 18px',
                  fontSize: 15,
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #3B82F6, #f5a623)'
                    : '#1A1D22',
                  color: msg.role === 'user' ? '#050505' : '#CCDADC',
                  border: msg.role === 'assistant' ? '1px solid #2A2D35' : 'none',
                  fontWeight: msg.role === 'user' ? 600 : 400,
                  lineHeight: 1.7,
                  boxShadow: msg.role === 'user'
                    ? '0 2px 12px rgba(59,130,246,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                  <MessageText text={msg.content} />

                  {/* Action pills */}
                  {msg.action && msg.action.action !== 'NONE' && (
                    <div style={{ marginTop: 12 }}>
                      {msg.action.action === 'SANDBOX_TRADE' ? (
                        <SandboxTradeButton
                          ticker={msg.action.payload.ticker}
                          suggestedAction={msg.action.payload.action}
                          suggestedQuantity={msg.action.payload.quantity}
                          companyName={msg.action.payload.ticker}
                        />
                      ) : msg.action.action === 'RECOMMEND_STOCKS' ? (
                        <div>
                          <p style={{ fontSize: 12, color: '#9095A1', marginBottom: 8, fontWeight: 700, letterSpacing: '0.04em' }}>RECOMMENDED STOCKS</p>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {msg.action.payload.map((ticker: string) => (
                              <Link
                                key={ticker}
                                href={`/stocks/${ticker}`}
                                style={{
                                  padding: '7px 14px', borderRadius: 10,
                                  background: 'rgba(59,130,246,0.1)',
                                  border: '1px solid rgba(59,130,246,0.4)',
                                  color: '#3B82F6',
                                  fontSize: 14, fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  transition: 'background 0.15s',
                                }}
                              >
                                <TrendingUp size={13} /> {ticker}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          padding: '5px 12px', borderRadius: 8,
                          background: 'rgba(15,237,190,0.1)',
                          border: '1px solid rgba(15,237,190,0.25)',
                          color: '#0FEDBE',
                          fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}>
                          <Sparkles size={10} /> {msg.action.action.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: 'linear-gradient(135deg, #3B82F6, #f5a623)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Bot size={14} style={{ color: '#050505' }} />
                  </div>
                  <span style={{ color: '#9095A1', fontSize: 12, fontWeight: 600 }}>FinNext AI</span>
                </div>
                <div style={{
                  padding: '14px 20px', borderRadius: '4px 18px 18px 18px',
                  background: '#1A1D22', border: '1px solid #2A2D35',
                  display: 'flex', gap: 6, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(d => (
                    <span key={d} style={{
                      width: 9, height: 9, borderRadius: '50%', background: '#3B82F6',
                      display: 'inline-block',
                      animation: `bounce 1.2s ease-in-out ${d * 0.18}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          <div style={{ padding: '10px 18px 12px', display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #212328' }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => sendMessage(s.label)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                  padding: '6px 13px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  background: '#1A1D22', border: '1px solid #2A2D35',
                  color: '#9095A1', fontWeight: 500, transition: 'all 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#3B82F6';
                  e.currentTarget.style.color = '#3B82F6';
                  e.currentTarget.style.background = 'rgba(59,130,246,0.07)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#2A2D35';
                  e.currentTarget.style.color = '#9095A1';
                  e.currentTarget.style.background = '#1A1D22';
                }}
              >
                <s.icon size={12} style={{ marginTop: 3, flexShrink: 0 }} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="chatbot-input-row">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything about your finances..."
              className="chatbot-input"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="chatbot-send-btn"
            >
              <Send size={19} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
