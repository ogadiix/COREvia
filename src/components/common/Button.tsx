import React from 'react';
import { focusRingClass } from './tokens';

export type ButtonVariant =
  | 'primary'
  | 'brand'
  | 'secondary'
  | 'outline'
  | 'danger'
  | 'success'
  | 'ghost';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Institutional enterprise styles
    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-[#0f1e36] text-white hover:bg-[#1b2e4b] active:bg-[#091322] border border-[#0f1e36] shadow-2xs font-medium',
      brand:
        'bg-[#087F8C] text-white hover:bg-[#066974] active:bg-[#05535c] border border-[#087F8C] shadow-2xs font-medium',
      secondary:
        'bg-[#F8FAFC] text-[#172033] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] border border-[#CBD5E1] font-medium',
      outline:
        'bg-white text-[#475569] hover:text-[#172033] hover:bg-[#F8FAFC] active:bg-[#F1F5F9] border border-[#CBD5E1] shadow-2xs font-medium',
      danger:
        'bg-[#B42318] text-white hover:bg-[#911d13] active:bg-[#72170f] border border-[#B42318] shadow-2xs font-medium',
      success:
        'bg-[#16803C] text-white hover:bg-[#126b32] active:bg-[#0e5427] border border-[#16803C] shadow-2xs font-medium',
      ghost:
        'bg-transparent text-[#475569] hover:text-[#172033] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] border border-transparent font-medium',
    };

    // Compact enterprise density
    const sizeClasses: Record<ButtonSize, string> = {
      xs: 'text-[11px] h-6 px-2 rounded-xs gap-1 leading-none',
      sm: 'text-xs h-7 px-2.5 rounded-sm gap-1.5 leading-none',
      md: 'text-xs h-8 px-3.5 rounded-sm gap-2 leading-none',
      lg: 'text-sm h-9 px-4 rounded gap-2 leading-none',
    };

    const isInteractiveDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isInteractiveDisabled}
        aria-busy={loading}
        aria-disabled={isInteractiveDisabled}
        className={`inline-flex items-center justify-center select-none whitespace-nowrap motion-interactive cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${focusRingClass} ${
          fullWidth ? 'w-full' : ''
        } ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current shrink-0"
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
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="shrink-0 flex items-center justify-center">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0 flex items-center justify-center">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
