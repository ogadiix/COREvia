import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';

export interface ThemeSwitcherProps {
  variant?: 'dropdown' | 'segmented' | 'compact';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light Theme', icon: <Sun className="w-3.5 h-3.5" /> },
    { mode: 'dark', label: 'Dark Theme', icon: <Moon className="w-3.5 h-3.5" /> },
    { mode: 'system', label: 'System Theme', icon: <Monitor className="w-3.5 h-3.5" /> },
  ];

  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Theme selection"
        className={`inline-flex items-center p-0.5 rounded-lg bg-[#EDF1F5] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] ${className}`}
      >
        {options.map((opt) => {
          const isActive = theme === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setTheme(opt.mode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#1C3045] text-[#168C83] dark:text-[#2dd4c7] shadow-xs'
                  : 'text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#273444] dark:hover:text-[#E8EEF5]'
              }`}
            >
              {opt.icon}
              <span className="capitalize">{opt.mode}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact icon button with dropdown
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Toggle color theme. Current theme: ${theme} (${resolvedTheme})`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="p-1.5 rounded-md text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#273444] dark:hover:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#192B3D] border border-transparent hover:border-[#DCE3EA] dark:hover:border-[#33485D] transition-colors cursor-pointer"
        title={`Theme: ${theme.toUpperCase()} (${resolvedTheme})`}
      >
        {theme === 'system' ? (
          <Monitor className="w-4 h-4 text-[#D9A441]" />
        ) : isDark ? (
          <Moon className="w-4 h-4 text-[#168C83]" />
        ) : (
          <Sun className="w-4 h-4 text-[#D9A441]" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Theme options"
          className="absolute right-0 mt-1.5 w-40 rounded-lg shadow-lg bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] py-1 z-50 motion-dropdown"
        >
          <div className="px-3 py-1.5 border-b border-[#DCE3EA] dark:border-[#26394C] mb-1">
            <p className="text-[10px] font-semibold tracking-wider uppercase text-[#8793A1] dark:text-[#8194A8]">
              Appearance
            </p>
          </div>
          {options.map((opt) => {
            const isSelected = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  setTheme(opt.mode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#F0FDFB] dark:bg-[#192B3D] text-[#168C83] dark:text-[#2dd4c7] font-semibold'
                    : 'text-[#273444] dark:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#1C3045]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={isSelected ? 'text-[#168C83] dark:text-[#2dd4c7]' : 'text-[#8793A1] dark:text-[#8194A8]'}>
                    {opt.icon}
                  </span>
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#168C83] dark:text-[#2dd4c7]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

