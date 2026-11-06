import React, { useEffect, useRef } from 'react';
import { useCopilot } from '../../context/CopilotContext';
import { CopilotWorkspace } from './CopilotWorkspace';
import { zIndex } from '../common/tokens';

interface CopilotDrawerProps {
  onNavigate?: (path: string) => void;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ onNavigate }) => {
  const { isDrawerOpen, closeDrawer } = useCopilot();
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isDrawerOpen) {
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
          closeDrawer();
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
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  return (
    <div
      style={{ zIndex: zIndex.drawer }}
      className="fixed inset-0 overflow-hidden select-none"
    >
      {/* Semi-transparent backdrop */}
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] motion-fade-in"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="COREvia Banking Copilot"
          className="w-full sm:w-[500px] md:w-[560px] max-w-full bg-[#F5F7FA] border-l border-[#CBD5E1] shadow-2xl flex flex-col h-full overflow-hidden motion-drawer-right"
        >
          <CopilotWorkspace
            isDrawer={true}
            onClose={closeDrawer}
            onNavigate={(path) => {
              closeDrawer();
              if (onNavigate) {
                onNavigate(path);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
