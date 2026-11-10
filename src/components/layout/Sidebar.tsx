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
  LogOut,
  Building2,
  Layers,
} from 'lucide-react';
import { ModuleType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Tooltip } from '../common/Tooltip';
import { BANK_META } from '../../data/mockIndianBankingData';

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
  shortcut?: string;
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
  const { hasPermission, hasRole, user, logout } = useAuth();

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

  // Real banking business workflows navigation sections
  const sections: NavSection[] = [
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
          id: 'customers',
          label: 'Customer 360 & cKYC',
          icon: <Users2 className="w-4 h-4" />,
          shortcut: 'F2',
          requiredPermission: 'customers:read',
        },
        {
          id: 'accounts',
          label: 'CASA & Term Deposits',
          icon: <WalletCards className="w-4 h-4" />,
          shortcut: 'F3',
          requiredPermission: 'accounts:read',
        },
        {
          id: 'onboarding',
          label: 'Digital Onboarding & KYC',
          icon: <UserCheck className="w-4 h-4" />,
          requiredPermission: 'customers:read',
        },
        {
          id: 'documents',
          label: 'Document Intelligence Vault',
          icon: <FileText className="w-4 h-4" />,
          requiredPermission: 'customers:read',
        },
        {
          id: 'products',
          label: 'Banking Products Catalog',
          icon: <Package className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'Relationship Management',
      items: [
        {
          id: 'interactions',
          label: 'Customer Interaction Hub',
          icon: <MessageSquare className="w-4 h-4" />,
          requiredPermission: 'customers:read',
        },
        {
          id: 'opportunities',
          label: 'Deals & Opportunities',
          icon: <TrendingUp className="w-4 h-4" />,
          requiredPermission: 'opportunities:manage',
        },
        {
          id: 'cases',
          label: 'Service Cases & Grievances',
          icon: <LifeBuoy className="w-4 h-4" />,
          requiredPermission: 'cases:manage',
        },
        {
          id: 'tasks',
          label: 'Officer Tasks & Follow-ups',
          icon: <CheckSquare className="w-4 h-4" />,
        },
        {
          id: 'groups',
          label: 'Household & Groups 360',
          icon: <Users2 className="w-4 h-4" />,
          requiredPermission: 'customers:read',
        },
        {
          id: 'journeys',
          label: 'Customer Journeys',
          icon: <Milestone className="w-4 h-4" />,
          requiredPermission: 'customers:read',
        },
      ],
    },
    {
      title: 'Relationship Intelligence',
      items: [
        {
          id: 'intelligence',
          label: 'Relationship Intelligence (RI-v1)',
          icon: <BrainCircuit className="w-4 h-4" />,
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
          icon: <Network className="w-4 h-4" />,
          requiredPermission: 'intelligence:read',
        },
        {
          id: 'relationship-graph',
          label: 'Relationship Graph Intelligence',
          icon: <GitFork className="w-4 h-4" />,
          requiredPermission: 'customers:read',
        },
        {
          id: 'strategy-simulator',
          label: 'Strategy Simulator & Sandbox',
          icon: <Compass className="w-4 h-4" />,
          requiredPermission: 'customers:read',
        },
        {
          id: 'agent',
          label: 'Controlled Banking Agent',
          icon: <Cpu className="w-4 h-4" />,
          requiredPermission: 'customers:read',
        },
        {
          id: 'copilot',
          label: 'Banking Copilot',
          icon: <Bot className="w-4 h-4" />,
          shortcut: 'F10',
        },
        {
          id: 'portfolio-intelligence',
          label: 'Portfolio Intelligence & Risk',
          icon: <PieChart className="w-4 h-4" />,
          requiredPermission: 'portfolio:view',
        },
        {
          id: 'analytics',
          label: 'Management Intelligence',
          icon: <BarChart3 className="w-4 h-4" />,
          shortcut: 'F11',
          requiredPermission: 'analytics:read',
        },
      ],
    },
    {
      title: 'Credit & Transactions',
      items: [
        {
          id: 'lending',
          label: 'Lending & Credit Advances',
          icon: <Landmark className="w-4 h-4" />,
          shortcut: 'F4',
          requiredPermission: 'loans:read',
        },
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
      title: 'Governance & Platform',
      items: [
        {
          id: 'maker-checker',
          label: 'Maker-Checker Queue',
          icon: <CheckCheck className="w-4 h-4" />,
          shortcut: 'F7',
          badge: pendingAuthorizationsCount,
        },
        {
          id: 'operations',
          label: 'Banking Operations Workspace',
          icon: <Activity className="w-4 h-4" />,
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
          id: 'governance',
          label: 'Trust & Governance Center',
          icon: <ShieldCheck className="w-4 h-4" />,
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
          id: 'audit-regulatory',
          label: 'Statutory Audit & Logs',
          icon: <FileSpreadsheet className="w-4 h-4" />,
          requiredPermission: 'audit:read',
          requiredRoles: ['ADMINISTRATOR', 'BRANCH_MANAGER', 'OPERATIONS', 'ANALYST'],
        },
        {
          id: 'integrations',
          label: 'Enterprise Integration & Gateway',
          icon: <Network className="w-4 h-4" />,
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
          label: 'Enterprise Administration',
          icon: <ShieldAlert className="w-4 h-4" />,
          requiredRoles: ['ADMINISTRATOR'],
        },
        {
          id: 'showcase',
          label: 'Platform Architecture Showcase',
          icon: <Sparkles className="w-4 h-4" />,
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
        data-module={item.id}
        aria-label={`${item.label} (${item.id})`}
        aria-current={isActive ? 'page' : undefined}
        className={`w-full relative flex items-center ${
          isCollapsedMode ? 'justify-center p-2.5 h-10' : 'justify-between px-3 py-2 min-h-9'
        } text-xs rounded-sm group cursor-pointer transition-all duration-150 motion-interactive ${
          isActive
            ? 'bg-[#0c1c2e] dark:bg-[#162638] text-white font-semibold border-l-[3px] border-[#168C83] dark:border-[#2dd4bf] shadow-xs'
            : isPermitted
            ? 'text-slate-300 dark:text-[#A9BACB] hover:bg-[#0c1c2e]/60 dark:hover:bg-[#162638]/70 hover:text-white border-l-[3px] border-transparent'
            : 'text-slate-500 dark:text-slate-600 opacity-60 cursor-not-allowed border-l-[3px] border-transparent'
        }`}
      >
        <div className={`flex items-center ${isCollapsedMode ? 'justify-center' : 'gap-2.5 min-w-0'}`}>
          <span
            className={`shrink-0 transition-colors ${
              isActive
                ? 'text-[#2dd4bf]'
                : isPermitted
                ? 'text-slate-400 dark:text-[#8194A8] group-hover:text-slate-200 dark:group-hover:text-white'
                : 'text-slate-500 dark:text-slate-600'
            }`}
          >
            {item.icon}
          </span>
          {!isCollapsedMode && <span className="truncate">{item.label}</span>}
        </div>

        {!isCollapsedMode && (
          <div className="flex items-center gap-1.5 shrink-0">
            {!isPermitted && (
              <span title="Restricted: Requires elevated role entitlement">
                <Lock className="w-3 h-3 text-slate-500 dark:text-slate-600" />
              </span>
            )}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="font-mono text-[10px] font-bold bg-[#B45309] dark:bg-[#F59E0B] text-white dark:text-[#080F19] px-1.5 py-0.2 rounded-xs animate-pulse">
                {item.badge}
              </span>
            )}
            {item.shortcut && (
              <span className="hidden group-hover:inline-block font-mono text-[10px] text-slate-400 dark:text-[#8194A8] bg-[#0c1c2e] dark:bg-[#080F19] px-1 py-0.2 rounded-xs border border-slate-700 dark:border-[#26394C]">
                {item.shortcut}
              </span>
            )}
          </div>
        )}

        {isCollapsedMode && item.badge !== undefined && item.badge > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F59E0B] ring-2 ring-[#142C45] dark:ring-[#101C2A] animate-pulse" />
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
      {/* Mobile Navigation Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden motion-fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        aria-label="Banking Modules Navigation"
        className={`bg-[#142C45] dark:bg-[#101C2A] text-slate-300 dark:text-[#A9BACB] flex flex-col shrink-0 border-r border-[#101C2A] dark:border-[#33485D] select-none z-50 transition-[width] duration-200 ease-in-out ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl flex h-full motion-drawer-left'
            : `hidden lg:flex ${isCollapsed ? 'w-18' : 'w-64'} min-h-[calc(100vh-80px)]`
        }`}
      >
        {/* =====================================================================
            1. SIDEBAR BRAND HEADER & COLLAPSE CONTROLLER
            ===================================================================== */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-[#101C2A] dark:border-[#26394C] bg-[#0c1c2e] dark:bg-[#080F19] shrink-0">
          {!isCollapsed || isMobileOpen ? (
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-sm bg-[#168C83] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-[#168C83]/50 shrink-0">
                  <Landmark className="w-4 h-4 text-[#D9A441]" />
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white tracking-tight font-sans truncate">
                      COREvia
                    </span>
                    <span className="text-[9px] font-mono font-semibold px-1 py-0.2 bg-[#168C83]/30 text-[#2dd4bf] rounded-xs border border-[#168C83]/40">
                      CRM
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-[#8194A8] font-mono tracking-wider uppercase block truncate">
                    Scheduled Banking
                  </span>
                </div>
              </div>

              {/* Mobile Close Button / Desktop Collapse Trigger */}
              {isMobileOpen ? (
                <button
                  onClick={onCloseMobile}
                  className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-[#162638] cursor-pointer"
                  title="Close navigation (Escape)"
                  aria-label="Close navigation"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                onToggleCollapse && (
                  <button
                    onClick={onToggleCollapse}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-[#162638] cursor-pointer transition-colors"
                    title="Collapse sidebar rail (Ctrl+B)"
                    aria-label="Collapse sidebar rail"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          ) : (
            /* Collapsed Mode Monogram & Expand Trigger */
            <div className="w-full flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-sm bg-[#168C83] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-[#168C83]/50 cursor-pointer"
                onClick={onToggleCollapse}
                title="Expand navigation rail (Ctrl+B)"
              >
                <Landmark className="w-4 h-4 text-[#D9A441]" />
              </div>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-[#162638] cursor-pointer transition-colors"
                  title="Expand sidebar rail (Ctrl+B)"
                  aria-label="Expand sidebar rail"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#2dd4bf]" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* =====================================================================
            2. SCROLLABLE NAVIGATION SECTIONS
            ===================================================================== */}
        <div className="flex-1 py-2 px-1.5 space-y-3 overflow-y-auto scrollbar-thin">
          {sections.map((section, sIdx) => (
            <div key={section.title} className={isCollapsed && !isMobileOpen ? 'space-y-0.5' : 'space-y-1'}>
              {!isCollapsed || isMobileOpen ? (
                <div className="px-2.5 pt-1.5 text-[10px] uppercase font-bold tracking-wider text-[#D9A441] dark:text-[#D9A441] flex items-center justify-between">
                  <span>{section.title}</span>
                  <span className="text-[9px] font-mono text-slate-500 font-normal">
                    {section.items.length}
                  </span>
                </div>
              ) : (
                sIdx > 0 && <div className="my-1.5 border-t border-slate-700/60 dark:border-[#26394C] mx-2" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) =>
                  renderNavButton(item, isCollapsed && !isMobileOpen)
                )}
              </div>
            </div>
          ))}
        </div>

        {/* =====================================================================
            3. BUILT-IN OFFICER PROFILE & TELEMETRY FOOTER
            ===================================================================== */}
        <div className="p-2 border-t border-[#101C2A] dark:border-[#26394C] bg-[#0c1c2e] dark:bg-[#080F19] shrink-0">
          {!isCollapsed || isMobileOpen ? (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-sm bg-[#142C45]/80 dark:bg-[#101C2A] border border-slate-700/60 dark:border-[#26394C]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-sm bg-[#168C83] text-white flex items-center justify-center font-bold text-xs font-mono">
                    {user?.name
                      ? user.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'CV'}
                  </div>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0c1c2e] dark:ring-[#080F19] animate-pulse"
                    title="Terminal session online"
                  />
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="text-xs font-semibold text-white truncate">
                    {user?.name || BANK_META.systemTerminal.workstationUser}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-mono text-[#2dd4bf] truncate font-medium">
                      {user?.employeeId || BANK_META.systemTerminal.employeeId}
                    </span>
                    <span className="text-slate-500 text-[8px]">&bull;</span>
                    <span className="text-[9px] text-slate-300 dark:text-[#A9BACB] truncate">
                      {user?.roleName || 'Officer'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 dark:hover:bg-[#162638] transition-colors cursor-pointer shrink-0"
                title="Sign out of banking workstation"
                aria-label="Sign out of banking workstation"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Collapsed Mode Officer Avatar */
            <Tooltip
              content={`${user?.name || 'Officer'} (${user?.employeeId || 'EMP'}) • ${user?.roleName || 'Active Session'}`}
              position="right"
              delayMs={50}
            >
              <div className="w-full flex justify-center py-1">
                <div className="relative">
                  <div className="w-8 h-8 rounded-sm bg-[#168C83] text-white flex items-center justify-center font-bold text-xs font-mono">
                    {user?.name
                      ? user.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'CV'}
                  </div>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0c1c2e] dark:ring-[#080F19] animate-pulse"
                    title="Terminal session online"
                  />
                </div>
              </div>
            </Tooltip>
          )}

          {/* Sub-Footer System Classification */}
          {!isCollapsed && !isMobileOpen && (
            <div className="flex items-center justify-between pt-1.5 px-1 text-[9px] text-slate-400 dark:text-[#8194A8] font-mono">
              <span>NODE: MUM-FORT-01</span>
              <span className="text-emerald-400 font-semibold">IST ONLINE</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
