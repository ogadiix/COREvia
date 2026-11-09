import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  RotateCcw,
  User,
  ChevronDown,
  X,
  Layers,
  Loader2,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  FileText,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  Network,
  Clock,
  Activity,
  Calendar,
} from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext';
import { CopilotMessageItem } from './CopilotMessageItem';
import { Button } from '../common/Button';

interface CopilotWorkspaceProps {
  isDrawer?: boolean;
  onClose?: () => void;
  onNavigate?: (path: string) => void;
}

interface BankingPromptCategory {
  category: string;
  prompts: { label: string; query: string; icon: string }[];
}

const BANKING_PROMPT_CATEGORIES: BankingPromptCategory[] = [
  {
    category: 'Relationship 360 & Health',
    prompts: [
      { label: 'Executive Briefing', query: 'Give me a comprehensive executive briefing on Rahul Sharma.', icon: '📊' },
      { label: 'Explain CORE Score 84', query: 'Why is the CORE Score 84? Explain score drivers and momentum.', icon: '⚡' },
      { label: 'What Changed Recently?', query: 'What changed recently with this relationship?', icon: '🕒' },
    ],
  },
  {
    category: 'Next Best Action & Strategy',
    prompts: [
      { label: 'Priority Next Action', query: 'What is the most urgent Next Best Action for this customer?', icon: '🎯' },
      { label: 'Coverage & Cross-Sell Gaps', query: 'What product gaps and relationship expansion opportunities exist?', icon: '💼' },
      { label: 'Simulate Wealth Allocation', query: 'Simulate adding a wealth management product to this portfolio.', icon: '🧪' },
    ],
  },
  {
    category: 'Operations & Follow-ups',
    prompts: [
      { label: 'Create Follow-up Task', query: 'Create a follow-up task for tomorrow at 11 AM regarding portfolio review.', icon: '📝' },
      { label: 'Check SLA & Cases', query: 'Check pending service tickets, grievance pressures, and SLA risks.', icon: '⚠️' },
      { label: 'Deposit & Loan Summary', query: 'Summarize all deposit balances, CASA velocity, and active loan facilities.', icon: '₹' },
    ],
  },
];

