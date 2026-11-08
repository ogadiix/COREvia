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
} from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext';
import { CopilotMessageItem } from './CopilotMessageItem';
import { Button } from '../common/Button';

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
    sendMessage(`Give me a quick overview of ${cust.name}.`, {
      type: 'CUSTOMER',
      id: cust.id,
      code: cust.code,
      label: `${cust.name} · ${cust.code}`,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8] dark:bg-[#101C2A] text-[#273444] dark:text-[#E8EEF5] overflow-hidden select-none">
      {/* 1. Header Toolbar */}
      <div className="px-4 py-3 bg-white dark:bg-[#162638] border-b border-[#DCE3EA] dark:border-[#33485D] flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-[#168C83] flex items-center justify-center text-white shadow-2xs shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-[#142C45] dark:text-[#E8EEF5] tracking-tight uppercase truncate">
                COREvia Banking Copilot
              </h2>
              <span className="px-1.5 py-0.2 bg-[#168C83]/10 text-[#168C83] dark:text-[#1B9D92] text-[10px] font-mono rounded-xs border border-[#168C83]/20 shrink-0">
                Phase 14 · Grounded
              </span>
            </div>
            <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] truncate">
              Authorized CRM Intelligence Assistant · Server-Side Gemini 3.8
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="xs"
            onClick={resetConversation}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            title="Reset conversation thread"
          >
            <span className="hidden sm:inline">New Chat</span>
          </Button>
          {isDrawer && onClose && (
            <button
              onClick={onClose}
              title="Close drawer (Esc)"
              className="p-1 text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#1C3045] rounded-xs transition-colors cursor-pointer"
              aria-label="Close copilot"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Context Indicator Bar */}
      <div className="px-4 py-2 bg-[#EDF1F5] dark:bg-[#162638] border-b border-[#DCE3EA] dark:border-[#33485D] flex items-center justify-between gap-2 text-xs relative shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Layers className="w-3.5 h-3.5 text-[#168C83]" />
            Active Context:
          </span>

          <div className="relative">
            <button
              onClick={() => setShowContextDropdown((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs font-medium border transition-colors cursor-pointer ${
                currentContext.type === 'CUSTOMER'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                  : 'bg-white dark:bg-[#192B3D] border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#20364B]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#16803C] animate-pulse" />
              <span className="truncate max-w-[200px]">
                {currentContext.label || 'Global Portfolio'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#5D6B7B] dark:text-[#A9BACB] ml-0.5 shrink-0" />
            </button>

            {/* Context Dropdown */}
            {showContextDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-sm shadow-lg z-30 py-1.5 motion-dropdown text-left">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-[#5D6B7B] dark:text-[#A9BACB] border-b border-[#DCE3EA] dark:border-[#26394C]">
                  Switch Active Entity
                </div>
                <button
                  onClick={() => {
                    clearCopilotContext();
                    setShowContextDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-[#273444] dark:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#1C3045] flex items-center justify-between cursor-pointer"
                >
                  <span>Global Portfolio (No Entity)</span>
                  {currentContext.type === 'GLOBAL' && <span className="text-[#16803C] font-bold">✓</span>}
                </button>
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#5D6B7B] dark:text-[#A9BACB] pt-1.5 border-t border-[#DCE3EA] dark:border-[#26394C]">
                  Customers
                </div>
                {PRESET_CUSTOMERS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectPresetCustomer(c)}
                    className="w-full px-3 py-1.5 text-left text-xs text-[#273444] dark:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#1C3045] flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-[#273444] dark:text-[#E8EEF5] group-hover:text-[#168C83] dark:group-hover:text-[#1B9D92]">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">{c.code} · {c.relationship}</div>
                    </div>
                    {currentContext.id === c.id && <span className="text-[#16803C] font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {currentContext.type !== 'GLOBAL' && (
          <button
            onClick={clearCopilotContext}
            className="text-[11px] text-[#168C83] dark:text-[#1B9D92] hover:underline underline-offset-2 shrink-0 cursor-pointer font-medium"
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
          <div className="flex items-center gap-3 p-3.5 bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg shadow-2xs max-w-[85%] motion-fade-in">
            <div className="w-7 h-7 rounded-sm bg-[#168C83]/10 border border-[#168C83]/20 flex items-center justify-center text-[#168C83] shrink-0">
              <Loader2 className="w-4 h-4 animate-spin text-[#168C83]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5]">
                {loadingStep || 'Querying Core Banking data...'}
              </div>
              <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">
                Executing verified CRM tools under officer authorization
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Prompts Drawer (if fewer than 4 messages) */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-white dark:bg-[#162638] border-t border-[#DCE3EA] dark:border-[#33485D] shrink-0">
          <div className="text-[10px] font-bold text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#168C83]" />
            Suggested Questions
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(qp.query)}
                className="px-2.5 py-1 bg-[#F4F6F8] dark:bg-[#192B3D] hover:bg-[#EDF1F5] dark:hover:bg-[#20364B] active:bg-[#DCE3EA] text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#273444] dark:hover:text-[#E8EEF5] text-[11px] rounded-xs border border-[#DCE3EA] dark:border-[#33485D] transition-colors cursor-pointer shadow-2xs"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Input Bar */}
      <div className="p-3 bg-white dark:bg-[#162638] border-t border-[#DCE3EA] dark:border-[#33485D] shrink-0">
        <div className="rounded-sm border border-[#DCE3EA] dark:border-[#33485D] bg-[#F4F6F8] dark:bg-[#101C2A] focus-within:bg-white dark:focus-within:bg-[#162638] focus-within:border-[#168C83] focus-within:ring-1 focus-within:ring-[#168C83] transition-all shadow-2xs">
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
            className="w-full px-3 py-2 bg-transparent text-xs text-[#273444] dark:text-[#E8EEF5] placeholder:text-[#8793A1] dark:placeholder:text-[#8194A8] focus:outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#DCE3EA] dark:border-[#26394C] text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">
                Press <kbd className="px-1 py-0.5 bg-[#EDF1F5] dark:bg-[#192B3D] text-[#5D6B7B] dark:text-[#A9BACB] border border-[#DCE3EA] dark:border-[#33485D] rounded-xs font-mono text-[10px]">Enter</kbd> to send
              </span>
              {currentContext.type !== 'GLOBAL' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-xs border border-blue-200 dark:border-blue-700 font-medium">
                  <User className="w-2.5 h-2.5" />
                  {currentContext.label}
                </span>
              )}
            </div>

            <Button
              variant="brand"
              size="xs"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              loading={isLoading}
              icon={<Send className="w-3 h-3" />}
              iconPosition="right"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
