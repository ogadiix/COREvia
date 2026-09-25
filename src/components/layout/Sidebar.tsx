import React from 'react';
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
  Shield,
  X,
  UserCheck,
  MessageSquare,
  FileText,
  Network,
} from 'lucide-react';
import { ModuleType } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeModule: ModuleType;
  onSelectModule: (module: ModuleType) => void;
  pendingAuthorizationsCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
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

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  pendingAuthorizationsCount,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user, hasPermission, hasRole } = useAuth();

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
      ],
    },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none z-50 transition-all duration-200 ease-in-out ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 w-72 shadow-2xl flex h-full'
            : 'hidden lg:flex w-64 min-h-[calc(100vh-80px)]'
        }`}
      >
        {/* Mobile Drawer Header */}
        <div className="lg:hidden flex items-center justify-between px-3.5 py-3 border-b border-slate-800 bg-[#0b1626] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-xs">
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
              title="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="px-3 mb-1.5 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeModule === item.id;
                  const isPermitted =
                    (!item.requiredPermission || hasPermission(item.requiredPermission)) &&
                    (!item.requiredRoles || hasRole(...item.requiredRoles));

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectModule(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded transition-colors group cursor-pointer ${
                      isActive
                        ? 'bg-[#1e293b] text-white font-medium border-l-2 border-amber-400 pl-2.5'
                        : isPermitted
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`${
                          isActive ? 'text-amber-400' : isPermitted ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-400'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isPermitted && (
                        <span title="Requires role entitlement elevation">
                          <Lock className="w-3 h-3 text-slate-400" />
                        </span>
                      )}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="font-mono text-[10px] font-semibold bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-xs">
                          {item.badge}
                        </span>
                      )}
                      <span className="hidden group-hover:inline-block font-mono text-[10px] text-slate-400">
                        {item.shortcut}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Active Officer Identity Badge */}
      {user && (
        <div className="px-3 py-2 border-t border-slate-800 bg-[#0d1726] text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
              <Shield className="w-3 h-3" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider truncate">
                {user.roleName || user.role}
              </div>
              <div className="text-[11px] text-slate-200 font-mono font-bold truncate">
                {user.employeeId}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
            AUTH
          </span>
        </div>
      )}

      {/* Institutional Security Notice */}
      <div className="p-3 border-t border-slate-800 bg-[#080e18] text-[11px] text-slate-400">
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
          <span>HOST: CBS-PROD-01</span>
          <span className="text-emerald-400 font-medium">SSL v3 / TLS 1.3</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Session authorized for Fort Branch (0104). All actions audited under Banking Regulation Act, 1949.
        </p>
      </div>
    </aside>
    </>
  );
};
