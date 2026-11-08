import React from 'react';
import { Activity, Database, CheckCircle2, Shield, Lock } from 'lucide-react';
import { BANK_META } from '../../data/mockIndianBankingData';
import { useAuth } from '../../context/AuthContext';

export const SystemStatusBar: React.FC = () => {
  const { idleRemainingSeconds, user } = useAuth();
  const mins = Math.floor(idleRemainingSeconds / 60);
  const secs = idleRemainingSeconds % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <footer className="h-7 bg-[#EDF1F5] dark:bg-[#101C2A] border-t border-[#DCE3EA] dark:border-[#26394C] text-[#5D6B7B] dark:text-[#A9BACB] px-3 sm:px-4 flex items-center justify-between text-[11px] font-mono select-none shrink-0 z-30 overflow-hidden w-full max-w-full">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 truncate">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-sans font-medium text-[#273444] dark:text-[#E8EEF5]">CBS ONLINE</span>
        </div>
        <span className="text-[#8793A1] dark:text-[#33485D] hidden sm:inline">|</span>
        <div className="hidden sm:flex items-center gap-1 truncate">
          <Database className="w-3 h-3 text-[#8793A1] dark:text-[#8194A8] shrink-0" />
          <span className="truncate">FIN-DB PRIMARY</span>
        </div>
        <span className="text-[#8793A1] dark:text-[#33485D] hidden md:inline">|</span>
        <div className="hidden md:flex items-center gap-1">
          <Activity className="w-3 h-3 text-[#8793A1] dark:text-[#8194A8]" />
          <span>LATENCY: 4ms</span>
        </div>
        <span className="text-[#8793A1] dark:text-[#33485D] hidden lg:inline">|</span>
        <div className="hidden lg:flex items-center gap-1 text-[#5D6B7B] dark:text-[#A9BACB]">
          <span>BRANCH:</span>
          <span className="font-semibold text-[#273444] dark:text-[#E8EEF5]">{BANK_META.currentBranch.name} ({BANK_META.currentBranch.code})</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {user && (
          <>
            <div className="flex items-center gap-1 text-[#273444] dark:text-[#E8EEF5]" title="Workstation Session Auto-Lock Countdown">
              <Lock className="w-3 h-3 text-[#8793A1] dark:text-[#8194A8]" />
              <span>IDLE: <strong className="text-[#273444] dark:text-[#E8EEF5] font-bold">{timeFormatted}</strong></span>
            </div>
            <span className="text-[#8793A1] dark:text-[#33485D]">|</span>
          </>
        )}
        <div className="flex items-center gap-1 text-emerald-800 dark:text-emerald-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>RTGS: OPEN</span>
        </div>
        <span className="text-[#8793A1] dark:text-[#33485D] hidden sm:inline">|</span>
        <div className="hidden sm:flex items-center gap-1">
          <Shield className="w-3 h-3 text-[#8793A1] dark:text-[#8194A8]" />
          <span>256-BIT HSM</span>
        </div>
        <span className="text-[#8793A1] dark:text-[#33485D] hidden md:inline">|</span>
        <span className="text-[#8793A1] dark:text-[#8194A8] hidden md:inline">v26.4.1-REL</span>
      </div>
    </footer>
  );
};

