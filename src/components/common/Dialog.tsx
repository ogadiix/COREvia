import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import { zIndex } from './tokens';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  referenceId?: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  size?: DialogSize;
  maxWidth?: DialogSize; // Backward compatibility alias
  id?: string;
  isDestructive?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  referenceId,
  children,
  footerActions,
  size,
  maxWidth = 'xl',
  id: customId,
}) => {
  const generatedId = useId();
  const id = customId || generatedId;
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  const effectiveSize = size || maxWidth;
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Store previously focused element and trap focus
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;

      // Focus first focusable element inside modal
      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
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
        } else if (e.key === 'Tab' && dialogRef.current) {
          // Trap Tab key inside dialog
          const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];

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

  const sizeClasses: Record<DialogSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-[96vw]',
  };

  return (
    <div
      id={id}
      style={{ zIndex: zIndex.modal }}
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-[1px] motion-fade-in select-none overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Window */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? descId : undefined}
        className={`relative z-10 w-full ${sizeClasses[effectiveSize]} bg-white border border-[#CBD5E1] rounded-sm shadow-lg flex flex-col max-h-[92vh] overflow-hidden my-auto motion-dialog-enter`}
      >
        {/* Institutional Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="min-w-0 pr-3">
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
            className="text-[#64748B] hover:text-[#172033] p-1 rounded-xs hover:bg-[#E2E8F0] transition-colors shrink-0 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#087F8C]"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto text-xs text-[#172033] space-y-3">
          {children}
        </div>

        {/* Footer Actions */}
        {footerActions && (
          <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
};

// Modal alias
export const Modal = Dialog;
export type { DialogProps as ModalProps };

