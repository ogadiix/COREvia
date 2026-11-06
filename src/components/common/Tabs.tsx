import React, { useRef } from 'react';
import { focusRingClass } from './tokens';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  badgeVariant?: 'neutral' | 'brand' | 'warning' | 'danger' | 'success';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export type TabsVariant = 'line' | 'pill' | 'enclosed';
export type TabsSize = 'sm' | 'md';

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'line',
  size = 'md',
  className = '',
  id,
  'aria-label': ariaLabel = 'Navigation Tabs',
}) => {
  const tabListRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation across tabs (WAI-ARIA Tabs pattern)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const availableTabs = tabs.filter((t) => !t.disabled);
    const currentIndex = availableTabs.findIndex((t) => t.id === tabs[index].id);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextTab = availableTabs[(currentIndex + 1) % availableTabs.length];
      if (nextTab) onChange(nextTab.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevTab =
        availableTabs[(currentIndex - 1 + availableTabs.length) % availableTabs.length];
      if (prevTab) onChange(prevTab.id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (availableTabs.length > 0) onChange(availableTabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      if (availableTabs.length > 0) onChange(availableTabs[availableTabs.length - 1].id);
    }
  };

  const badgeVariantStyles: Record<string, string> = {
    neutral: 'bg-[#F1F5F9] text-[#475569]',
    brand: 'bg-[#087F8C]/15 text-[#066974]',
    warning: 'bg-[#fffbeb] text-[#B45309]',
    danger: 'bg-[#fef2f2] text-[#B42318]',
    success: 'bg-[#f0fdf4] text-[#16803C]',
  };

  return (
    <div
      id={id}
      className={`border-b border-[#CBD5E1] bg-white select-none ${className}`}
    >
      <div
        ref={tabListRef}
        role="tablist"
        aria-label={ariaLabel}
        className="flex space-x-1 px-3 -mb-px overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          const isDisabled = Boolean(tab.disabled);

          if (variant === 'pill') {
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                disabled={isDisabled}
                tabIndex={isActive ? 0 : -1}
                onClick={() => !isDisabled && onChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`group inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xs font-medium text-xs whitespace-nowrap cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${focusRingClass} ${
                  isActive
                    ? 'bg-[#0f1e36] text-white shadow-2xs font-semibold'
                    : 'text-[#475569] hover:text-[#172033] hover:bg-[#F1F5F9]'
                }`}
              >
                {tab.icon && (
                  <span className="shrink-0 flex items-center [&>svg]:w-3.5 [&>svg]:h-3.5">
                    {tab.icon}
                  </span>
                )}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 py-0.2 px-1.5 rounded-xs text-[10px] font-mono font-medium ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : badgeVariantStyles[tab.badgeVariant || 'neutral']
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          }

          // Default 'line' variant with brand #087F8C indicator
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              disabled={isDisabled}
              tabIndex={isActive ? 0 : -1}
              onClick={() => !isDisabled && onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`group inline-flex items-center gap-1.5 border-b-2 font-medium whitespace-nowrap cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${focusRingClass} ${
                size === 'sm' ? 'py-2 px-2.5 text-xs' : 'py-2.5 px-3.5 text-xs'
              } ${
                isActive
                  ? 'border-[#087F8C] text-[#066974] font-semibold'
                  : 'border-transparent text-[#64748B] hover:text-[#172033] hover:border-[#CBD5E1]'
              }`}
            >
              {tab.icon && (
                <span
                  className={`shrink-0 flex items-center [&>svg]:w-3.5 [&>svg]:h-3.5 ${
                    isActive ? 'text-[#087F8C]' : 'text-[#64748B] group-hover:text-[#172033]'
                  }`}
                >
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`ml-1 py-0.2 px-1.5 rounded-xs text-[10px] font-mono font-medium ${
                    isActive
                      ? 'bg-[#087F8C]/15 text-[#066974]'
                      : badgeVariantStyles[tab.badgeVariant || 'neutral']
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
