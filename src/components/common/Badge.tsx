import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'primary'
  | 'brand'
  | 'info'
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
    neutral: 'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]',
    success: 'bg-[#f0fdf4] text-[#14532d] border-[#bbf7d0]',
    warning: 'bg-[#fffbeb] text-[#78350f] border-[#fde68a]',
    danger: 'bg-[#fef2f2] text-[#7f1d1d] border-[#fecaca]',
    primary: 'bg-[#0f1e36] text-white border-[#0f1e36]',
    brand: 'bg-[#f0fdfa] text-[#066974] border-[#99f6e4]',
    info: 'bg-[#eff6ff] text-[#1e3a8a] border-[#bfdbfe]',
    outline: 'bg-white text-[#475569] border-[#CBD5E1]',
  };

  const dotColors: Record<BadgeVariant, string> = {
    neutral: 'bg-[#64748B]',
    success: 'bg-[#16803C]',
    warning: 'bg-[#B45309]',
    danger: 'bg-[#B42318]',
    primary: 'bg-white',
    brand: 'bg-[#087F8C]',
    info: 'bg-[#2563EB]',
    outline: 'bg-[#64748B]',
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
