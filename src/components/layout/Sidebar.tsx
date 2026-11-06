import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  WalletCards,
  Users2,
  Landmark,
  ArrowLeftRight,
  Globe2,
  CheckCheck,
  FileSpreadsheet,
  LifeBuoy,
  TrendingUp,
  CheckSquare,
  Package,
  BrainCircuit,
  Sparkles,
  Radar,
  Bot,
  BarChart3,
  Lock,
  X,
  UserCheck,
  MessageSquare,
  FileText,
  Network,
  GitFork,
  Compass,
  Cpu,
  Milestone,
  ShieldCheck,
  Activity,
  PieChart,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ModuleType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Tooltip } from '../common/Tooltip';

export interface SidebarProps {
  activeModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
  pendingAuthorizationsCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export interface NavItem {
  id: ModuleType;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  badge?: number;
  requiredPermission?: string;
  requiredRoles?: string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  pendingAuthorizationsCount,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { hasPermission, hasRole } = useAuth();

  // Escape key closes mobile navigation drawer
  useEffect(() => {
    if (!isMobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const sections: NavSection[] = [
    {
      title: 'Enterprise Showcase',
      items: [
        {
          id: 'showcase',
          label: 'Platform Showcase',
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
          shortcut: '',
        },
      ],
    },
    {
      title: 'Core Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Operations Cockpit',
          icon: <LayoutDashboard className="w-4 h-4" />,
          shortcut: 'F1',
          requiredPermission: 'dashboard:view',
        },
        {
          id: 'accounts',
          label: 'CASA & Term Deposits',
          icon: <WalletCards className="w-4 h-4" />,
          shortcut: 'F2',
          requiredPermission: 'accounts:read',
        },
        {
          id: 'customers',
          label: 'Customer 360 & cKYC',
          icon: <Users2 className="w-4 h-4" />,
          shortcut: 'F3',
          requiredPermission: 'customers:read',
        },
        {
          id: 'onboarding',
          label: 'Onboarding & KYC',
          icon: <UserCheck className="w-4 h-4" />,
          shortcut: 'F4',
        },
        {
          id: 'documents',
          label: 'Document Intelligence',
          icon: <FileText className="w-4 h-4 text-amber-400" />,
          shortcut: 'F5',
          requiredPermission: 'customers:read',
        },
        {
          id: 'products',
          label: 'Banking Products',
          icon: <Package className="w-4 h-4" />,
          shortcut: '',
        },
      ],
    },
    {
      title: 'Relationship & CRM',
      items: [
        {
          id: 'interactions',
          label: 'Interactions',
          icon: <MessageSquare className="w-4 h-4" />,
          shortcut: 'F6',
          requiredPermission: 'customers:read',
        },
        {
          id: 'cases',
          label: 'Service Cases & Grievances',
          icon: <LifeBuoy className="w-4 h-4" />,
          shortcut: '',
          requiredPermission: 'cases:manage',
        },
        {
          id: 'opportunities',
          label: 'Deals & Opportunities',
          icon: <TrendingUp className="w-4 h-4" />,
          shortcut: '',
          requiredPermission: 'opportunities:manage',
        },
        {
          id: 'tasks',
          label: 'Officer Tasks & Follow-ups',
          icon: <CheckSquare className="w-4 h-4" />,
          shortcut: '',
        },
        {
          id: 'intelligence',
          label: 'Relationship Intelligence',
          icon: <BrainCircuit className="w-4 h-4" />,
          shortcut: 'F7',
          requiredPermission: 'intelligence:read',
        },
        {
          id: 'next-best-actions',
          label: 'Next Best Actions',
          icon: <Sparkles className="w-4 h-4" />,
          shortcut: 'F8',
          requiredPermission: 'nba:read',
        },
        {
          id: 'opportunity-radar',
          label: 'Opportunity Radar',
          icon: <Radar className="w-4 h-4" />,
          shortcut: 'F9',
          requiredPermission: 'radar:read',
        },
        {
          id: 'relationship-twin',
          label: 'Relationship Digital Twin',
          icon: <Network className="w-4 h-4 text-violet-400" />,
          shortcut: 'F12',
          requiredPermission: 'intelligence:read',
        },
        {
          id: 'relationship-graph',
          label: 'Relationship Graph',
          icon: <GitFork className="w-4 h-4 text-indigo-400" />,
          shortcut: '',
          requiredPermission: 'customers:read',
        },
        {
          id: 'strategy-simulator',
          label: 'Strategy Simulator',
          icon: <Compass className="w-4 h-4 text-amber-400" />,
          shortcut: '',
          requiredPermission: 'customers:read',
        },
        {
          id: 'agent',
          label: 'Controlled Banking Agent',
          icon: <Cpu className="w-4 h-4 text-purple-400" />,
          shortcut: '',
          requiredPermission: 'customers:read',
        },
        {
          id: 'journeys',
          label: 'Customer Journeys',
          icon: <Milestone className="w-4 h-4 text-emerald-400" />,
          shortcut: '',
          requiredPermission: 'customers:read',
        },
        {
          id: 'groups',
          label: 'Household & Groups 360',
          icon: <Users2 className="w-4 h-4 text-cyan-400" />,
          shortcut: '',
          requiredPermission: 'customers:read',
        },
        {
          id: 'copilot',
          label: 'Banking Copilot',
          icon: <Bot className="w-4 h-4 text-emerald-400" />,
          shortcut: 'F10',
        },
        {
          id: 'analytics',
          label: 'Management Intelligence',
          icon: <BarChart3 className="w-4 h-4 text-cyan-400" />,
          shortcut: 'F11',
          requiredPermission: 'analytics:read',
        },
        {
          id: 'portfolio-intelligence',
          label: 'Portfolio Intelligence',
          icon: <PieChart className="w-4 h-4 text-blue-400" />,
          shortcut: '',
          requiredPermission: 'portfolio:view',
        },
      ],
    },
    {
      title: 'Credit & Assets',
      items: [
        {
          id: 'lending',
          label: 'Lending & Advances',
          icon: <Landmark className="w-4 h-4" />,
          shortcut: 'F4',
          requiredPermission: 'loans:read',
        },
      ],
    },
    {
      title: 'Settlement & Global',
      items: [
        {
          id: 'payments',
          label: 'Payments Switch & CTS',
          icon: <ArrowLeftRight className="w-4 h-4" />,
          shortcut: 'F5',
          requiredRoles: ['ADMINISTRATOR', 'BRANCH_MANAGER', 'OPERATIONS', 'SERVICE_AGENT'],
        },
        {
          id: 'trade-finance',
          label: 'Trade Finance & Forex',
          icon: <Globe2 className="w-4 h-4" />,
          shortcut: 'F6',
          requiredRoles: ['ADMINISTRATOR', 'BRANCH_MANAGER', 'OPERATIONS', 'RELATIONSHIP_MANAGER'],
        },
      ],
    },
    {
      title: 'Governance & Risk',
      items: [
        {
          id: 'maker-checker',
          label: 'Maker-Checker Queue',
          icon: <CheckCheck className="w-4 h-4" />,
          shortcut: 'F7',
          badge: pendingAuthorizationsCount,
        },
        {
          id: 'audit-regulatory',
          label: 'Audit & Regulatory',
          icon: <FileSpreadsheet className="w-4 h-4" />,
          shortcut: 'F8',
          requiredPermission: 'audit:read',
          requiredRoles: ['ADMINISTRATOR', 'BRANCH_MANAGER', 'OPERATIONS', 'ANALYST'],
        },
        {
          id: 'governance',
          label: 'Trust & Governance',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
          shortcut: 'F12',
          requiredRoles: [
            'ADMINISTRATOR',
            'COMPLIANCE_OFFICER',
            'BRANCH_OPS_HEAD',
            'RELATIONSHIP_MANAGER',
            'AUDITOR',
            'BRANCH_MANAGER',
          ],
        },
        {
          id: 'operations',
          label: 'Banking Operations',
          icon: <Activity className="w-4 h-4 text-cyan-400" />,
          shortcut: '',
          requiredRoles: [
            'ADMINISTRATOR',
            'COMPLIANCE_OFFICER',
            'BRANCH_OPS_HEAD',
            'MAKER_L2',
            'RELATIONSHIP_MANAGER',
            'AUDITOR',
            'BRANCH_MANAGER',
            'OPERATIONS',
          ],
        },
        {
          id: 'integrations',
          label: 'Integration & Gateway',
          icon: <Network className="w-4 h-4 text-indigo-400" />,
          shortcut: '',
          requiredRoles: [
            'ADMINISTRATOR',
            'COMPLIANCE_OFFICER',
            'BRANCH_OPS_HEAD',
            'RELATIONSHIP_MANAGER',
            'AUDITOR',
            'BRANCH_MANAGER',
            'OPERATIONS',
          ],
        },
        {
          id: 'admin',
          label: 'Enterprise Admin',
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
          shortcut: '',
          requiredRoles: ['ADMINISTRATOR'],
        },
      ],
    },
  ];

  const renderNavButton = (item: NavItem, isCollapsedMode: boolean) => {
    const isActive = activeModule === item.id;
    const isPermitted =
      (!item.requiredPermission || hasPermission(item.requiredPermission)) &&
      (!item.requiredRoles || hasRole(...item.requiredRoles));

    const buttonContent = (
      <button
        key={item.id}
        onClick={() => {
          onSelectModule(item.id);
          if (onCloseMobile) onCloseMobile();
        }}
        disabled={!isPermitted}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={`w-full flex items-center ${
          isCollapsedMode ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
        } text-xs rounded-xs group cursor-pointer transition-colors duration-120 motion-interactive ${
          isActive
            ? 'bg-slate-800 text-white font-semibold border-l-3 border-[#087F8C]'
            : isPermitted
            ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-l-3 border-transparent'
            : 'text-slate-500 opacity-60 cursor-not-allowed border-l-3 border-transparent'
        }`}
      >
        <div className={`flex items-center ${isCollapsedMode ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
          <span
            className={`shrink-0 ${
              isActive
                ? 'text-[#2dd4bf]'
                : isPermitted
                ? 'text-slate-400 group-hover:text-slate-200'
                : 'text-slate-500'
            }`}
          >
            {item.icon}
          </span>
          {!isCollapsedMode && <span className="truncate">{item.label}</span>}
        </div>

        {!isCollapsedMode && (
          <div className="flex items-center gap-1.5 shrink-0">
            {!isPermitted && (
              <span title="Requires role entitlement elevation">
                <Lock className="w-3 h-3 text-slate-500" />
              </span>
            )}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="font-mono text-[10px] font-bold bg-[#B45309] text-white px-1.5 py-0.2 rounded-xs">
                {item.badge}
              </span>
            )}
            {item.shortcut && (
              <span className="hidden group-hover:inline-block font-mono text-[10px] text-slate-400 bg-slate-800 px-1 py-0.2 rounded-xs">
                {item.shortcut}
              </span>
            )}
          </div>
        )}

        {isCollapsedMode && item.badge !== undefined && item.badge > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#B45309]" />
        )}
      </button>
    );

    if (isCollapsedMode) {
      const tooltipText = `${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}${
        item.badge ? ` • ${item.badge} pending` : ''
      }${!isPermitted ? ' [Restricted]' : ''}`;

      return (
        <Tooltip key={item.id} content={tooltipText} position="right" delayMs={50}>
          <div className="relative w-full flex justify-center my-0.5">
            {buttonContent}
          </div>
        </Tooltip>
      );
    }

    return buttonContent;
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-40 lg:hidden motion-fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        aria-label="Banking Modules Navigation"
        className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none z-50 transition-[width] duration-200 ease-in-out ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl flex h-full motion-drawer-left'
            : `hidden lg:flex ${isCollapsed ? 'w-16' : 'w-64'} min-h-[calc(100vh-80px)]`
        }`}
      >
        {/* Mobile Header (Shown only on small screens) */}
        <div className="lg:hidden flex items-center justify-between px-3.5 py-3 border-b border-slate-800 bg-[#0b1626] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#087F8C] text-white flex items-center justify-center font-bold text-xs font-mono">
              CV
            </div>
            <span className="font-bold text-xs text-white uppercase tracking-wider">
              Banking Modules
            </span>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Close navigation (Escape)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Desktop Collapse / Expand Header Toolbar */}
        <div className="hidden lg:flex items-center justify-between px-3 py-2.5 border-b border-slate-800 bg-[#0b1626] shrink-0">
          {!isCollapsed ? (
            <>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Navigation Rail
              </span>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                  title="Collapse sidebar rail (Ctrl+B)"
                  aria-label="Collapse sidebar rail"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full flex justify-center">
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                  title="Expand sidebar rail (Ctrl+B)"
                  aria-label="Expand sidebar rail"
                >
                  <ChevronRight className="w-4 h-4 text-teal-400" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 py-2 px-1.5 space-y-3 overflow-y-auto scrollbar-thin">
          {sections.map((section, sIdx) => (
            <div key={section.title} className={isCollapsed ? 'space-y-0.5' : 'space-y-1'}>
              {!isCollapsed ? (
                <div className="px-2.5 pt-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {section.title}
                </div>
              ) : (
                sIdx > 0 && <div className="my-1 border-t border-slate-800/80 mx-2" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) =>
                  renderNavButton(item, isCollapsed && !isMobileOpen)
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Bottom Status Pill */}
        {!isCollapsed ? (
          <div className="hidden lg:flex items-center justify-between px-3 py-2 border-t border-slate-800 bg-[#0b1626] text-[11px] text-slate-400">
            <span className="truncate">COREvia v2.0</span>
            <span className="font-mono text-[10px] text-teal-400">IST READY</span>
          </div>
        ) : (
          <div className="hidden lg:flex justify-center py-2 border-t border-slate-800 bg-[#0b1626] text-[10px] font-mono text-teal-400">
            •
          </div>
        )}
      </aside>
    </>
  );
};
