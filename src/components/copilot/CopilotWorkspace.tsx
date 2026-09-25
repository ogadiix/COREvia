import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  RotateCcw,
  ShieldCheck,
  User,
  Users,
  ChevronDown,
  X,
  Layers,
  ArrowRight,
  HelpCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { useCopilot, CopilotContextEntity } from '../../context/CopilotContext';
import { CopilotMessageItem } from './CopilotMessageItem';

interface CopilotWorkspaceProps {
  isDrawer?: boolean;
  onClose?: () => void;
  onNavigate?: (path: string) => void;
}

const QUICK_PROMPTS = [
  { label: 'Summarize Rahul Sharma', query: 'Give me a quick overview of Rahul Sharma.' },
  { label: 'Explain CORE Score 84', query: 'Why is the CORE Score 84?' },
  { label: 'What changed recently?', query: 'What changed recently with this relationship?' },
  { label: 'What should I do next?', query: 'What should I do next?' },
  { label: 'Create Follow-up Task', query: 'Create a follow-up for tomorrow at 11 AM.' },
  { label: 'Portfolio Priorities', query: 'What are my three most urgent actions today?' },
];

const PRESET_CUSTOMERS = [
  { id: 1, code: 'CUS-10482', name: 'Rahul Sharma', relationship: '₹42.8L' },
  { id: 6, code: 'CUS-60293', name: 'Priya Mehta', relationship: '₹68.5L' },
  { id: 2, code: 'CUS-20841', name: 'Kalyan Steels & Forgings Ltd', relationship: '₹84.2L' },
  { id: 3, code: 'CUS-30915', name: 'Meera Sundaram', relationship: '₹78.5L' },
  { id: 4, code: 'CUS-40182', name: 'Sunil Varma', relationship: '₹16.5L' },
];

export const CopilotWorkspace: React.FC<CopilotWorkspaceProps> = ({
  isDrawer = false,
  onClose,
  onNavigate,
}) => {
  const {
    currentContext,
    setCopilotContext,
    clearCopilotContext,
    messages,
    sendMessage,
    confirmAction,
    cancelAction,
    resetConversation,
    isLoading,
    loadingStep,
  } = useCopilot();

  const [input, setInput] = useState('');
  const [showContextDropdown, setShowContextDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await sendMessage(text);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectPresetCustomer = (cust: { id: number; code: string; name: string }) => {
    setCopilotContext({
      type: 'CUSTOMER',
      id: cust.id,
      code: cust.code,
      label: `${cust.name} · ${cust.code}`,
    });
    setShowContextDropdown(false);
    // Optionally trigger an immediate contextual query
    sendMessage(`Give me a quick overview of ${cust.name}.`, {
      type: 'CUSTOMER',
      id: cust.id,
      code: cust.code,
      label: `${cust.name} · ${cust.code}`,
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight">
                COREvia Banking Copilot
              </h2>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded border border-emerald-500/30">
                Phase 14
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Authorized CRM Intelligence Assistant · Server-Side Gemini 3.8
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={resetConversation}
            title="Reset conversation thread"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">New Chat</span>
          </button>
          {isDrawer && onClose && (
            <button
              onClick={onClose}
              title="Close drawer (Esc)"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Context Indicator Bar */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs relative flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Active Context:
          </span>

          <div className="relative">
            <button
              onClick={() => setShowContextDropdown((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                currentContext.type === 'CUSTOMER'
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/25'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[200px]">
                {currentContext.label || 'Global Portfolio'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
            </button>

            {/* Context Dropdown */}
            {showContextDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-30 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">
                  Switch Active Entity
                </div>
                <button
                  onClick={() => {
                    clearCopilotContext();
                    setShowContextDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>Global Portfolio (No Entity)</span>
                  {currentContext.type === 'GLOBAL' && <span className="text-emerald-400">✓</span>}
                </button>
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-500 pt-1.5">
                  Customers
                </div>
                {PRESET_CUSTOMERS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectPresetCustomer(c)}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-medium text-slate-200 group-hover:text-white">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-slate-500">{c.code} · {c.relationship}</div>
                    </div>
                    {currentContext.id === c.id && <span className="text-emerald-400">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {currentContext.type !== 'GLOBAL' && (
          <button
            onClick={clearCopilotContext}
            className="text-[11px] text-slate-400 hover:text-slate-300 underline underline-offset-2 flex-shrink-0"
          >
            Clear Context
          </button>
        )}
      </div>

      {/* 3. Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <CopilotMessageItem
            key={msg.id}
            message={msg}
            onConfirmAction={confirmAction}
            onCancelAction={cancelAction}
            onSelectAction={(query) => sendMessage(query)}
            onNavigate={onNavigate}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-[85%] animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-emerald-600/30 flex items-center justify-center text-emerald-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-200">
                {loadingStep || 'Querying Core Banking data...'}
              </div>
              <div className="text-[10px] text-slate-400">
                Executing verified CRM tools under officer authorization
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Prompts Drawer (if fewer than 4 messages) */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800/80 flex-shrink-0">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Suggested Questions
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(qp.query)}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-700 text-slate-300 hover:text-white text-[11px] rounded-lg border border-slate-700/60 transition-colors"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Input Bar */}
      <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex-shrink-0">
        <div className="relative rounded-xl border border-slate-700 bg-slate-950 focus-within:border-emerald-500 transition-colors shadow-inner">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentContext.type === 'CUSTOMER'
                ? `Ask Copilot about ${currentContext.label}... (e.g. "What should I do next?", "Create follow-up")`
                : 'Ask Copilot about customer portfolio, CORE score drivers, service cases, or next actions...'
            }
            className="w-full px-3.5 py-2.5 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-800/60 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Press <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-[10px]">Enter</kbd> to send</span>
              {currentContext.type !== 'GLOBAL' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  <User className="w-2.5 h-2.5" />
                  {currentContext.label}
                </span>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-30 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Send</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
