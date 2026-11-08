import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { focusRingClass } from './tokens';

export type NotificationType = 'success' | 'warning' | 'danger' | 'info';

export interface NotificationBannerProps {
  type?: NotificationType;
  title?: string;
  message: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  action?: React.ReactNode;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type = 'info',
  title,
  message,
  onDismiss,
  className = '',
  action,
}) => {
  const styles: Record<
    NotificationType,
    {
      container: string;
      icon: React.ReactNode;
      titleColor: string;
    }
  > = {
    success: {
      container: 'bg-[#F0FDF4] dark:bg-emerald-950/40 border-[#BBF7D0] dark:border-emerald-700/50 text-[#14532D] dark:text-emerald-200',
      icon: <CheckCircle2 className="w-4 h-4 text-[#16803C] dark:text-emerald-400 shrink-0" />,
      titleColor: 'text-[#14532D] dark:text-emerald-200',
    },
    warning: {
      container: 'bg-[#FEFCE8] dark:bg-amber-950/40 border-[#FEF08A] dark:border-amber-700/50 text-[#78350F] dark:text-amber-200',
      icon: <AlertTriangle className="w-4 h-4 text-[#B7791F] dark:text-amber-400 shrink-0" />,
      titleColor: 'text-[#78350F] dark:text-amber-200',
    },
    danger: {
      container: 'bg-[#FEF2F2] dark:bg-rose-950/40 border-[#FECACA] dark:border-rose-700/50 text-[#7F1D1D] dark:text-rose-200',
      icon: <AlertCircle className="w-4 h-4 text-[#B42318] dark:text-rose-400 shrink-0" />,
      titleColor: 'text-[#7F1D1D] dark:text-rose-200',
    },
    info: {
      container: 'bg-[#EFF6FF] dark:bg-blue-950/40 border-[#BFDBFE] dark:border-blue-700/50 text-[#1E3A8A] dark:text-blue-200',
      icon: <Info className="w-4 h-4 text-[#2563EB] dark:text-blue-400 shrink-0" />,
      titleColor: 'text-[#1E3A8A] dark:text-blue-200',
    },
  };

  const current = styles[type];

  return (
    <div
      role="alert"
      className={`p-3 rounded-sm border flex items-start justify-between gap-3 text-xs leading-relaxed transition-all shadow-2xs ${current.container} ${className}`}
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <div className="mt-0.5">{current.icon}</div>
        <div className="flex-1 min-w-0 space-y-0.5">
          {title && <h5 className={`font-semibold tracking-tight ${current.titleColor}`}>{title}</h5>}
          <div className="text-[11px] leading-normal">{message}</div>
          {action && <div className="pt-1.5">{action}</div>}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={`p-1 rounded-xs opacity-70 hover:opacity-100 transition-opacity cursor-pointer ${focusRingClass}`}
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export interface NotificationBadgeProps {
  count?: number;
  max?: number;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  variant?: 'danger' | 'brand' | 'warning' | 'info';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  max = 99,
  dot = false,
  pulse = false,
  className = '',
  variant = 'danger',
}) => {
  const variantStyles = {
    danger: 'bg-[#B42318] text-white',
    brand: 'bg-[#168C83] text-white',
    warning: 'bg-[#D9A441] text-[#142C45]',
    info: 'bg-[#2563EB] text-white',
  };

  if (dot) {
    return (
      <span
        className={`inline-block w-2 h-2 rounded-full ${variantStyles[variant]} ${
          pulse ? 'animate-pulse' : ''
        } ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold font-mono leading-none ${
        variantStyles[variant]
      } ${pulse ? 'animate-pulse' : ''} ${className}`}
    >
      {displayCount}
    </span>
  );
};

