import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { zIndex } from './tokens';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type DrawerPosition = 'right' | 'left';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  referenceId?: string;
  position?: DrawerPosition;
  size?: DrawerSize;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  id?: string;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  referenceId,
  position = 'right',
  size = 'md',
  children,
  footerActions,
  id: customId,
  className = '',
}) => {
  const generatedId = useId();
  const id = customId || generatedId;
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;

      const timer = setTimeout(() => {
        if (drawerRef.current) {
          const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'Tab' && drawerRef.current) {
          const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        if (previouslyFocusedRef.current) {
          previouslyFocusedRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses: Record<DrawerSize, string> = {
    sm: 'w-full sm:w-[380px]',
    md: 'w-full sm:w-[480px]',
    lg: 'w-full sm:w-[580px]',
    xl: 'w-full sm:w-[720px]',
    '2xl': 'w-full sm:w-[880px]',
    full: 'w-full',
  };

  const positionClasses: Record<DrawerPosition, string> = {
    right: 'inset-y-0 right-0 motion-drawer-right',
    left: 'inset-y-0 left-0 motion-drawer-left',
  };

  return (
    <div
      id={id}
      style={{ zIndex: zIndex.drawer }}
      className="fixed inset-0 overflow-hidden select-none"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] motion-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        {/* Slide-over Container */}
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={subtitle ? descId : undefined}
          className={`relative ${positionClasses[position]} ${sizeClasses[size]} max-w-full bg-white border-l border-[#CBD5E1] shadow-2xl flex flex-col h-full overflow-hidden ${className}`}
        >
          {/* Institutional Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <h2
                  id={titleId}
                  className="text-xs sm:text-sm font-bold text-[#172033] tracking-tight uppercase truncate font-sans"
                >
                  {title}
                </h2>
                {referenceId && (
                  <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded-xs border border-[#CBD5E1] shrink-0">
                    {referenceId}
                  </span>
                )}
              </div>
              {subtitle && (
                <p id={descId} className="text-[11px] text-[#64748B] mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-[#64748B] hover:text-[#172033] p-1.5 rounded-xs hover:bg-[#E2E8F0] transition-colors shrink-0 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#087F8C]"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-xs text-[#172033] space-y-4">
            {children}
          </div>

          {/* Footer Actions */}
          {footerActions && (
            <div className="flex items-center justify-end gap-2 px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
              {footerActions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

