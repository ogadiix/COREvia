import React from 'react';
import {
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
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

  // Helper to render markdown-like text cleanly
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className={`space-y-1.5 text-xs leading-relaxed ${isUser ? 'text-white' : 'text-[#273444] dark:text-[#E8EEF5]'}`}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          if (trimmed.startsWith('### ')) {
            return (
              <h4
                key={idx}
                className={`text-xs font-bold uppercase tracking-wider pt-1.5 ${
                  isUser ? 'text-white/90' : 'text-[#168C83] dark:text-[#1B9D92]'
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
                className={`text-sm font-bold pt-2 pb-0.5 ${
                  isUser ? 'text-white' : 'text-[#142C45] dark:text-[#E8EEF5]'
                }`}
              >
                {trimmed.replace('## ', '')}
              </h3>
            );
          }

          if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.replace(/^[•\-\*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-0.5">
                <span className={`font-bold mt-0.5 shrink-0 ${isUser ? 'text-white/80' : 'text-[#168C83] dark:text-[#1B9D92]'}`}>•</span>
                <div className="flex-1">{parseInlineStyles(itemText, isUser)}</div>
              </div>
            );
          }

          if (trimmed === '---') {
            return <hr key={idx} className={`my-2 ${isUser ? 'border-white/20' : 'border-[#DCE3EA] dark:border-[#33485D]'}`} />;
          }

          return <p key={idx}>{parseInlineStyles(line, isUser)}</p>;
        })}
      </div>
    );
  };

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
            className={`px-1 py-0.2 font-mono text-[11px] rounded-xs border ${
              userMsg
                ? 'bg-white/20 text-white border-white/30'
                : 'bg-[#EDF1F5] dark:bg-[#101C2A] text-[#168C83] dark:text-[#1B9D92] border-[#DCE3EA] dark:border-[#33485D]'
            }`}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const getSourceBadgeColor = (type: string) => {
    switch (type) {
      case 'CUSTOMER':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'CORE_SCORE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'INTELLIGENCE':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      case 'NBA':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'OPPORTUNITY':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
      case 'CASE':
        return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
      case 'TASK':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
    }
  };

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} motion-fade-in`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 text-xs shadow-2xs ${
          isUser
            ? 'bg-[#168C83] text-white'
            : isSystem
            ? 'bg-[#FEF3C7] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300 border border-[#FDE68A] dark:border-amber-700/50'
            : 'bg-[#142C45] dark:bg-[#101C2A] text-white border border-[#DCE3EA]/20 dark:border-[#33485D]'
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Content */}
      <div className={`flex-1 max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 mb-1 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[11px] font-semibold text-[#5D6B7B] dark:text-[#A9BACB]">
            {isUser ? 'Officer Inquiry' : 'COREvia Banking Copilot'}
          </span>
          <span className="text-[10px] text-[#8793A1] dark:text-[#8194A8] font-mono">{message.timestamp}</span>
          {!isUser && message.model && (
            <span className="text-[9px] px-1.5 py-0.2 bg-[#EDF1F5] dark:bg-[#101C2A] text-[#5D6B7B] dark:text-[#A9BACB] rounded-xs font-mono border border-[#DCE3EA] dark:border-[#33485D]">
              {message.model}
            </span>
          )}
        </div>

        <div
          className={`p-3.5 rounded-lg shadow-2xs ${
            isUser
              ? 'bg-[#142C45] dark:bg-[#168C83] text-white rounded-tr-none'
              : isSystem
              ? 'bg-[#FFFBEB] dark:bg-amber-950/30 border border-[#FDE68A] dark:border-amber-700/50 text-[#92400E] dark:text-amber-200 rounded-tl-none'
              : 'bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5] rounded-tl-none'
          }`}
        >
          {renderFormattedContent(message.content)}

          {/* Pending Action Card */}
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
              className={`mt-2.5 p-2.5 rounded-xs text-xs flex items-center gap-2 ${
                message.actionResult.status === 'CONFIRMED'
                  ? 'bg-[#F0FDF4] dark:bg-emerald-950/30 border border-[#BBF7D0] dark:border-emerald-700/50 text-[#14532D] dark:text-emerald-300'
                  : 'bg-[#F8FAFC] dark:bg-[#192B3D] border border-[#CBD5E1] dark:border-[#33485D] text-[#64748B] dark:text-[#A9BACB]'
              }`}
            >
              {message.actionResult.status === 'CONFIRMED' ? (
                <CheckCircle2 className="w-4 h-4 text-[#16803C] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#8793A1] dark:text-[#8194A8] shrink-0" />
              )}
              <span className="font-medium">{message.actionResult.message}</span>
            </div>
          )}

          {/* Grounding Sources Chips */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#DCE3EA] dark:border-[#26394C]">
              <div className="flex items-center gap-1.5 text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider font-semibold mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16803C]" />
                <span>Grounded CRM Sources ({message.sources.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.sources.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => src.link && onNavigate && onNavigate(src.link)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] border font-medium transition-colors cursor-pointer ${getSourceBadgeColor(
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

        {/* Suggested Next Actions */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="mt-2 pl-0.5">
            <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase font-semibold tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#168C83]" />
              <span>Suggested Follow-ups</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.suggestedActions.map((act, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectAction(act)}
                  className="px-2.5 py-1 bg-white dark:bg-[#192B3D] hover:bg-[#EDF1F5] dark:hover:bg-[#20364B] active:bg-[#DCE3EA] text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#273444] dark:hover:text-[#E8EEF5] text-[11px] rounded-xs border border-[#DCE3EA] dark:border-[#33485D] transition-colors text-left shadow-2xs cursor-pointer"
                >
                  {act}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
