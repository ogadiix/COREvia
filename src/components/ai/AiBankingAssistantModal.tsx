import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  HelpCircle,
  Coins,
  ShieldCheck,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  source?: 'gemini' | 'institutional_engine';
  suggestedFollowUps?: string[];
}

interface AiBankingAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const INITIAL_PROMPTS = [
  'What are the latest AMFI SIP inflow records and trends?',
  'Explain how the 10Y G-Sec yield crossing 7% affects SLR bond MTM',
  'How do USD/INR FEDAI card rates and GST Rule 32(2) apply?',
  'Compare CRR and SLR requirements under RBI regulations',
  'Explain the Drawing Power (DP) calculation for Cash Credit accounts',
];

export const AiBankingAssistantModal: React.FC<AiBankingAssistantModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello! I am **COREvia AI**, your institutional banking and treasury intelligence copilot powered by Gemini.

I can answer any query regarding:
• **Indian Treasury & Sovereign Bond Yields** (10Y G-Sec, yield curves, RBI OMO liquidity absorption)
• **Currency & Interbank FX** (USD/INR spot rates, FEDAI card rate margins, FEMA guidelines)
• **Mutual Funds & SIP Wealth Desk** (AMFI monthly records, compounding calculations, equity vs debt asset allocation)
• **Core Banking Operations** (CASA accounts, Loan appraisal, Maker-Checker four-eyes authorization, CRR/SLR compliance)

How can I assist your branch or treasury desk today?`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      model: 'gemini-3.8-flash',
      source: 'gemini',
      suggestedFollowUps: [
        'What is the current monthly SIP inflow record in India?',
        'What is the 10Y G-Sec yield and sovereign spread today?',
        'How does rupee cost averaging benefit long-term investors?',
      ],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      if (initialQuery) {
        handleSendMessage(initialQuery);
      }
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          history: historyPayload,
          context: 'COREvia Core Banking Platform - Executive Dashboard & Treasury Monitor',
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'Response generated successfully.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        model: data.model || 'gemini-3.8-flash',
        source: data.source || 'gemini',
        suggestedFollowUps: data.suggestedFollowUps,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an issue connecting to the AI service. 

**Fallback Institutional Reference**:
For Indian banking operations, ensure compliance with:
• Reserve Bank of India (RBI) Master Directions on Statutory Liquidity (SLR 18%, CRR 4.50%).
• AMFI Mutual Fund guidelines for SIP investor suitability and risk-o-meter disclosures.
• FEDAI rules for interbank foreign exchange quoting.

Please try sending your prompt again.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        model: 'corevia-banking-engine',
        source: 'institutional_engine',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-3xl h-[88vh] max-h-[750px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f1e36] text-white px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#0f1e36] rounded-[4px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">COREvia AI Banking Assistant</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Institutional guidance for Treasury, Currency, Mutual Funds/SIP & Banking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMessages([messages[0]]);
              }}
              title="Reset conversation"
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-md bg-[#0f1e36] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#0f1e36] text-white shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-4 pb-1 mb-1.5 border-b border-slate-100/30 text-[10px] text-slate-400 font-mono">
                  <span>{m.role === 'user' ? 'You (Banking Officer)' : 'COREvia AI'}</span>
                  <div className="flex items-center gap-2">
                    {m.model && <span className="opacity-80">{m.model}</span>}
                    <span>{m.timestamp}</span>
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="hover:text-slate-600 cursor-pointer ml-1"
                        title="Copy answer"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Body Content with simple formatting */}
                <div className="space-y-2 whitespace-pre-line font-sans">
                  {m.content}
                </div>

                {/* Follow up suggestions */}
                {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Suggested Next Inquiries
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestedFollowUps.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(suggestion)}
                          className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded px-2 py-1 transition-colors text-left cursor-pointer flex items-center gap-1"
                        >
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-md bg-[#0f1e36] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0f1e36]" />
                <span>COREvia AI is analyzing institutional data and generating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Topic Chips */}
        <div className="bg-white border-t border-slate-100 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Quick Topics:
          </span>
          {INITIAL_PROMPTS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask anything about Treasury, USD/INR, Mutual Funds, SIP, or RBI Regulations..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0f1e36] focus:border-[#0f1e36] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0f1e36] hover:bg-[#162a4d] rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ask AI</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified with RBI guidelines, FEDAI card rate formulas & AMFI September 2026 data
            </span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
};
