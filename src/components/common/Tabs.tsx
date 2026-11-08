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
    neutral:
      'bg-[#EDF1F5] dark:bg-[#101C2A] text-[#5D6B7B] dark:text-[#A9BACB]',
    brand:
      'bg-[#F0FDFB] dark:bg-[#05211F] text-[#168C83] dark:text-[#2dd4c7]',
    warning:
      'bg-[#FEFCE8] dark:bg-[#341A04] text-[#B7791F] dark:text-[#F59E0B]',
    danger:
      'bg-[#FEF2F2] dark:bg-[#370B0B] text-[#B42318] dark:text-[#EF4444]',
    success:
      'bg-[#F0FDF4] dark:bg-[#062814] text-[#16803C] dark:text-[#22C55E]',
  };

  return (
    <div
      id={id}
      className={`border-b border-[#DCE3EA] dark:border-[#33485D] bg-white dark:bg-[#162638] select-none ${className}`}
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
                    ? 'bg-[#142C45] dark:bg-[#168C83] text-white shadow-xs font-semibold'
                    : 'text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#273444] dark:hover:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#192B3D]'
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

          // Default 'line' variant with brand #168C83 indicator
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
                  ? 'border-[#168C83] text-[#168C83] dark:text-[#2dd4c7] font-semibold'
                  : 'border-transparent text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#273444] dark:hover:text-[#E8EEF5] hover:border-[#DCE3EA] dark:hover:border-[#33485D]'
              }`}
            >
              {tab.icon && (
                <span
                  className={`shrink-0 flex items-center [&>svg]:w-3.5 [&>svg]:h-3.5 ${
                    isActive
                      ? 'text-[#168C83] dark:text-[#2dd4c7]'
                      : 'text-[#8793A1] dark:text-[#8194A8] group-hover:text-[#273444] dark:group-hover:text-[#E8EEF5]'
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
                      ? 'bg-[#F0FDFB] dark:bg-[#05211F] text-[#168C83] dark:text-[#2dd4c7]'
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
