import React, { useState, useRef, useEffect, useId } from 'react';
import { zIndex, focusRingClass } from './tokens';

export interface DropdownItem {
  id?: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isDanger?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactElement;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {React.cloneElement(trigger, {
        onClick: (e: React.MouseEvent) => {
          trigger.props.onClick?.(e);
          toggleDropdown();
        },
        'aria-haspopup': 'menu',
        'aria-expanded': isOpen,
        'aria-controls': isOpen ? menuId : undefined,
      })}

      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          style={{ zIndex: zIndex.dropdown }}
          className={`absolute top-full mt-1 min-w-44 py-1 bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xs shadow-md motion-dropdown text-[#273444] dark:text-[#E8EEF5] ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${className}`}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return (
                <div
                  key={`divider-${idx}`}
                  className="my-1 border-t border-[#DCE3EA] dark:border-[#26394C]"
                />
              );
            }

            return (
              <button
                key={item.id || `item-${idx}`}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    setIsOpen(false);
                  }
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${focusRingClass} ${
                  item.isDanger
                    ? 'text-[#B42318] dark:text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#370B0B]'
                    : 'text-[#273444] dark:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#192B3D]'
                }`}
              >
                {item.icon && (
                  <span className="shrink-0 flex items-center [&>svg]:w-3.5 [&>svg]:h-3.5">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
