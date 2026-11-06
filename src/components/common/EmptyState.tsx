import React from 'react';
import { Layers } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  compact = false,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center select-none ${
        compact ? 'py-8 px-4' : 'py-12 px-6'
      } ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] text-[#64748B] flex items-center justify-center mb-3 [&>svg]:w-5 [&>svg]:h-5">
        {icon || <Layers className="w-5 h-5 text-[#64748B]" />}
      </div>
      <h4 className="text-xs sm:text-sm font-semibold text-[#172033] tracking-tight">
        {title}
      </h4>
      {description && (
        <p className="text-xs text-[#64748B] max-w-sm mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

