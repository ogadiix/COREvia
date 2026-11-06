import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Calendar,
  Search,
  ShieldCheck,
  BellRing,
  UserCheck,
  PlusCircle,
  Clock,
  Terminal,
  WalletCards,
  Landmark,
  User,
  RefreshCw,
  ArrowRight,
  LogOut,
  Menu,
  X,
  GitFork,
  Milestone,
  Users2,
  MapPin,
  ChevronDown,
  Check,
  ChevronRight,
} from 'lucide-react';
import { BANK_META, formatINR } from '../../data/mockIndianBankingData';
import { Button } from '../common/Button';
import { bankingApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import {
  useIndianBankingClock,
  INDIAN_BANKING_CITIES,
} from '../../lib/clock';
import { ModuleType } from '../../types';

export const MODULE_METADATA: Record<
  string,
  { title: string; section: string; description?: string }
> = {
  dashboard: { title: 'Operations Cockpit', section: 'Core Operations' },
  accounts: { title: 'CASA & Term Deposits', section: 'Core Operations' },
  customers: { title: 'Customer 360 & cKYC', section: 'Core Operations' },
  onboarding: { title: 'Digital Onboarding & KYC', section: 'Core Operations' },
  documents: { title: 'Document Intelligence Vault', section: 'Core Operations' },
  products: { title: 'Banking Product Catalog', section: 'Core Operations' },
  interactions: { title: 'Customer Interaction Hub', section: 'Relationship & CRM' },
  cases: { title: 'Service Cases & Grievances', section: 'Relationship & CRM' },
  opportunities: { title: 'Deals & Opportunities', section: 'Relationship & CRM' },
  tasks: { title: 'Officer Tasks & Follow-ups', section: 'Relationship & CRM' },
  intelligence: { title: 'Relationship Intelligence Engine', section: 'Relationship & CRM' },
  'next-best-actions': { title: 'Next Best Actions', section: 'Relationship & CRM' },
  'opportunity-radar': { title: 'Opportunity Radar', section: 'Relationship & CRM' },
  'relationship-twin': { title: 'Relationship Digital Twin', section: 'Relationship & CRM' },
  'relationship-graph': { title: 'Relationship Graph Intelligence', section: 'Relationship & CRM' },
  'strategy-simulator': { title: 'Strategy Simulator & Sandbox', section: 'Relationship & CRM' },
  agent: { title: 'Controlled Banking Agent', section: 'Relationship & CRM' },
  journeys: { title: 'Customer Journey Orchestration', section: 'Relationship & CRM' },
  groups: { title: 'Household & Groups 360', section: 'Relationship & CRM' },
  copilot: { title: 'Banking Copilot', section: 'Relationship & CRM' },
  analytics: { title: 'Management Intelligence', section: 'Relationship & CRM' },
  'portfolio-intelligence': { title: 'Portfolio Intelligence & Risk', section: 'Relationship & CRM' },
  lending: { title: 'Lending & Credit Advances', section: 'Credit & Assets' },
  payments: { title: 'Payments Switch & CTS', section: 'Settlement & Global' },
  'trade-finance': { title: 'Trade Finance & Forex', section: 'Settlement & Global' },
  'maker-checker': { title: 'Maker-Checker Queue', section: 'Governance & Risk' },
  'audit-regulatory': { title: 'Statutory Audit & Regulatory', section: 'Governance & Risk' },
  governance: { title: 'Trust & Governance Center', section: 'Governance & Risk' },
  operations: { title: 'Banking Operations Workspace', section: 'Governance & Risk' },
  integrations: { title: 'Enterprise Integration & Gateway', section: 'Governance & Risk' },
  admin: { title: 'Enterprise Administration', section: 'Governance & Risk' },
  showcase: { title: 'Platform Architecture Showcase', section: 'Enterprise Showcase' },
};

export interface HeaderProps {
  activeModule?: ModuleType;
  pendingAuthorizationsCount: number;
  onOpenMakerChecker: () => void;
  onOpenNewTransaction: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectSearchResult?: (type: string, id: string) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onNavigatePath?: (path: string) => void;
  onSelectModule?: (module: ModuleType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule = 'dashboard',
  pendingAuthorizationsCount,
  onOpenMakerChecker,
  onOpenNewTransaction,
  searchQuery,
  onSearchChange,
  onSelectSearchResult,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onNavigatePath,
  onSelectModule,
}) => {
  const { user, logout } = useAuth();
  const [searchResults, setSearchResults] = useState<{
    accounts: any[];
    loans: any[];
    customers: any[];
    journeys?: any[];
    groups?: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Live real-time clock locked strictly to Asia/Kolkata (IST)
  const {
    dateFormatted,
    timeFormatted,
    dayOfWeek,
    selectedCity,
    setSelectedCityId,
  } = useIndianBankingClock();

  // Poll unread notification count
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const fetchUnread = () => {
      bankingApi
        .getUnreadNotificationCount()
        .then((res) => {
          if (mounted && res && typeof res.unreadCount === 'number') {
            setUnreadNotificationsCount(res.unreadCount);
          }
        })
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // Debounced search query fetching live from PostgreSQL
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults(null);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await bankingApi.searchAll(q);
        setSearchResults(results);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside and Escape key listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const clickedDesktop =
        dropdownRef.current && dropdownRef.current.contains(e.target as Node);
      const clickedMobile =
        mobileSearchContainerRef.current &&
        mobileSearchContainerRef.current.contains(e.target as Node);
      if (!clickedDesktop && !clickedMobile) {
        setShowDropdown(false);
      }

      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCityDropdownOpen(false);
      }

      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
        setIsCityDropdownOpen(false);
        setIsProfileDropdownOpen(false);
        setIsMobileSearchOpen(false);
      } else if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const searchInput = document.getElementById('corevia-global-search');
        if (searchInput) searchInput.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleItemClick = (type: string, id: string) => {
    setShowDropdown(false);
    onSearchChange('');
    if (onSelectSearchResult) {
      onSelectSearchResult(type, id);
    }
  };

  const handleNavigateEntity = (path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowDropdown(false);
    onSearchChange('');
    if (onNavigatePath) {
      onNavigatePath(path);
    } else {
      window.location.href = path;
    }
  };

  const activeMeta = MODULE_METADATA[activeModule] || {
    title: String(activeModule).toUpperCase(),
    section: 'Banking Modules',
  };

  const renderSearchResultsList = () => {
    if (!searchResults) return null;
    return (
      <>
        {/* 1. Accounts Category */}
        <div>
          <div className="px-3 py-1.5 bg-slate-100/80 font-bold uppercase tracking-wider text-[10px] text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <WalletCards className="w-3 h-3 text-slate-500" />
              Accounts ({searchResults.accounts.length})
            </span>
          </div>
          {searchResults.accounts.length === 0 ? (
            <div className="px-3 py-2 text-slate-400 italic text-[11px]">
              No matching accounts
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {searchResults.accounts.map((acc: any) => (
                <div
                  key={acc.id}
                  onClick={() => handleItemClick('account', acc.accountNumber)}
                  className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{acc.accountNumber}</span>
                      <span className="text-[10px] font-sans px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-xs font-normal">
                        {acc.accountType}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {acc.customerName} • CIF: {acc.cifNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900">
                      {formatINR(parseFloat(acc.availableBalance || '0'))}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <button
                        onClick={(e) =>
                          handleNavigateEntity(
                            `/relationship-graph?entityType=ACCOUNT&entityId=${acc.accountNumber}`,
                            e
                          )
                        }
                        title="View in Relationship Graph"
                        className="text-[10px] text-teal-800 bg-teal-50 hover:bg-teal-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium border border-teal-200"
                      >
                        <GitFork className="w-2.5 h-2.5 text-teal-700" />
                        <span>Graph</span>
                      </button>
                      <div className="text-[10px] text-[#087F8C] font-sans font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Loans Category */}
        <div>
          <div className="px-3 py-1.5 bg-slate-100/80 font-bold uppercase tracking-wider text-[10px] text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Landmark className="w-3 h-3 text-slate-500" />
              Loans ({searchResults.loans.length})
            </span>
          </div>
          {searchResults.loans.length === 0 ? (
            <div className="px-3 py-2 text-slate-400 italic text-[11px]">
              No matching credit facilities
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {searchResults.loans.map((loan: any) => (
                <div
                  key={loan.id}
                  onClick={() => handleItemClick('loan', loan.loanAccountNumber)}
                  className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{loan.loanAccountNumber}</span>
                      <span className="text-[10px] font-sans px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-xs font-normal">
                        {String(loan.loanType).replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {loan.borrowerName || loan.customerName} • CIF: {loan.cifNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-amber-900">
                      {formatINR(parseFloat(loan.outstandingPrincipal || '0'))}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <button
                        onClick={(e) =>
                          handleNavigateEntity(
                            `/relationship-graph?entityType=LOAN&entityId=${loan.loanAccountNumber}`,
                            e
                          )
                        }
                        title="View in Relationship Graph"
                        className="text-[10px] text-teal-800 bg-teal-50 hover:bg-teal-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium border border-teal-200"
                      >
                        <GitFork className="w-2.5 h-2.5 text-teal-700" />
                        <span>Graph</span>
                      </button>
                      <div className="text-[10px] text-amber-700 font-sans font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Customers Category */}
        <div>
          <div className="px-3 py-1.5 bg-slate-100/80 font-bold uppercase tracking-wider text-[10px] text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-slate-500" />
              Customers ({searchResults.customers.length})
            </span>
          </div>
          {searchResults.customers.length === 0 ? (
            <div className="px-3 py-2 text-slate-400 italic text-[11px]">
              No matching customer profiles
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {searchResults.customers.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => handleItemClick('customer', c.customerCode || c.id)}
                  className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{c.fullName}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-xs font-normal">
                        {c.customerCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-2">
                      <span className="font-mono">PAN: {c.panNumber || 'NA'}</span>
                      <span>•</span>
                      <span>{c.segment || 'Retail'}</span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <button
                      onClick={(e) =>
                        handleNavigateEntity(
                          `/relationship-graph?entityType=CUSTOMER&entityId=${c.id || c.customerCode}`,
                          e
                        )
                      }
                      title="View in Relationship Graph"
                      className="text-[10px] text-teal-800 bg-teal-50 hover:bg-teal-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium border border-teal-200"
                    >
                      <GitFork className="w-2.5 h-2.5 text-teal-700" />
                      <span>Graph</span>
                    </button>
                    <div className="text-[10px] text-[#087F8C] font-sans font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Customer Journeys Category */}
        {searchResults.journeys && searchResults.journeys.length > 0 && (
          <div>
            <div className="px-3 py-1.5 bg-slate-100/80 font-bold uppercase tracking-wider text-[10px] text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Milestone className="w-3 h-3 text-emerald-600" />
                Journeys ({searchResults.journeys.length})
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {searchResults.journeys.map((j: any) => (
                <div
                  key={j.id}
                  onClick={() => handleNavigateEntity(`/journeys?journeyId=${j.id}`)}
                  className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{j.journeyName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {j.customerCode} • {j.journeyType}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {j.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Relationship Groups & Households Category */}
        {searchResults.groups && searchResults.groups.length > 0 && (
          <div>
            <div className="px-3 py-1.5 bg-slate-100/80 font-bold uppercase tracking-wider text-[10px] text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users2 className="w-3 h-3 text-cyan-600" />
                Relationship Groups ({searchResults.groups.length})
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {searchResults.groups.map((g: any) => (
                <div
                  key={g.id || g.groupId}
                  onClick={() => handleNavigateEntity(`/group/${g.groupId}`)}
                  className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {g.displayName || g.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {g.groupId} • {g.groupType}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        g.groupType === 'HOUSEHOLD'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-cyan-100 text-cyan-800'
                      }`}
                    >
                      {g.groupType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#CBD5E1] shadow-2xs w-full max-w-full select-none">
      {/* ======================================================================
          TIER 1: Topmost Regulatory & Real-Time Indian Banking Center Tier
          ====================================================================== */}
      <div className="bg-[#0f1e36] text-slate-300 px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs border-b border-slate-800 overflow-hidden">
        {/* Left: Branding & Regulatory Licensing */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 text-white font-semibold tracking-wider uppercase text-[11px] shrink-0">
            <span className="w-4 h-4 rounded-xs bg-[#087F8C] text-white flex items-center justify-center font-bold text-[9px] font-mono shadow-2xs">
              CV
            </span>
            <span className="tracking-tight font-bold">COREvia CBS</span>
            <span className="hidden sm:inline text-slate-500 font-normal">|</span>
            <span className="hidden sm:inline text-slate-300 text-[10px] font-normal tracking-normal truncate">
              Scheduled Commercial Bank
            </span>
          </div>

          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400 border-l border-slate-700 pl-2.5 shrink-0">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>RBI Lic: {BANK_META.rbiLicense}</span>
          </span>
        </div>

        {/* Center/Right: Live Real-Time Clock & Selected Indian City */}
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-mono shrink-0">
          {/* Real-Time Indian Standard Time (IST) Clock */}
          <div className="flex items-center gap-1.5 text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded-xs border border-slate-700/80">
            <Calendar className="w-3 h-3 text-teal-400" />
            <span className="hidden md:inline text-slate-400">{dayOfWeek},</span>
            <span className="font-medium text-slate-100">{dateFormatted}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <Clock className="w-3 h-3 text-teal-400 hidden sm:inline" />
            <span className="font-bold text-teal-300 tabular-nums">
              {timeFormatted}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-sans font-medium px-1 bg-slate-800 rounded-2xs">
              IST
            </span>
          </div>

          {/* Interactive Indian Banking Center Selector */}
          <div className="relative" ref={cityDropdownRef}>
            <button
              onClick={() => setIsCityDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors cursor-pointer text-[11px] font-sans"
              title="Select Operating Indian Banking Center (Timezone strictly Asia/Kolkata)"
            >
              <MapPin className="w-3 h-3 text-[#2dd4bf] shrink-0" />
              <span className="font-medium truncate max-w-28 sm:max-w-36">
                {selectedCity.name}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCityDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#CBD5E1] rounded-xs shadow-xl z-50 text-slate-900 py-1.5 motion-dropdown font-sans">
                <div className="px-3 py-1.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                    Indian Banking Centers
                  </div>
                  <div className="text-[11px] text-[#087F8C] font-mono mt-0.5 font-medium">
                    Timezone: Asia/Kolkata (IST • UTC+05:30)
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-[#F1F5F9]">
                  {INDIAN_BANKING_CITIES.map((city) => {
                    const isSelected = city.id === selectedCity.id;
                    return (
                      <button
                        key={city.id}
                        onClick={() => {
                          setSelectedCityId(city.id);
                          setIsCityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50/70 text-[#066974] font-medium'
                            : 'text-[#172033]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs">{city.name}</span>
                            {city.isHeadOffice && (
                              <span className="text-[9px] font-mono px-1 py-0.2 bg-[#087F8C]/15 text-[#066974] rounded-xs font-semibold">
                                HQ
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#64748B] truncate mt-0.5">
                            {city.branchName} • {city.circle}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#087F8C] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Business Date Status & Terminal Identifier */}
          <div className="hidden xl:flex items-center gap-2 text-slate-400 border-l border-slate-700 pl-2.5">
            <span className="text-emerald-400 font-sans text-[10px] font-medium uppercase px-1 bg-emerald-950/80 border border-emerald-800 rounded-xs">
              BOD Done
            </span>
            <span className="text-slate-300 font-mono text-[11px]">
              EOD: {BANK_META.eodScheduleTime}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-mono text-[11px]">
              {BANK_META.systemTerminal.terminalId}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================================
          TIER 2: Operational Breadcrumbs, Global Search & Action Controls
          ====================================================================== */}
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Hamburger (Mobile) + Breadcrumbs & Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 -ml-1 text-slate-700 hover:bg-slate-100 rounded-xs focus:outline-none cursor-pointer shrink-0 border border-[#CBD5E1]"
              aria-label="Toggle navigation menu"
              title="Toggle Navigation Menu (Escape to close)"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-slate-900" />
              ) : (
                <Menu className="w-4 h-4 text-slate-800" />
              )}
            </button>
          )}

          {/* Institutional Breadcrumb & Page Title Container */}
          <div className="min-w-0">
            {/* Breadcrumb Path */}
            <div className="flex items-center gap-1 text-[11px] text-[#64748B] font-medium leading-none mb-0.5 truncate">
              <button
                onClick={() => onSelectModule && onSelectModule('dashboard')}
                className="hover:text-[#087F8C] transition-colors cursor-pointer text-[#475569] hover:underline"
              >
                COREvia
              </button>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-[#64748B] truncate">{activeMeta.section}</span>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-[#087F8C] font-semibold truncate">
                {activeMeta.title}
              </span>
            </div>

            {/* Active Page Header & Branch Context */}
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[#172033] text-xs sm:text-sm tracking-tight truncate leading-tight">
                {activeMeta.title}
              </h1>
              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-xs shrink-0 hidden sm:inline">
                {selectedCity.branchCode} • {selectedCity.ifsc}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Search with Debounced Structured Dropdown */}
        <div className="flex-1 max-w-md hidden md:block" ref={dropdownRef}>
          <div className="relative">
            {isSearching ? (
              <RefreshCw className="w-3.5 h-3.5 text-[#087F8C] absolute left-2.5 top-1/2 -translate-y-1/2 animate-spin pointer-events-none" />
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
            <input
              id="corevia-global-search"
              type="text"
              placeholder="Search Account, Loan, Customer, CIF, PAN... (Ctrl+/)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults) setShowDropdown(true);
              }}
              className="w-full pl-8 pr-14 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-sm text-[#172033] placeholder:text-[#64748B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#087F8C] focus:border-[#087F8C] font-mono transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  onClick={() => {
                    onSearchChange('');
                    setShowDropdown(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ×
                </button>
              ) : (
                <kbd className="hidden lg:inline-block font-mono text-[10px] text-[#94A3B8] bg-[#F1F5F9] px-1 py-0.2 rounded border border-[#CBD5E1]">
                  /
                </kbd>
              )}
            </div>

            {/* Categorized Search Results Dropdown */}
            {showDropdown && searchResults && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#CBD5E1] rounded-sm shadow-xl max-h-96 overflow-y-auto z-50 text-xs divide-y divide-[#E2E8F0] motion-dropdown">
                {renderSearchResultsList()}
              </div>
            )}
          </div>
        </div>

        {/* Right: Operational Actions, Alert Center & Officer Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-1.5 rounded-sm text-slate-600 hover:bg-slate-100 border border-[#CBD5E1] cursor-pointer"
            title="Search accounts, loans, customers"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* New Transaction / Voucher Button */}
          <Button
            size="sm"
            variant="outline"
            icon={<PlusCircle className="w-3.5 h-3.5 text-[#087F8C]" />}
            onClick={onOpenNewTransaction}
            title="Create payment voucher or initiate transaction"
          >
            <span className="hidden sm:inline">New Voucher</span>
            <span className="sm:hidden">Voucher</span>
          </Button>

          {/* Maker-Checker Authorization Pill */}
          <button
            onClick={onOpenMakerChecker}
            className={`relative inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-sm text-xs font-medium border transition-colors cursor-pointer motion-interactive ${
              pendingAuthorizationsCount > 0
                ? 'bg-amber-50 text-[#78350f] border-[#fde68a] hover:bg-amber-100'
                : 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
            }`}
            title="Pending Maker-Checker Authorization Queue"
          >
            <BellRing
              className={`w-3.5 h-3.5 ${
                pendingAuthorizationsCount > 0
                  ? 'text-[#B45309] animate-pulse'
                  : 'text-slate-500'
              }`}
            />
            <span className="hidden md:inline">Queue</span>
            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-xs ${
                pendingAuthorizationsCount > 0
                  ? 'bg-[#B45309] text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {pendingAuthorizationsCount}
            </span>
          </button>

          {/* Intelligent Alerts Bell Button */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className={`relative inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-sm text-xs font-medium border transition-colors cursor-pointer motion-interactive ${
              unreadNotificationsCount > 0
                ? 'bg-rose-50 text-[#7f1d1d] border-[#fecaca] hover:bg-rose-100'
                : 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
            }`}
            title="Notifications & Intelligent Alerts"
          >
            <BellRing
              className={`w-3.5 h-3.5 ${
                unreadNotificationsCount > 0 ? 'text-[#B42318]' : 'text-slate-500'
              }`}
            />
            <span className="hidden md:inline">Alerts</span>
            {unreadNotificationsCount > 0 && (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-xs bg-[#B42318] text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Officer ID Profile Dropdown */}
          <div className="relative pl-1 sm:pl-2 border-l border-[#CBD5E1]" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 rounded-sm hover:bg-[#F8FAFC] border border-transparent hover:border-[#CBD5E1] transition-colors cursor-pointer"
              title="Workstation Officer Profile"
            >
              <div className="w-7 h-7 rounded-sm bg-[#0f1e36] text-white flex items-center justify-center font-bold text-xs">
                <UserCheck className="w-4 h-4 text-teal-300" />
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <div className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
                  <span className="truncate max-w-28">
                    {user?.name || BANK_META.systemTerminal.workstationUser}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 bg-[#087F8C]/15 text-[#066974] rounded-xs font-bold uppercase">
                    {user?.roleName || 'Officer'}
                  </span>
                </div>
                <div className="text-[10px] text-[#64748B] font-mono truncate">
                  {user?.employeeId || BANK_META.systemTerminal.employeeId}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#CBD5E1] rounded-sm shadow-xl z-50 text-slate-900 py-2 motion-dropdown font-sans">
                <div className="px-3 py-2 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="font-bold text-xs text-[#172033]">
                    {user?.name || BANK_META.systemTerminal.workstationUser}
                  </div>
                  <div className="text-[11px] text-[#64748B] font-mono mt-0.5">
                    {user?.email || 'officer@corevia.bank'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-xs">
                      {user?.employeeId || 'EMP-782194'}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-xs">
                      Session Active
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2 text-[11px] text-[#475569] space-y-1 border-b border-[#E2E8F0]">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Terminal ID:</span>
                    <span className="font-mono font-medium text-[#172033]">
                      {BANK_META.systemTerminal.terminalId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Operating Circle:</span>
                    <span className="text-[#172033] font-medium truncate max-w-32">
                      {selectedCity.circle}
                    </span>
                  </div>
                </div>

                <div className="pt-1.5 px-2">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full inline-flex items-center gap-2 px-3 py-1.5 rounded-xs text-xs font-medium text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out of Terminal</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Row (Toggled on Small Screens) */}
      {isMobileSearchOpen && (
        <div
          ref={mobileSearchContainerRef}
          className="md:hidden px-3 py-2 bg-[#F1F5F9] border-t border-[#CBD5E1] relative motion-fade-in"
        >
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Account, Customer, CIF, Loan..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (e.target.value.trim().length >= 2) {
                  setShowDropdown(true);
                }
              }}
              onFocus={() => {
                if (searchResults) setShowDropdown(true);
              }}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-xs text-slate-900 placeholder:text-slate-400 font-mono focus:outline-none focus:ring-1 focus:ring-[#087F8C]"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  setShowDropdown(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {showDropdown && searchResults && (
            <div className="mt-2 bg-white border border-[#CBD5E1] rounded-xs shadow-xl max-h-80 overflow-y-auto text-xs divide-y divide-[#E2E8F0] motion-dropdown">
              {renderSearchResultsList()}
            </div>
          )}
        </div>
      )}

      {/* Notification Center Slide-over Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={onNavigatePath}
        onCountChange={setUnreadNotificationsCount}
      />
    </header>
  );
};
