'use client';

import { Chatbot } from '@/components/Chatbot';
import { Bot, Sparkles, Lightbulb, Target } from 'lucide-react';

export default function AssistantPage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(253,212,88,0.15), rgba(253,212,88,0.05))',
          border: '1px solid rgba(253,212,88,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Bot size={24} style={{ color: '#FDD458' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f5f5f5', marginBottom: 4 }}>
            AI Assistant
          </h1>
          <p style={{ color: '#9095A1', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} style={{ color: '#FDD458' }} />
            Powered by NVIDIA Nemotron — RAG Context Aware
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* Instructions Sidebar */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', background: '#141414', border: '1px solid #212328', borderRadius: 16, padding: '24px' }}>
                <h3 style={{ color: '#f5f5f5', fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Lightbulb size={18} style={{ color: '#FDD458' }} /> How to use the AI
                </h3>
                <p style={{ color: '#9095A1', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                    The AI Assistant is fully aware of your Profile, real Portfolio, and Sandbox positions. Try asking it to analyze your data or recommend trades based on your specific risk tolerance!
                </p>

                <h4 style={{ color: '#CCDADC', fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Example Prompts</h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                    {[
                        'Analyze my real portfolio risk.',
                        'Based on my goals, what should I paper trade?',
                        'Recommend a tech stock for my sandbox.',
                        'What is my current sandbox balance?',
                    ].map((prompt, i) => (
                        <li key={i} style={{ 
                            background: '#0A0A0A', border: '1px solid #30333A', 
                            padding: '10px 14px', borderRadius: 8, color: '#CCDADC', fontSize: 13 
                        }}>
                            "{prompt}"
                        </li>
                    ))}
                </ul>
            </div>

            {/* Chatbot Area */}
            <div style={{ flex: '2 1 500px', minHeight: 600 }}>
                <Chatbot fullPage={true} />
            </div>
        </div>
      </div>
    </main>
  );
}
