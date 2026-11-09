import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
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
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  // Find selectable (non-divider, non-disabled) item indices
  const selectableIndices = items
    .map((item, idx) => (!item.divider && !item.disabled ? idx : -1))
    .filter((idx) => idx !== -1);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    // Return focus to trigger
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          if (selectableIndices.length === 0) return -1;
          const currentPos = selectableIndices.indexOf(prev);
          if (currentPos === -1 || currentPos === selectableIndices.length - 1) {
            return selectableIndices[0];
          }
          return selectableIndices[currentPos + 1];
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          if (selectableIndices.length === 0) return -1;
          const currentPos = selectableIndices.indexOf(prev);
          if (currentPos <= 0) {
            return selectableIndices[selectableIndices.length - 1];
          }
          return selectableIndices[currentPos - 1];
        });
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (selectableIndices.length > 0) setHighlightedIndex(selectableIndices[0]);
      } else if (e.key === 'End') {
        e.preventDefault();
        if (selectableIndices.length > 0) {
          setHighlightedIndex(selectableIndices[selectableIndices.length - 1]);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (highlightedIndex >= 0 && items[highlightedIndex] && !items[highlightedIndex].disabled) {
          e.preventDefault();
          items[highlightedIndex].onClick?.();
          closeDropdown();
        }
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
  }, [isOpen, closeDropdown, highlightedIndex, items, selectableIndices]);

  // Focus the highlighted button when highlightedIndex changes
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.focus();
    }
  }, [isOpen, highlightedIndex]);

  const toggleDropdown = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && selectableIndices.length > 0) {
        setHighlightedIndex(selectableIndices[0]);
      } else {
        setHighlightedIndex(-1);
      }
      return next;
    });
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {React.cloneElement(trigger, {
        ref: (node: HTMLElement | null) => {
          triggerRef.current = node;
          const { ref } = trigger as any;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
        },
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
          aria-orientation="vertical"
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
                  role="separator"
                  className="my-1 border-t border-[#DCE3EA] dark:border-[#26394C]"
                />
              );
            }

            const isHighlighted = highlightedIndex === idx;

            return (
              <button
                key={item.id || `item-${idx}`}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                role="menuitem"
                tabIndex={isHighlighted ? 0 : -1}
                disabled={item.disabled}
                onMouseEnter={() => {
                  if (!item.disabled) setHighlightedIndex(idx);
                }}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    closeDropdown();
                  }
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${focusRingClass} ${
                  item.isDanger
                    ? isHighlighted
                      ? 'bg-[#FEF2F2] dark:bg-[#370B0B] text-[#B42318] dark:text-[#EF4444]'
                      : 'text-[#B42318] dark:text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#370B0B]'
                    : isHighlighted
                    ? 'bg-[#EDF1F5] dark:bg-[#192B3D] text-[#273444] dark:text-[#E8EEF5]'
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
