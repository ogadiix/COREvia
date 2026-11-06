import React from 'react';
import { focusRingClass } from './tokens';

export type IconButtonVariant = 'ghost' | 'outline' | 'secondary' | 'primary' | 'brand' | 'danger';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string; // Enforce accessible name for screen readers
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      'aria-label': ariaLabel,
      variant = 'ghost',
      size = 'sm',
      loading = false,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const variantClasses: Record<IconButtonVariant, string> = {
      ghost:
        'bg-transparent text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] border border-transparent',
      outline:
        'bg-white text-[#475569] hover:text-[#172033] hover:bg-[#F8FAFC] active:bg-[#F1F5F9] border border-[#CBD5E1] shadow-2xs',
      secondary:
        'bg-[#F8FAFC] text-[#475569] hover:text-[#172033] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] border border-[#CBD5E1]',
      primary:
        'bg-[#0f1e36] text-white hover:bg-[#1b2e4b] active:bg-[#091322] border border-[#0f1e36] shadow-2xs',
      brand:
        'bg-[#087F8C] text-white hover:bg-[#066974] active:bg-[#05535c] border border-[#087F8C] shadow-2xs',
      danger:
        'bg-[#B42318] text-white hover:bg-[#911d13] active:bg-[#72170f] border border-[#B42318] shadow-2xs',
    };

    const sizeClasses: Record<IconButtonSize, string> = {
      xs: 'w-6 h-6 p-1 rounded-xs [&>svg]:w-3 [&>svg]:h-3',
      sm: 'w-7 h-7 p-1.5 rounded-sm [&>svg]:w-3.5 [&>svg]:h-3.5',
      md: 'w-8 h-8 p-2 rounded-sm [&>svg]:w-4 [&>svg]:h-4',
      lg: 'w-9 h-9 p-2 rounded [&>svg]:w-5 [&>svg]:h-5',
    };

    const isInteractiveDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isInteractiveDisabled}
        aria-label={ariaLabel}
        aria-busy={loading}
        title={props.title || ariaLabel}
        className={`inline-flex items-center justify-center shrink-0 select-none motion-interactive cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${focusRingClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin text-current shrink-0 w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

