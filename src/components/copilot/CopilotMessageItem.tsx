import React, { useState } from 'react';
import {
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Terminal,
  Database,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { CopilotMessage } from '../../context/CopilotContext';
import { CopilotActionCard } from './CopilotActionCard';

interface CopilotMessageItemProps {
  message: CopilotMessage;
  onConfirmAction: (actionId: string, messageId: string) => Promise<void>;
  onCancelAction: (actionId: string, messageId: string) => Promise<void>;
  onSelectAction: (query: string) => void;
  onNavigate?: (path: string) => void;
}

export const CopilotMessageItem: React.FC<CopilotMessageItemProps> = ({
  message,
  onConfirmAction,
  onCancelAction,
  onSelectAction,
  onNavigate,
}) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const [showTools, setShowTools] = useState(false);

  // Parse inline styling for bold, code, and financial numbers
  const parseInlineStyles = (text: string, userMsg: boolean) => {
    const parts = text.split(/(\*\*.*?\*\*|\`.*?\`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className={`font-semibold ${userMsg ? 'text-white' : 'text-[#142C45] dark:text-[#E8EEF5]'}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className={`px-1.5 py-0.5 font-mono text-[11px] rounded border ${
              userMsg
                ? 'bg-white/20 text-white border-white/30'
                : 'bg-[#EDF1F5] dark:bg-[#101C2A] text-[#168C83] dark:text-[#46C3B2] border-[#DCE3EA] dark:border-[#33485D]'
            }`}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // Structured rendering that clearly distinguishes CRM Facts vs AI Synthesis vs Recommendations
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className={`space-y-2 text-xs leading-relaxed ${isUser ? 'text-white' : 'text-[#142C45] dark:text-[#E8EEF5]'}`}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Distinct Classification: FACT / MASTER CRM RECORD
          if (trimmed.startsWith('• **FACT:**') || trimmed.startsWith('FACT:') || trimmed.startsWith('### Verified CRM Facts') || trimmed.startsWith('**FACT:**')) {
            const text = trimmed.replace(/^•?\s*\*{0,2}FACT:\*{0,2}\s*/i, '').replace(/^###\s*/, '');
            return (
              <div
                key={idx}
                className="my-1.5 p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 text-blue-950 dark:text-blue-100 flex items-start gap-2 text-xs shadow-2xs"
              >
                <div className="p-1 rounded bg-blue-600/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                    <span>Verified Master Record</span>
                    <span className="text-[9px] px-1 py-0.2 bg-blue-100 dark:bg-blue-900/50 rounded text-blue-700 dark:text-blue-300 font-mono">CRM GROUNDED</span>
                  </div>
                  <div>{parseInlineStyles(text, false)}</div>
                </div>
              </div>
            );
          }

          // Distinct Classification: INTERPRETATION / AI SYNTHESIS
          if (trimmed.startsWith('• **INTERPRETATION:**') || trimmed.startsWith('INTERPRETATION:') || trimmed.startsWith('**INTERPRETATION:**')) {
            const text = trimmed.replace(/^•?\s*\*{0,2}INTERPRETATION:\*{0,2}\s*/i, '');
            return (
              <div
                key={idx}
                className="my-1.5 p-2.5 rounded-lg bg-emerald-50/70 dark:bg-[#168C83]/10 border border-[#168C83]/20 dark:border-[#168C83]/30 text-[#142C45] dark:text-emerald-100 flex items-start gap-2 text-xs shadow-2xs"
              >
                <div className="p-1 rounded bg-[#168C83]/10 dark:bg-[#168C83]/20 text-[#168C83] dark:text-[#46C3B2] shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-[#168C83] dark:text-[#46C3B2] uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                    <span>Analytical Synthesis</span>
                    <span className="text-[9px] px-1 py-0.2 bg-[#168C83]/10 rounded text-[#168C83] dark:text-[#46C3B2] font-mono">SERVER GEMINI</span>
                  </div>
                  <div>{parseInlineStyles(text, false)}</div>
                </div>
              </div>
            );
          }

          // Distinct Classification: RECOMMENDATION / DETERMINISTIC NBA
          if (trimmed.startsWith('• **RECOMMENDATION:**') || trimmed.startsWith('RECOMMENDATION:') || trimmed.startsWith('**RECOMMENDATION:**')) {
            const text = trimmed.replace(/^•?\s*\*{0,2}RECOMMENDATION:\*{0,2}\s*/i, '');
            return (
              <div
                key={idx}
                className="my-1.5 p-2.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/40 text-purple-950 dark:text-purple-100 flex items-start gap-2 text-xs shadow-2xs"
              >
                <div className="p-1 rounded bg-purple-600/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 shrink-0 mt-0.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
                    <span>Next Best Action Proposal</span>
                    <span className="text-[9px] px-1 py-0.2 bg-purple-100 dark:bg-purple-900/50 rounded text-purple-700 dark:text-purple-300 font-mono">RULE DETERMINISTIC</span>
                  </div>
                  <div>{parseInlineStyles(text, false)}</div>
                </div>
              </div>
            );
          }

          // Distinct Classification: EVIDENCE
          if (trimmed.startsWith('• **EVIDENCE:**') || trimmed.startsWith('EVIDENCE:') || trimmed.startsWith('**EVIDENCE:**')) {
            const text = trimmed.replace(/^•?\s*\*{0,2}EVIDENCE:\*{0,2}\s*/i, '');
            return (
              <div
                key={idx}
                className="my-1.5 p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] text-[#142C45] dark:text-[#E8EEF5] flex items-start gap-2 text-xs shadow-2xs"
              >
                <div className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                    Audit Evidence Trail
                  </div>
                  <div>{parseInlineStyles(text, false)}</div>
                </div>
              </div>
            );
          }

          // Distinct Classification: LIMITATION
          if (trimmed.startsWith('• **LIMITATION:**') || trimmed.startsWith('LIMITATION:') || trimmed.startsWith('**LIMITATION:**')) {
            const text = trimmed.replace(/^•?\s*\*{0,2}LIMITATION:\*{0,2}\s*/i, '');
            return (
              <div
                key={idx}
                className="my-1.5 p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-amber-950 dark:text-amber-100 flex items-start gap-2 text-xs shadow-2xs"
              >
                <div className="p-1 rounded bg-amber-600/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-0.5">
                    Human Review Limitation
                  </div>
                  <div>{parseInlineStyles(text, false)}</div>
                </div>
              </div>
            );
          }

          // Headings
          if (trimmed.startsWith('### ')) {
            return (
              <h4
                key={idx}
                className={`text-xs font-bold uppercase tracking-wider pt-2 pb-0.5 ${
                  isUser ? 'text-white/90' : 'text-[#168C83] dark:text-[#46C3B2]'
                }`}
              >
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          if (trimmed.startsWith('## ')) {
            return (
              <h3
                key={idx}
                className={`text-sm font-bold pt-2.5 pb-1 ${
                  isUser ? 'text-white' : 'text-[#142C45] dark:text-[#E8EEF5]'
                }`}
              >
                {trimmed.replace('## ', '')}
              </h3>
            );
          }

          // List item
          if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.replace(/^[•\-\*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-0.5">
                <span className={`font-bold mt-0.5 shrink-0 ${isUser ? 'text-white/80' : 'text-[#168C83] dark:text-[#46C3B2]'}`}>•</span>
                <div className="flex-1">{parseInlineStyles(itemText, isUser)}</div>
              </div>
            );
          }

          // Horizontal rule
          if (trimmed === '---') {
            return <hr key={idx} className={`my-2.5 ${isUser ? 'border-white/20' : 'border-[#DCE3EA] dark:border-[#33485D]'}`} />;
          }

          return <p key={idx}>{parseInlineStyles(line, isUser)}</p>;
        })}
      </div>
    );
  };

  const getSourceBadgeColor = (type: string) => {
    switch (type) {
      case 'CUSTOMER':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100';
      case 'CORE_SCORE':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100';
      case 'INTELLIGENCE':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 hover:bg-purple-100';
      case 'NBA':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100';
      case 'OPPORTUNITY':
        return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100';
      case 'CASE':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100';
      case 'TASK':
        return 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60 hover:bg-cyan-100';
      default:
        return 'bg-[#EDF1F5] dark:bg-[#1E3247] text-[#2D3F54] dark:text-[#CBD5E1] border-[#DCE3EA] dark:border-[#33485D] hover:bg-[#DCE3EA]';
    }
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} motion-fade-in`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs shadow-xs ${
          isUser
            ? 'bg-[#168C83] text-white'
            : isSystem
            ? 'bg-[#FEF3C7] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300 border border-[#FDE68A] dark:border-amber-700/50'
            : 'bg-[#142C45] dark:bg-[#101C2A] text-white border border-[#DCE3EA]/20 dark:border-[#33485D]'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#46C3B2]" />}
      </div>

      {/* Bubble Content */}
      <div className={`flex-1 max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 mb-1.5 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[11px] font-semibold text-[#5D6B7B] dark:text-[#A9BACB]">
            {isUser ? 'Banking Officer' : 'COREvia Banking Copilot'}
          </span>
          <span className="text-[10px] text-[#8194A8] dark:text-[#64748B] font-mono">{message.timestamp}</span>
          {!isUser && message.model && (
            <span className="text-[9px] px-1.5 py-0.2 bg-[#EDF1F5] dark:bg-[#101C2A] text-[#5D6B7B] dark:text-[#A9BACB] rounded font-mono border border-[#DCE3EA] dark:border-[#33485D]">
              {message.model}
            </span>
          )}
        </div>

        <div
          className={`p-4 rounded-xl shadow-xs ${
            isUser
              ? 'bg-[#142C45] dark:bg-[#168C83] text-white rounded-tr-none'
              : isSystem
              ? 'bg-[#FFFBEB] dark:bg-amber-950/30 border border-[#FDE68A] dark:border-amber-700/50 text-[#92400E] dark:text-amber-200 rounded-tl-none'
              : 'bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] text-[#142C45] dark:text-[#E8EEF5] rounded-tl-none'
          }`}
        >
          {/* Tool Execution Feedback Header (If tools were invoked) */}
          {!isUser && message.toolCallsExecuted && message.toolCallsExecuted.length > 0 && (
            <div className="mb-3 pb-2.5 border-b border-[#DCE3EA] dark:border-[#26394C]">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowTools((prev) => !prev)}
                  className="flex items-center gap-1.5 text-[10px] font-semibold text-[#168C83] dark:text-[#46C3B2] hover:underline cursor-pointer"
                >
                  <Terminal className="w-3 h-3" />
                  <span>
                    Executed {message.toolCallsExecuted.length} CRM Tools ({message.toolCallsExecuted.slice(0, 2).join(', ')}
                    {message.toolCallsExecuted.length > 2 ? '...' : ''})
                  </span>
                  {showTools ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <span className="text-[9px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono flex items-center gap-1">
                  <Database className="w-2.5 h-2.5 text-blue-500" />
                  RBAC Sandboxed
                </span>
              </div>

              {showTools && (
                <div className="mt-2 p-2 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[11px] font-mono space-y-1">
                  <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-sans font-semibold">
                    Verified Tools Executed via Secure Backend Gateway:
                  </div>
                  {message.toolCallsExecuted.map((tool, tIdx) => (
                    <div key={tIdx} className="flex items-center gap-1.5 text-[#142C45] dark:text-[#CBD5E1]">
                      <span className="text-emerald-500">✓</span>
                      <span>{tool}()</span>
                    </div>
                  ))}
                  <div className="text-[9px] text-[#5D6B7B] dark:text-[#A9BACB] font-sans pt-1 border-t border-[#DCE3EA] dark:border-[#26394C]">
                    Zero direct SQL injection capability. All database interactions strictly execute through parameterized internal banking services.
                  </div>
                </div>
              )}
            </div>
          )}

          {renderFormattedContent(message.content)}

          {/* Pending Action Confirmation Card */}
          {message.pendingConfirmation && (
            <CopilotActionCard
              pendingAction={message.pendingConfirmation}
              messageId={message.id}
              onConfirm={onConfirmAction}
              onCancel={onCancelAction}
              actionResult={message.actionResult}
              onNavigate={onNavigate}
            />
          )}

          {/* Action Result (if previously confirmed or cancelled) */}
          {message.actionResult && !message.pendingConfirmation && (
            <div
              className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
                message.actionResult.status === 'CONFIRMED'
                  ? 'bg-[#F0FDF4] dark:bg-emerald-950/40 border border-[#BBF7D0] dark:border-emerald-800/60 text-[#14532D] dark:text-emerald-300'
                  : 'bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#CBD5E1] dark:border-[#33485D] text-[#64748B] dark:text-[#A9BACB]'
              }`}
            >
              {message.actionResult.status === 'CONFIRMED' ? (
                <CheckCircle2 className="w-4 h-4 text-[#16803C] dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#8194A8] dark:text-[#64748B] shrink-0" />
              )}
              <span className="font-medium">{message.actionResult.message}</span>
            </div>
          )}

          {/* Grounding Sources Chips */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-[#DCE3EA] dark:border-[#26394C]">
              <div className="flex items-center gap-1.5 text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#168C83] dark:text-[#46C3B2]" />
                <span>Grounded CRM Evidence Sources ({message.sources.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.sources.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => src.link && onNavigate && onNavigate(src.link)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] border font-medium transition-colors cursor-pointer shadow-2xs ${getSourceBadgeColor(
                      src.type
                    )}`}
                  >
                    <span>{src.label}</span>
                    {src.link && <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Suggested Next Actions / Follow-ups */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="mt-2.5 pl-1">
            <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase font-semibold tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#168C83] dark:text-[#46C3B2]" />
              <span>Suggested Follow-ups</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.suggestedActions.map((act, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectAction(act)}
                  className="px-2.5 py-1 bg-[#FFFFFF] dark:bg-[#162638] hover:bg-[#F8FAFC] dark:hover:bg-[#1E3247] active:bg-[#EDF1F5] text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] text-[11px] rounded border border-[#DCE3EA] dark:border-[#33485D] transition-colors text-left shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <span>{act}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
