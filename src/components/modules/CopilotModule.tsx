import React, { useState } from 'react';
import { CopilotWorkspace } from '../copilot/CopilotWorkspace';
import {
  ShieldCheck,
  Database,
  Lock,
  Sparkles,
  Terminal,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  User,
  TrendingUp,
  Briefcase,
  AlertTriangle,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCopilot } from '../../context/CopilotContext';

interface CopilotModuleProps {
  onNavigate?: (path: string) => void;
}

const AUTHORIZED_TOOLS = [
  { name: 'getCustomer360', desc: 'Master records & relationship depth', scope: 'Read Only' },
  { name: 'getCoreScoreBreakdown', desc: 'Financial, credit, service, engagement scores', scope: 'Read Only' },
  { name: 'getCustomerNextBestActions', desc: 'Deterministic algorithmic NBA suggestions', scope: 'Read Only' },
  { name: 'getCustomerOpportunityRadar', desc: 'Cross-sell signals & coverage gap rules', scope: 'Read Only' },
  { name: 'getCustomerCases', desc: 'Active service desk tickets & SLA countdowns', scope: 'Read Only' },
  { name: 'getCustomerAccounts', desc: 'CASA balances, drawing power, & fixed deposits', scope: 'Read Only' },
  { name: 'proposeCreateTask', desc: 'Stage follow-up task for officer confirmation', scope: 'Proposal' },
  { name: 'proposeCreateFollowup', desc: 'Schedule client interaction review', scope: 'Proposal' },
];

export const CopilotModule: React.FC<CopilotModuleProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { currentContext, setCopilotContext, sendMessage } = useCopilot();
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-[#F4F6F8] dark:bg-[#0A121E] overflow-hidden">
      {/* 1. Institutional Governance & Security Strip */}
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border-b border-[#DCE3EA] dark:border-[#33485D] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Institutional Banking Safety Active
          </span>
          <span className="hidden md:inline text-[#DCE3EA] dark:text-[#33485D]">|</span>
          <span className="text-[#5D6B7B] dark:text-[#A9BACB] hidden md:inline">
            All AI responses strictly grounded in Core Banking tools & RBAC authorization
          </span>
        </div>

        <div className="flex items-center gap-4 text-[#5D6B7B] dark:text-[#A9BACB] font-mono text-[11px]">
          <span className="hidden lg:flex items-center gap-1 text-blue-700 dark:text-blue-300">
            <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            PostgreSQL Grounded
          </span>
          <span className="hidden sm:flex items-center gap-1 text-amber-700 dark:text-amber-400">
            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            2-Step Mutation Safeguard
          </span>
          <button
            onClick={() => setShowSidebar((prev) => !prev)}
            className="hidden xl:flex items-center gap-1 text-[11px] text-[#168C83] dark:text-[#46C3B2] hover:underline cursor-pointer font-sans font-medium"
          >
            <span>{showSidebar ? 'Hide Tool Cockpit' : 'Show Tool Cockpit'}</span>
            {showSidebar ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 2. Workspace Body: Optional Sidebar + Main Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Cockpit: Visible on xl screens when showSidebar is true */}
        {showSidebar && (
          <div className="hidden xl:flex w-80 flex-col bg-[#FFFFFF] dark:bg-[#162638] border-r border-[#DCE3EA] dark:border-[#33485D] overflow-y-auto p-4 space-y-4 shrink-0 shadow-xs">
            {/* Officer Credentials & Session Card */}
            <div className="p-3.5 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between text-[#5D6B7B] dark:text-[#A9BACB]">
                <span className="text-[10px] uppercase font-bold tracking-wider">Authorized Officer</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                  RBAC Active
                </span>
              </div>
              <div className="font-semibold text-sm text-[#142C45] dark:text-[#E8EEF5]">
                {user?.name || 'Deepak Nambiar'}
              </div>
              <div className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] flex items-center justify-between">
                <span>Role: {user?.role?.replace('_', ' ') || 'Relationship Manager'}</span>
                <span className="font-mono">EMP-1049</span>
              </div>
            </div>

            {/* Architectural Security Guarantee Card */}
            <div className="p-3.5 bg-[#168C83]/5 dark:bg-[#168C83]/10 border border-[#168C83]/20 dark:border-[#168C83]/30 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#168C83] dark:text-[#46C3B2] uppercase tracking-wider text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Direct Database Access</span>
              </div>
              <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] leading-relaxed">
                Gemini operates in isolation and cannot run arbitrary SQL or modify customer balances. Every interaction queries parameterized internal banking services.
              </p>
            </div>

            {/* Explainable Banking Tools Registry */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#168C83] dark:text-[#46C3B2]" />
                  <span>Authorized CRM Tools</span>
                </span>
                <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">
                  {AUTHORIZED_TOOLS.length} Active
                </span>
              </div>

              <div className="space-y-1.5">
                {AUTHORIZED_TOOLS.map((tool, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-xs space-y-1 hover:border-[#168C83] dark:hover:border-[#46C3B2] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-[11px] text-[#142C45] dark:text-[#E8EEF5]">
                        {tool.name}()
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          tool.scope === 'Proposal'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {tool.scope}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">{tool.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Context Switcher */}
            <div className="pt-2 border-t border-[#DCE3EA] dark:border-[#26394C] space-y-2">
              <div className="text-[10px] font-bold text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider">
                Quick Action Shortlinks
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('/customers')}
                    className="p-2 rounded bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247] text-[#142C45] dark:text-[#E8EEF5] text-[11px] text-left transition-colors cursor-pointer"
                  >
                    Customers 360
                  </button>
                )}
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('/relationship-twin')}
                    className="p-2 rounded bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247] text-[#142C45] dark:text-[#E8EEF5] text-[11px] text-left transition-colors cursor-pointer"
                  >
                    Digital Twin
                  </button>
                )}
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('/relationship-graph')}
                    className="p-2 rounded bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247] text-[#142C45] dark:text-[#E8EEF5] text-[11px] text-left transition-colors cursor-pointer"
                  >
                    Topology Graph
                  </button>
                )}
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('/next-best-action')}
                    className="p-2 rounded bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247] text-[#142C45] dark:text-[#E8EEF5] text-[11px] text-left transition-colors cursor-pointer"
                  >
                    Next Best Action
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Assistant Chat Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CopilotWorkspace onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
};
