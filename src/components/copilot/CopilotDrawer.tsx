import React, { useEffect } from 'react';
import { useCopilot } from '../../context/CopilotContext';
import { CopilotWorkspace } from './CopilotWorkspace';
import { Bot, X } from 'lucide-react';

interface CopilotDrawerProps {
  onNavigate?: (path: string) => void;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ onNavigate }) => {
  const { isDrawerOpen, closeDrawer } = useCopilot();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Semi-transparent backdrop */}
      <div
        onClick={closeDrawer}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
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
