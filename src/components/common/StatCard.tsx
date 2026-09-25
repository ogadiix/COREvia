import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  code?: string;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  regulatoryBadge?: {
    text: string;
    status: 'compliant' | 'warning' | 'neutral';
  };
  className?: string;
  id?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  code,
  subtext,
  trend,
  regulatoryBadge,
  className = '',
  id,
}) => {
  return (
    <div
      id={id}
      className={`bg-white border border-slate-200 rounded p-4 text-left transition-colors hover:border-slate-300 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium text-slate-500 tracking-tight">
          {label}
        </span>
        {code && (
          <span className="font-mono text-[11px] text-slate-400 font-normal">
            {code}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {value}
        </span>
      </div>

      {(subtext || trend || regulatoryBadge) && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtext && <span>{subtext}</span>}
          {trend && (
            <span
              className={`font-mono text-[11px] font-medium ${
                trend.isPositive === true
                  ? 'text-emerald-700'
                  : trend.isPositive === false
                  ? 'text-rose-700'
                  : 'text-slate-600'
              }`}
            >
              {trend.value} {trend.label && <span className="font-sans font-normal text-slate-400">({trend.label})</span>}
            </span>
          )}
          {regulatoryBadge && (
            <span
              className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-xs font-mono font-medium ${
                regulatoryBadge.status === 'compliant'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : regulatoryBadge.status === 'warning'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              {regulatoryBadge.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
