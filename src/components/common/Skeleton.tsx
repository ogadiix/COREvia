import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'xs' | 'sm' | 'md' | 'full';
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  rounded = 'xs',
  className = '',
  style,
  ...props
}) => {
  const roundedClasses = {
    xs: 'rounded-xs',
    sm: 'rounded-sm',
    md: 'rounded-md',
    full: 'rounded-full',
  };

  return (
    <div
      aria-hidden="true"
      className={`bg-[#EDF1F5] dark:bg-[#192B3D] motion-pulse-subtle ${roundedClasses[rounded]} ${className}`}
      style={{
        width: width ?? '100%',
        height: height ?? '1rem',
        ...style,
      }}
      {...props}
    />
  );
};

export interface SkeletonTextProps {
  lines?: number;
  gap?: string;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  gap = 'gap-2',
  className = '',
}) => {
  return (
    <div className={`flex flex-col ${gap} ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          height="12px"
          width={idx === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
};

export interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div
      className={`p-4 bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-sm shadow-xs space-y-3 ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <Skeleton width="40%" height="14px" />
        <Skeleton width="20%" height="12px" />
      </div>
      <Skeleton width="60%" height="24px" />
      <SkeletonText lines={2} />
    </div>
  );
};
