import React from 'react';
import { focusRingClass } from './tokens';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
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
  icon?: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  code,
  subtext,
  trend,
  regulatoryBadge,
  icon,
  className = '',
  id,
  onClick,
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      id={id}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`bg-white border border-[#CBD5E1] rounded-sm p-3.5 text-left transition-all duration-150 shadow-2xs select-none ${
        isClickable
          ? `cursor-pointer hover:border-[#087F8C] hover:shadow-xs ${focusRingClass}`
          : 'hover:border-[#94A3B8]'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-[#475569] tracking-tight uppercase font-sans">
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {code && (
            <span className="font-mono text-[10px] text-[#64748B] font-normal bg-[#F8FAFC] px-1.5 py-0.2 rounded-xs border border-[#E2E8F0]">
              {code}
            </span>
          )}
          {icon && (
            <span className="text-[#64748B] [&>svg]:w-3.5 [&>svg]:h-3.5">
              {icon}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xl font-bold tracking-tight text-[#172033] tabular-nums">
          {value}
        </span>
      </div>

      {(subtext || trend || regulatoryBadge) && (
        <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          {subtext && <span className="truncate pr-1 text-[11px]">{subtext}</span>}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {trend && (
              <span
                className={`font-mono text-[11px] font-semibold ${
                  trend.isPositive === true
                    ? 'text-[#16803C]'
                    : trend.isPositive === false
                    ? 'text-[#B42318]'
                    : 'text-[#475569]'
                }`}
              >
                {trend.value}{' '}
                {trend.label && (
                  <span className="font-sans font-normal text-[#64748B]">
                    ({trend.label})
                  </span>
                )}
              </span>
            )}
            {regulatoryBadge && (
              <span
                className={`inline-flex items-center text-[10px] px-1.5 py-0.2 rounded-xs font-mono font-medium border ${
                  regulatoryBadge.status === 'compliant'
                    ? 'bg-[#f0fdf4] text-[#14532d] border-[#bbf7d0]'
                    : regulatoryBadge.status === 'warning'
                    ? 'bg-[#fffbeb] text-[#78350f] border-[#fde68a]'
                    : 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1]'
                }`}
              >
                {regulatoryBadge.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
