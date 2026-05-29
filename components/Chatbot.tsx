'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, X, ChevronUp } from 'lucide-react';
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
  'Show me tech stocks',
  'Based on my risk profile, what should I buy?',
  'What is my sandbox balance?',
  'Recommend a stock for my sandbox',
];

export function Chatbot({ portfolioTickers = [], onDashboardAction, fullPage = false }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your AI assistant powered by NVIDIA Nemotron. I have full context of your portfolio, profile, and sandbox. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message, action: data.dashboardAction },
      ]);
      if (data.dashboardAction && data.dashboardAction.action !== 'NONE' && data.dashboardAction.action !== 'SANDBOX_TRADE') {
        onDashboardAction?.(data.dashboardAction);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }]);
    }
    setIsLoading(false);
  };

  const actionLabel = (action: DashboardAction) => action.action.replace(/_/g, ' ');

  return (
    <div className="chatbot-container" style={{ 
      minHeight: minimized ? 'auto' : (fullPage ? 600 : 480),
      height: fullPage ? '100%' : 'auto',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div className="chatbot-header">
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: '#FDD458',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Bot size={15} style={{ color: '#050505' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#CCDADC', fontWeight: 700, fontSize: 13 }}>AI Assistant</div>
          <div style={{ color: '#9095A1', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={9} style={{ color: '#FDD458' }} />
            NVIDIA Nemotron · RAG Context Aware
          </div>
        </div>
        {!fullPage && (
          <button
            onClick={() => setMinimized((v) => !v)}
            style={{ background: 'none', border: 'none', color: '#9095A1', cursor: 'pointer', padding: 4 }}
          >
            {minimized ? <ChevronUp size={15} /> : <X size={15} />}
          </button>
        )}
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="chatbot-messages" style={{ flex: 1 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                  padding: '9px 13px',
                  fontSize: 13,
                  lineHeight: 1.55,
                  background: msg.role === 'user' ? '#FDD458' : '#212328',
                  color: msg.role === 'user' ? '#050505' : '#CCDADC',
                  border: msg.role === 'assistant' ? '1px solid #30333A' : 'none',
                  fontWeight: msg.role === 'user' ? 600 : 400,
                }}>
                  {msg.content}
                  {msg.action && msg.action.action !== 'NONE' && (
                    <div style={{ marginTop: 10 }}>
                      {msg.action.action === 'SANDBOX_TRADE' ? (
                        <SandboxTradeButton 
                          ticker={msg.action.payload.ticker} 
                          currentPrice={0}
                          suggestedAction={msg.action.payload.action}
                          suggestedQuantity={msg.action.payload.quantity}
                        />
                      ) : msg.action.action === 'RECOMMEND_STOCKS' ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {msg.action.payload.map((ticker) => (
                            <Link
                              key={ticker}
                              href={`/stocks/${ticker}`}
                              style={{
                                padding: '4px 10px', borderRadius: 6, background: '#212328',
                                border: '1px solid rgba(253,212,88,0.5)', color: '#FDD458',
                                fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              📈 {ticker}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          padding: '3px 8px', borderRadius: 5, background: 'rgba(253,212,88,0.1)',
                          border: '1px solid rgba(253,212,88,0.25)', color: '#FDD458',
                          fontSize: 10, fontWeight: 700, display: 'inline-block'
                        }}>
                          ⚡ {actionLabel(msg.action)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 16px', borderRadius: 14, fontSize: 13,
                  background: 'rgba(30, 41, 59, 0.8)', color: '#64748b',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}>
                  <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          <div style={{ padding: '6px 12px 8px', display: 'flex', gap: 5, flexWrap: 'wrap', borderTop: '1px solid #212328' }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                style={{
                  padding: '3px 9px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
                  background: '#212328', border: '1px solid #30333A',
                  color: '#9095A1', fontWeight: 500, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#FDD458'; (e.target as HTMLElement).style.color = '#FDD458'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#30333A'; (e.target as HTMLElement).style.color = '#9095A1'; }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="chatbot-input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask anything about your finances..."
              className="chatbot-input"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="chatbot-send-btn"
            >
              <Send size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
