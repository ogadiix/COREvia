import React from 'react';
import {
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Link2,
} from 'lucide-react';
import { CopilotMessage, CopilotSourceItem } from '../../context/CopilotContext';
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

  // Helper to render markdown-like text cleanly without large external parser
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed text-slate-200">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-xs font-bold text-emerald-400 uppercase tracking-wider pt-1.5">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-sm font-bold text-white pt-2 pb-0.5">
                {trimmed.replace('## ', '')}
              </h3>
            );
          }

          if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.replace(/^[•\-\*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-emerald-400 mt-1 font-bold">•</span>
                <div className="flex-1">{parseInlineStyles(itemText)}</div>
              </div>
            );
          }

          if (trimmed === '---') {
            return <hr key={idx} className="my-2 border-slate-800" />;
          }

          return <p key={idx}>{parseInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  const parseInlineStyles = (text: string) => {
    // Basic inline bold and code replacement
    const parts = text.split(/(\*\*.*?\*\*|\`.*?\`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1 py-0.5 bg-slate-800 text-emerald-300 font-mono text-[11px] rounded">
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
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'CORE_SCORE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'INTELLIGENCE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'NBA':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'OPPORTUNITY':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'CASE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'TASK':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
          isUser
            ? 'bg-blue-600 text-white'
            : isSystem
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            : 'bg-emerald-600 text-white shadow-sm'
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Content */}
      <div className={`flex-1 max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-[11px] font-medium text-slate-400">
            {isUser ? 'Officer' : 'COREvia Banking Copilot'}
          </span>
          <span className="text-[10px] text-slate-500">{message.timestamp}</span>
          {!isUser && message.model && (
            <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded font-mono border border-slate-700/60">
              {message.model}
            </span>
          )}
        </div>

        <div
          className={`p-3.5 rounded-2xl ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-none'
              : isSystem
              ? 'bg-amber-500/10 border border-amber-500/20 rounded-tl-none text-amber-200'
              : 'bg-slate-900 border border-slate-800/90 rounded-tl-none shadow-sm'
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
              className={`mt-2.5 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                message.actionResult.status === 'CONFIRMED'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/60 border border-slate-700 text-slate-400'
              }`}
            >
              {message.actionResult.status === 'CONFIRMED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <span>{message.actionResult.message}</span>
            </div>
          )}

          {/* Grounding Sources Chips */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Grounded CRM Sources ({message.sources.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {message.sources.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => src.link && onNavigate && onNavigate(src.link)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border font-medium transition-colors ${getSourceBadgeColor(
                      src.type
                    )} hover:opacity-90`}
                  >
                    <span>{src.label}</span>
                    {src.link && <ExternalLink className="w-2.5 h-2.5 opacity-60" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Suggested Next Actions */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="mt-2 pl-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Suggested Follow-ups</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.suggestedActions.map((act, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectAction(act)}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/90 active:bg-slate-700 text-slate-300 hover:text-white text-[11px] rounded-lg border border-slate-700/60 transition-colors text-left"
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
