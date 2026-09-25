import React from 'react';
import { CopilotWorkspace } from '../copilot/CopilotWorkspace';
import { Bot, ShieldCheck, Database, Lock, Sparkles, Terminal } from 'lucide-react';

interface CopilotModuleProps {
  onNavigate?: (path: string) => void;
}

export const CopilotModule: React.FC<CopilotModuleProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* Top Banner explaining architecture & safety */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between gap-4 flex-shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Institutional Banking Safety Active
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 hidden md:inline">
            All AI responses strictly grounded in CRM data & RBAC authorization
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" />
            2-Step Mutation Safeguard
          </span>
          <span className="hidden lg:inline text-slate-600">•</span>
          <span className="hidden lg:inline flex items-center gap-1">
            <Database className="w-3 h-3 text-blue-400" />
            PostgreSQL Grounded
          </span>
        </div>
      </div>

      {/* Main Copilot Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <CopilotWorkspace onNavigate={onNavigate} />
      </div>
    </div>
  );
};
