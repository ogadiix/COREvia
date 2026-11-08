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
      className={`bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-sm p-3.5 text-left transition-all duration-150 shadow-xs select-none ${
        isClickable
          ? `cursor-pointer hover:border-[#168C83] dark:hover:border-[#168C83] hover:shadow-sm ${focusRingClass}`
          : 'hover:border-[#168C83] dark:hover:border-[#168C83]'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-[#5D6B7B] dark:text-[#A9BACB] tracking-tight uppercase font-sans">
          {label}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {code && (
            <span className="font-mono text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-normal bg-[#EDF1F5] dark:bg-[#101C2A] px-1.5 py-0.2 rounded-xs border border-[#DCE3EA] dark:border-[#33485D]">
              {code}
            </span>
          )}
          {icon && (
            <span className="text-[#5D6B7B] dark:text-[#A9BACB] [&>svg]:w-3.5 [&>svg]:h-3.5">
              {icon}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-mono text-xl font-bold tracking-tight text-[#273444] dark:text-[#E8EEF5] tabular-nums">
          {value}
        </span>
      </div>

      {(subtext || trend || regulatoryBadge) && (
        <div className="mt-2.5 pt-2 border-t border-[#DCE3EA] dark:border-[#26394C] flex items-center justify-between text-xs text-[#5D6B7B] dark:text-[#8194A8]">
          {subtext && <span className="truncate pr-1 text-[11px]">{subtext}</span>}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {trend && (
              <span
                className={`font-mono text-[11px] font-semibold ${
                  trend.isPositive === true
                    ? 'text-[#16803C] dark:text-[#22C55E]'
                    : trend.isPositive === false
                    ? 'text-[#B42318] dark:text-[#EF4444]'
                    : 'text-[#5D6B7B] dark:text-[#A9BACB]'
                }`}
              >
                {trend.value}{' '}
                {trend.label && (
                  <span className="font-sans font-normal text-[#8793A1] dark:text-[#8194A8]">
                    ({trend.label})
                  </span>
                )}
              </span>
            )}
            {regulatoryBadge && (
              <span
                className={`inline-flex items-center text-[10px] px-1.5 py-0.2 rounded-xs font-mono font-medium border ${
                  regulatoryBadge.status === 'compliant'
                    ? 'bg-[#F0FDF4] text-[#16803C] border-[#BBF7D0] dark:bg-[#062814] dark:text-[#22C55E] dark:border-[#15803D]'
                    : regulatoryBadge.status === 'warning'
                    ? 'bg-[#FEFCE8] text-[#B7791F] border-[#FEF08A] dark:bg-[#341A04] dark:text-[#F59E0B] dark:border-[#B45309]'
                    : 'bg-[#EDF1F5] text-[#5D6B7B] border-[#DCE3EA] dark:bg-[#101C2A] dark:text-[#A9BACB] dark:border-[#33485D]'
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