const PRESET_CUSTOMERS = [
  {
    id: 1,
    code: 'CUS-10482',
    name: 'Rahul Sharma',
    relationship: '₹42.80L',
    segment: 'Premier Private Banking',
    score: 84,
    scoreBand: 'EXCELLENT',
    cases: '1 Warning (SLA 4h)',
    kyc: 'VERIFIED',
  },
  {
    id: 6,
    code: 'CUS-60293',
    name: 'Priya Mehta',
    relationship: '₹68.50L',
    segment: 'Corporate & SME',
    score: 79,
    scoreBand: 'STRONG',
    cases: '0 Active',
    kyc: 'VERIFIED',
  },
  {
    id: 2,
    code: 'CUS-20841',
    name: 'Kalyan Steels & Forgings Ltd',
    relationship: '₹84.20L',
    segment: 'Mid-Market Commercial',
    score: 76,
    scoreBand: 'STRONG',
    cases: '2 Active',
    kyc: 'VERIFIED',
  },
  {
    id: 3,
    code: 'CUS-30915',
    name: 'Meera Sundaram',
    relationship: '₹78.50L',
    segment: 'Wealth Management',
    score: 82,
    scoreBand: 'EXCELLENT',
    cases: '0 Active',
    kyc: 'VERIFIED',
  },
  {
    id: 4,
    code: 'CUS-40182',
    name: 'Sunil Varma',
    relationship: '₹16.50L',
    segment: 'Retail Banking',
    score: 61,
    scoreBand: 'MODERATE',
    cases: '1 Escalated',
    kyc: 'PENDING_RENEWAL',
  },
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
  const [selectedPromptCategory, setSelectedPromptCategory] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active customer helper
  const activeCustomer = PRESET_CUSTOMERS.find(
    (c) => c.id === currentContext.id || c.code === currentContext.code
  ) || (currentContext.type === 'CUSTOMER' ? PRESET_CUSTOMERS[0] : null);

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

  const handleSelectPresetCustomer = (cust: typeof PRESET_CUSTOMERS[0]) => {
    setCopilotContext({
      type: 'CUSTOMER',
      id: cust.id,
      code: cust.code,
      label: `${cust.name} · ${cust.code}`,
      metadata: {
        segment: cust.segment,
        relationship: cust.relationship,
        score: cust.score,
      },
    });
    setShowContextDropdown(false);
    sendMessage(`Give me a comprehensive executive briefing on ${cust.name}.`, {
      type: 'CUSTOMER',
      id: cust.id,
      code: cust.code,
      label: `${cust.name} · ${cust.code}`,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8] dark:bg-[#0A121E] text-[#142C45] dark:text-[#E8EEF5] overflow-hidden select-none">
      {/* 1. Header Toolbar */}
      <div className="px-4 py-3 bg-[#FFFFFF] dark:bg-[#162638] border-b border-[#DCE3EA] dark:border-[#33485D] flex items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#168C83] flex items-center justify-center text-white shadow-xs shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5] tracking-tight truncate">
                COREvia Banking Copilot
              </h2>
              <span className="px-2 py-0.5 bg-[#168C83]/10 text-[#168C83] dark:text-[#46C3B2] text-[10px] font-mono rounded font-semibold border border-[#168C83]/30 shrink-0">
                Institutional v14
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-2.5 h-2.5" />
                Grounded
              </span>
            </div>
            <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] truncate">
              Server-Side Gemini 3.8 · Parameterized Banking Tools · Dual-Control Guardrails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="xs"
            onClick={resetConversation}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            title="Reset conversation thread"
          >
            <span className="hidden sm:inline">New Session</span>
          </Button>
          {isDrawer && onClose && (
            <button
              onClick={onClose}
              title="Close assistant (Esc)"
              className="p-1.5 text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247] rounded-lg transition-colors cursor-pointer"
              aria-label="Close copilot"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Contextual Customer Strip or Portfolio Bar */}
      <div className="px-4 py-2.5 bg-[#F8FAFC] dark:bg-[#101C2A] border-b border-[#DCE3EA] dark:border-[#33485D] shrink-0 text-xs shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Active Context Selector */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Layers className="w-3.5 h-3.5 text-[#168C83] dark:text-[#46C3B2]" />
              Context:
            </span>

            <div className="relative">
              <button
                onClick={() => setShowContextDropdown((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer shadow-2xs ${
                  currentContext.type === 'CUSTOMER'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 hover:bg-blue-100'
                    : 'bg-[#FFFFFF] dark:bg-[#162638] border-[#DCE3EA] dark:border-[#33485D] text-[#142C45] dark:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[200px]">
                  {currentContext.label || 'Global Portfolio'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#5D6B7B] dark:text-[#A9BACB] ml-0.5 shrink-0" />
              </button>

              {/* Context Dropdown */}
              {showContextDropdown && (
                <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl shadow-xl z-40 py-2 motion-dropdown text-left">
                  <div className="px-3.5 py-1 text-[10px] uppercase tracking-wider font-bold text-[#5D6B7B] dark:text-[#A9BACB]">
                    Active Context Boundary
                  </div>
                  <button
                    onClick={() => {
                      clearCopilotContext();
                      setShowContextDropdown(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-[#142C45] dark:text-[#E8EEF5] hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247] flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold">Global Portfolio</div>
                      <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Authorized relationship slice (24 relationships)</div>
                    </div>
                    {currentContext.type === 'GLOBAL' && <span className="text-[#168C83] dark:text-[#46C3B2] font-bold">✓</span>}
                  </button>

                  <div className="px-3.5 py-1 text-[10px] uppercase font-bold text-[#5D6B7B] dark:text-[#A9BACB] pt-2 border-t border-[#DCE3EA] dark:border-[#26394C]">
                    Customer Relationships
                  </div>
                  {PRESET_CUSTOMERS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectPresetCustomer(c)}
                      className="w-full px-3.5 py-2 text-left text-xs hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247] flex items-center justify-between group cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5] group-hover:text-[#168C83] dark:group-hover:text-[#46C3B2]">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">
                          {c.code} · {c.relationship} · CORE {c.score}
                        </div>
                      </div>
                      {currentContext.id === c.id && <span className="text-[#168C83] dark:text-[#46C3B2] font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contextual Telemetry & Direct Actions */}
          {activeCustomer ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                CORE {activeCustomer.score} ({activeCustomer.scoreBand})
              </span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#EDF1F5] dark:bg-[#1E3247] text-[#142C45] dark:text-[#E8EEF5] border border-[#DCE3EA] dark:border-[#33485D]">
                Value: {activeCustomer.relationship}
              </span>
              <div className="flex items-center gap-1">
                {onNavigate && (
                  <button
                    onClick={() => onNavigate(`/customers`)}
                    className="px-2 py-0.5 text-[11px] text-[#168C83] dark:text-[#46C3B2] hover:bg-[#168C83]/10 rounded border border-[#168C83]/20 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Open Customer 360"
                  >
                    <span>360</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
                {onNavigate && (
                  <button
                    onClick={() => onNavigate(`/relationship-twin`)}
                    className="px-2 py-0.5 text-[11px] text-[#168C83] dark:text-[#46C3B2] hover:bg-[#168C83]/10 rounded border border-[#168C83]/20 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Open Relationship Digital Twin"
                  >
                    <span>Twin</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
                {onNavigate && (
                  <button
                    onClick={() => onNavigate(`/relationship-graph`)}
                    className="px-2 py-0.5 text-[11px] text-[#168C83] dark:text-[#46C3B2] hover:bg-[#168C83]/10 rounded border border-[#168C83]/20 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Open Relationship Graph"
                  >
                    <span>Graph</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
                <button
                  onClick={clearCopilotContext}
                  className="px-2 py-0.5 text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#168C83] dark:text-[#46C3B2]" />
                RM Deepak Nambiar
              </span>
              <span>•</span>
              <span>24 Relationships</span>
              <span>•</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-mono">Avg CORE: 78.4</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Messages Stream */}
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
          <div className="flex items-center gap-3 p-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl shadow-xs max-w-[85%] motion-fade-in">
            <div className="w-8 h-8 rounded-lg bg-[#168C83]/10 border border-[#168C83]/20 flex items-center justify-center text-[#168C83] shrink-0">
              <Loader2 className="w-4 h-4 animate-spin text-[#168C83] dark:text-[#46C3B2]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5]">
                {loadingStep || 'Querying Core Banking PostgreSQL records...'}
              </div>
              <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">
                Executing verified CRM tools under officer authorization · Zero direct DB access
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Categorized Suggested Banking Prompts Dock */}
      {messages.length <= 3 && (
        <div className="px-4 py-3 bg-[#FFFFFF] dark:bg-[#162638] border-t border-[#DCE3EA] dark:border-[#33485D] shrink-0 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="text-[10px] font-bold text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#168C83] dark:text-[#46C3B2]" />
              <span>Suggested Institutional Prompts</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {BANKING_PROMPT_CATEGORIES.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPromptCategory(idx)}
                  className={`px-2 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                    selectedPromptCategory === idx
                      ? 'bg-[#168C83] text-white font-semibold'
                      : 'text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] bg-[#F8FAFC] dark:bg-[#101C2A]'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {BANKING_PROMPT_CATEGORIES[selectedPromptCategory].prompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(qp.query)}
                className="px-3 py-1.5 bg-[#F8FAFC] dark:bg-[#101C2A] hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247] active:bg-[#DCE3EA] text-[#142C45] dark:text-[#E8EEF5] text-[11px] rounded-lg border border-[#DCE3EA] dark:border-[#33485D] transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 group"
              >
                <span>{qp.icon}</span>
                <span className="font-medium group-hover:text-[#168C83] dark:group-hover:text-[#46C3B2]">
                  {qp.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Input Dock */}
      <div className="p-3.5 bg-[#FFFFFF] dark:bg-[#162638] border-t border-[#DCE3EA] dark:border-[#33485D] shrink-0">
        <div className="rounded-xl border border-[#DCE3EA] dark:border-[#33485D] bg-[#F8FAFC] dark:bg-[#101C2A] focus-within:bg-[#FFFFFF] dark:focus-within:bg-[#162638] focus-within:border-[#168C83] focus-within:ring-1 focus-within:ring-[#168C83] transition-all shadow-xs">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentContext.type === 'CUSTOMER'
                ? `Ask Copilot about ${currentContext.label}... (e.g. "Explain CORE score drivers", "Create follow-up task", "What changed?")`
                : 'Ask Copilot about customer portfolio, risk signals, Next Best Actions, or create tasks...'
            }
            className="w-full px-3.5 py-2.5 bg-transparent text-xs text-[#142C45] dark:text-[#E8EEF5] placeholder:text-[#8194A8] dark:placeholder:text-[#64748B] focus:outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between px-3.5 py-2 border-t border-[#DCE3EA] dark:border-[#26394C] text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">
            <div className="flex items-center gap-2.5">
              <span className="hidden sm:inline">
                Press <kbd className="px-1.5 py-0.5 bg-[#EDF1F5] dark:bg-[#1E3247] text-[#142C45] dark:text-[#E8EEF5] border border-[#DCE3EA] dark:border-[#33485D] rounded font-mono text-[10px]">Enter</kbd> to send
              </span>
              <span className="hidden md:inline text-[#8194A8] dark:text-[#64748B]">•</span>
              <span className="hidden md:inline text-[10px] text-[#8194A8] dark:text-[#64748B]">
                2-Step Mutation Approval Required
              </span>
            </div>

            <Button
              variant="brand"
              size="xs"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              loading={isLoading}
              icon={<Send className="w-3.5 h-3.5" />}
              iconPosition="right"
              className="font-semibold"
            >
              Send Inquiry
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
