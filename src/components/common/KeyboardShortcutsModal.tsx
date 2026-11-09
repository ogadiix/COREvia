import React from 'react';
import { Keyboard, Command, Compass, Search, Sparkles, X } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  badge?: string;
}

interface ShortcutCategory {
  title: string;
  icon: React.ReactNode;
  shortcuts: ShortcutItem[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const cmdKey = isMac ? '⌘' : 'Ctrl';

  const categories: ShortcutCategory[] = [
    {
      title: 'Global & Navigation Shortcuts',
      icon: <Command className="w-4 h-4 text-[#168C83] dark:text-[#2dd4bf]" />,
      shortcuts: [
        {
          keys: [cmdKey, 'K'],
          description: 'Global Search (Accounts, Loans, Customers, CIF, PAN)',
          badge: 'Primary',
        },
        {
          keys: [cmdKey, '/'],
          description: 'Focus Global Search Input',
        },
        {
          keys: [cmdKey, 'B'],
          description: 'Toggle Navigation Sidebar Rail (Expand / Collapse)',
        },
        {
          keys: [cmdKey, 'J'],
          description: 'Toggle Banking Copilot Assistant Drawer',
          badge: 'Copilot',
        },
        {
          keys: ['?'],
          description: 'Toggle this Keyboard Shortcuts Reference Modal',
        },
        {
          keys: ['Esc'],
          description: 'Dismiss Active Overlay, Drawer, Dialog, or Dropdown',
        },
      ],
    },
    {
      title: 'Banking Terminal Fast Keys (Function Keys)',
      icon: <Keyboard className="w-4 h-4 text-[#D9A441]" />,
      shortcuts: [
        { keys: ['F1'], description: 'Jump to Operations Cockpit (Executive Dashboard)' },
        { keys: ['F2'], description: 'Jump to CASA & Term Deposits (Accounts Workspace)' },
        { keys: ['F3'], description: 'Jump to Customer 360 & cKYC Registry' },
        { keys: ['F4'], description: 'Jump to Lending & Credit Advances' },
        { keys: ['F5'], description: 'Jump to Payments Switch & Clearing (CTS)' },
        { keys: ['F6'], description: 'Jump to Trade Finance & Forex Operations' },
        { keys: ['F7'], description: 'Jump to Maker-Checker Dual-Control Authorization Queue' },
        { keys: ['F8'], description: 'Jump to Next Best Action Engine' },
        { keys: ['F9'], description: 'Jump to Customer Opportunity Radar' },
        { keys: ['F10'], description: 'Open Embedded Banking Copilot Assistant' },
      ],
    },
    {
      title: 'Search, Menus & Form Interactions',
      icon: <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      shortcuts: [
        { keys: ['↓'], description: 'Highlight next item in search results or dropdown menus' },
        { keys: ['↑'], description: 'Highlight previous item in search results or dropdown menus' },
        { keys: ['Enter'], description: 'Select highlighted item or submit active dialog form' },
        { keys: ['Tab'], description: 'Cycle focus to the next interactive banking element' },
        { keys: ['Shift', 'Tab'], description: 'Cycle focus to the previous interactive banking element' },
        { keys: ['Space'], description: 'Activate focused button or toggle checkbox switch' },
      ],
    },
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Workstation Keyboard Shortcuts"
      subtitle="Universal institutional keybindings for accelerated core banking operations"
      referenceId="CORE-KB-01"
      size="2xl"
      footerActions={
        <Button variant="outline" size="sm" onClick={onClose}>
          Close Guide (Esc)
        </Button>
      }
    >
      <div className="space-y-5">
        {categories.map((category, catIdx) => (
          <div key={catIdx} className="space-y-2">
            <div className="flex items-center gap-2 pb-1 border-b border-[#DCE3EA] dark:border-[#26394C]">
              {category.icon}
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#273444] dark:text-[#E8EEF5]">
                {category.title}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {category.shortcuts.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 rounded-xs bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#26394C] text-xs hover:border-[#168C83]/40 transition-colors"
                >
                  <span className="text-[#5D6B7B] dark:text-[#A9BACB] sm:pr-2 leading-tight">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 self-start sm:self-auto">
                    {shortcut.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        <kbd className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-xs bg-white dark:bg-[#162638] text-[#273444] dark:text-[#E8EEF5] border border-[#CBD5E1] dark:border-[#33485D] shadow-2xs">
                          {k}
                        </kbd>
                        {kIdx < shortcut.keys.length - 1 && (
                          <span className="text-[10px] text-[#8793A1]">+</span>
                        )}
                      </React.Fragment>
                    ))}
                    {shortcut.badge && (
                      <span className="ml-1 text-[9px] font-mono px-1 py-0.2 rounded-xs bg-[#168C83]/15 text-[#168C83] dark:text-[#2dd4bf] font-bold uppercase">
                        {shortcut.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
};

