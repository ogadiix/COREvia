import React from 'react';
import { focusRingClass } from './tokens';

export type CardVariant = 'default' | 'subtle' | 'sunken' | 'interactive';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className = '', children, onClick, ...props }, ref) => {
    const variantClasses: Record<CardVariant, string> = {
      default:
        'bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5] shadow-xs',
      subtle:
        'bg-[#EDF1F5] dark:bg-[#192B3D] border border-[#DCE3EA] dark:border-[#26394C] text-[#273444] dark:text-[#E8EEF5]',
      sunken:
        'bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#26394C] text-[#273444] dark:text-[#E8EEF5]',
      interactive:
        'bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5] shadow-xs hover:border-[#168C83] dark:hover:border-[#168C83] hover:shadow-sm cursor-pointer transition-all duration-150',
    };

    const paddingClasses: Record<CardPadding, string> = {
      none: '',
      sm: 'p-2.5',
      md: 'p-4',
      lg: 'p-5',
    };

    const isInteractive = variant === 'interactive' || Boolean(onClick);

    return (
      <div
        ref={ref}
        onClick={onClick}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.(e as any);
                }
              }
            : undefined
        }
        className={`rounded-sm text-left select-none ${
          isInteractive ? focusRingClass : ''
        } ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  code?: string;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  code,
  className = '',
}) => {
  return (
    <div
      className={`flex items-start justify-between gap-3 pb-3 border-b border-[#DCE3EA] dark:border-[#26394C] ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {icon && (
          <div className="shrink-0 p-1.5 rounded-xs bg-[#EDF1F5] dark:bg-[#101C2A] text-[#142C45] dark:text-[#168C83] border border-[#DCE3EA] dark:border-[#26394C] mt-0.5 [&>svg]:w-4 [&>svg]:h-4">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[#273444] dark:text-[#E8EEF5] tracking-tight uppercase truncate font-sans">
              {title}
            </h3>
            {code && (
              <span className="font-mono text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] bg-[#EDF1F5] dark:bg-[#101C2A] px-1.5 py-0.2 rounded-xs border border-[#DCE3EA] dark:border-[#33485D]">
                {code}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-[#5D6B7B] dark:text-[#8194A8] mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`pt-3 text-xs text-[#273444] dark:text-[#E8EEF5] ${className}`}>
      {children}
    </div>
  );
};

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`mt-4 pt-3 border-t border-[#DCE3EA] dark:border-[#26394C] flex items-center justify-between text-xs text-[#5D6B7B] dark:text-[#8194A8] ${className}`}
    >
      {children}
    </div>
  );
};
