import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  code?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Operational Request Failure',
  message,
  code,
  onRetry,
  action,
  compact = false,
  className = '',
}) => {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-sm border border-[#FECACA] dark:border-[#B91C1C] bg-[#FEF2F2] dark:bg-[#370B0B] text-left ${
        compact ? 'p-3' : 'p-4 sm:p-5'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-xs bg-[#B42318]/10 dark:bg-[#EF4444]/20 text-[#B42318] dark:text-[#EF4444] shrink-0 mt-0.5 [&>svg]:w-4 [&>svg]:h-4">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-[#7F1D1D] dark:text-[#FCA5A5] uppercase tracking-tight">
              {title}
            </h4>
            {code && (
              <span className="font-mono text-[10px] px-1 py-0.2 rounded-xs bg-white/60 dark:bg-[#101C2A] border border-[#FECACA] dark:border-[#B91C1C] text-[#B42318] dark:text-[#EF4444]">
                {code}
              </span>
            )}
          </div>
          <p className="text-xs text-[#991B1B] dark:text-[#FCA5A5]/90 mt-1 leading-relaxed">{message}</p>

          {(onRetry || action) && (
            <div className="mt-3 flex items-center gap-2">
              {onRetry && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={onRetry}
                  icon={<RefreshCw className="w-3 h-3 text-[#B42318] dark:text-[#EF4444]" />}
                  className="bg-white dark:bg-[#162638] border-[#FECACA] dark:border-[#B91C1C] text-[#7F1D1D] dark:text-[#FCA5A5] hover:bg-[#FEE2E2] dark:hover:bg-[#450A0A]"
                >
                  Retry Request
                </Button>
              )}
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
