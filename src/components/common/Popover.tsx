import React, { useState, useRef, useEffect, useId } from 'react';
import { zIndex } from './tokens';

export interface PopoverProps {
  trigger: React.ReactElement;
  content: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  content,
  align = 'left',
  isOpen: controlledIsOpen,
  onOpenChange,
  className = '',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (value: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(value);
    }
    onOpenChange?.(value);
  };

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

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      {React.cloneElement(trigger, {
        onClick: (e: React.MouseEvent) => {
          trigger.props.onClick?.(e);
          setIsOpen(!isOpen);
        },
        'aria-expanded': isOpen,
        'aria-controls': isOpen ? popoverId : undefined,
      })}

      {isOpen && (
        <div
          id={popoverId}
          role="dialog"
          style={{ zIndex: zIndex.popover }}
          className={`absolute top-full mt-1.5 p-3 bg-white border border-[#CBD5E1] rounded-sm shadow-md animate-in fade-in duration-100 ${alignClasses[align]} ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

