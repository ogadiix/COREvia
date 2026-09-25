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
    <footer className="h-7 bg-slate-100 border-t border-slate-300 text-slate-600 px-4 flex items-center justify-between text-[11px] font-mono select-none shrink-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-sans font-medium text-slate-800">CBS ONLINE</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1">
          <Database className="w-3 h-3 text-slate-500" />
          <span>FIN-DB PRIMARY (SYDNEY-MUM-SYNC)</span>
        </div>
        <span className="text-slate-300 hidden md:inline">|</span>
        <div className="hidden md:flex items-center gap-1">
          <Activity className="w-3 h-3 text-slate-500" />
          <span>LATENCY: 4ms</span>
        </div>
        <span className="text-slate-300 hidden lg:inline">|</span>
        <div className="hidden lg:flex items-center gap-1 text-slate-600">
          <span>BRANCH:</span>
          <span className="font-semibold text-slate-800">{BANK_META.currentBranch.name} ({BANK_META.currentBranch.code})</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="flex items-center gap-1 text-slate-700" title="Workstation Session Auto-Lock Countdown">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>TERMINAL IDLE: <strong className="text-slate-900 font-bold">{timeFormatted}</strong></span>
            </div>
            <span className="text-slate-300">|</span>
          </>
        )}
        <div className="flex items-center gap-1 text-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>RBI RTGS: OPEN</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="hidden sm:flex items-center gap-1">
          <Shield className="w-3 h-3 text-slate-500" />
          <span>256-BIT HSM SIGNED</span>
        </div>
        <span className="text-slate-300 hidden sm:inline">|</span>
        <span className="text-slate-500">v26.4.1-REL</span>
      </div>
    </footer>
  );
};

