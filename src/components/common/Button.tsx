import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  // Enterprise banking theme colors: Deep slate navy primary, muted slate secondary
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-[#0f1e36] text-white hover:bg-[#1b2e4b] active:bg-[#091322] border border-[#0f1e36] shadow-xs',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-300',
    outline:
      'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-300 shadow-2xs',
    danger:
      'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 border border-rose-800 shadow-xs',
    ghost:
      'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent',
  };

  // Rule: Horizontal padding is exactly 2x vertical padding
  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'text-xs py-1.5 px-3 rounded-sm gap-1.5',
    md: 'text-sm py-2 px-4 rounded gap-2',
    lg: 'text-sm py-2.5 px-5 rounded gap-2.5 font-medium',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current"
          fill="none"
          viewBox="0 0 24 24"
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
      {!loading && icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
