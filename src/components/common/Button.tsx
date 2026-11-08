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
    // Institutional enterprise styles with dual-theme support
    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-[#142C45] text-white hover:bg-[#101C2A] active:bg-[#0c1c2e] border border-[#142C45] dark:bg-[#168C83] dark:text-white dark:hover:bg-[#1B9D92] dark:active:bg-[#137971] dark:border-[#168C83] shadow-xs font-medium',
      brand:
        'bg-[#168C83] text-white hover:bg-[#1B9D92] active:bg-[#137971] border border-[#168C83] dark:bg-[#168C83] dark:text-white dark:hover:bg-[#1B9D92] dark:border-[#168C83] shadow-xs font-medium',
      secondary:
        'bg-[#EDF1F5] text-[#273444] hover:bg-[#DCE3EA] active:bg-[#CBD5E1] border border-[#DCE3EA] dark:bg-[#192B3D] dark:text-[#E8EEF5] dark:hover:bg-[#20364B] dark:active:bg-[#162638] dark:border-[#33485D] font-medium',
      outline:
        'bg-white text-[#5D6B7B] hover:text-[#273444] hover:bg-[#EDF1F5] active:bg-[#DCE3EA] border border-[#DCE3EA] dark:bg-[#162638] dark:text-[#A9BACB] dark:hover:text-[#E8EEF5] dark:hover:bg-[#192B3D] dark:border-[#33485D] shadow-2xs font-medium',
      danger:
        'bg-[#B42318] text-white hover:bg-[#911d13] active:bg-[#72170f] border border-[#B42318] dark:bg-[#EF4444] dark:hover:bg-[#DC2626] dark:border-[#EF4444] shadow-xs font-medium',
      success:
        'bg-[#16803C] text-white hover:bg-[#126b32] active:bg-[#0e5427] border border-[#16803C] dark:bg-[#22C55E] dark:hover:bg-[#16A34A] dark:border-[#22C55E] shadow-xs font-medium',
      ghost:
        'bg-transparent text-[#5D6B7B] hover:text-[#273444] hover:bg-[#EDF1F5] active:bg-[#DCE3EA] border border-transparent dark:text-[#A9BACB] dark:hover:text-[#E8EEF5] dark:hover:bg-[#192B3D] font-medium',
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
          <span className="shrink-0 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5">
            {icon}
          </span>
        )}
        <span>{children}</span>
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
