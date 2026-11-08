import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'primary'
  | 'brand'
  | 'info'
  | 'gold'
  | 'outline';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  icon?: React.ReactNode;
  dot?: boolean;
  interactive?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
  dot = false,
  interactive = false,
  onClick,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    neutral:
      'bg-[#EDF1F5] text-[#273444] border-[#DCE3EA] dark:bg-[#192B3D] dark:text-[#E8EEF5] dark:border-[#33485D]',
    success:
      'bg-[#F0FDF4] text-[#16803C] border-[#BBF7D0] dark:bg-[#062814] dark:text-[#22C55E] dark:border-[#15803D]',
    warning:
      'bg-[#FEFCE8] text-[#B7791F] border-[#FEF08A] dark:bg-[#341A04] dark:text-[#F59E0B] dark:border-[#B45309]',
    danger:
      'bg-[#FEF2F2] text-[#B42318] border-[#FECACA] dark:bg-[#370B0B] dark:text-[#EF4444] dark:border-[#B91C1C]',
    primary:
      'bg-[#142C45] text-white border-[#142C45] dark:bg-[#101C2A] dark:text-[#E8EEF5] dark:border-[#33485D]',
    brand:
      'bg-[#F0FDFB] text-[#168C83] border-[#CCFBF6] dark:bg-[#05211F] dark:text-[#2dd4c7] dark:border-[#168C83]/50',
    gold:
      'bg-[#FEF9E7] text-[#B7791F] border-[#F9E79F] dark:bg-[#2A2008] dark:text-[#D9A441] dark:border-[#D9A441]/40',
    info:
      'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] dark:bg-[#0D203F] dark:text-[#3B82F6] dark:border-[#1D4ED8]',
    outline:
      'bg-white text-[#5D6B7B] border-[#DCE3EA] dark:bg-[#162638] dark:text-[#A9BACB] dark:border-[#33485D]',
  };

  const dotColors: Record<BadgeVariant, string> = {
    neutral: 'bg-[#5D6B7B] dark:bg-[#A9BACB]',
    success: 'bg-[#16803C] dark:bg-[#22C55E]',
    warning: 'bg-[#B7791F] dark:bg-[#F59E0B]',
    danger: 'bg-[#B42318] dark:bg-[#EF4444]',
    primary: 'bg-white',
    brand: 'bg-[#168C83] dark:bg-[#2dd4c7]',
    gold: 'bg-[#D9A441]',
    info: 'bg-[#2563EB] dark:bg-[#3B82F6]',
    outline: 'bg-[#5D6B7B] dark:bg-[#A9BACB]',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    xs: 'text-[10px] px-1.5 py-0.2 rounded-xs font-medium tracking-tight',
    sm: 'text-[11px] px-2 py-0.5 rounded-xs font-medium tracking-tight',
    md: 'text-xs px-2.5 py-0.5 rounded-sm font-medium tracking-tight',
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border whitespace-nowrap select-none font-sans leading-none ${
        interactive ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''
      } ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
