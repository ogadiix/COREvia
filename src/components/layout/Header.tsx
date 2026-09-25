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
} from 'lucide-react';
import { BANK_META, formatINR } from '../../data/mockIndianBankingData';
import { Button } from '../common/Button';
import { bankingApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { NotificationDrawer } from '../notifications/NotificationDrawer';

interface HeaderProps {
  pendingAuthorizationsCount: number;
  onOpenMakerChecker: () => void;
  onOpenNewTransaction: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectSearchResult?: (type: string, id: string) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onNavigatePath?: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  pendingAuthorizationsCount,
  onOpenMakerChecker,
  onOpenNewTransaction,
  searchQuery,
  onSearchChange,
  onSelectSearchResult,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onNavigatePath,
}) => {
  const { user, logout } = useAuth();
  const [searchResults, setSearchResults] = useState<{
    accounts: any[];
    loans: any[];
    customers: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (type: string, id: string) => {
    setShowDropdown(false);
    onSearchChange('');
    if (onSelectSearchResult) {
      onSelectSearchResult(type, id);
    }
  };
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* Topmost Institution & Regulatory Tier */}
      <div className="bg-[#0b1626] text-slate-300 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-white font-semibold tracking-wider uppercase text-[11px]">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>COREvia CBS</span>
            <span className="text-slate-400 font-normal">|</span>
            <span className="text-slate-300 text-[10px] font-normal tracking-normal">
              Scheduled Commercial Bank
            </span>
          </div>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400 border-l border-slate-700 pl-3">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>RBI Lic: {BANK_META.rbiLicense}</span>
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{BANK_META.activeBusinessDate}</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-sans text-[10px] font-medium uppercase px-1 bg-emerald-950/80 border border-emerald-800 rounded-xs">
              BOD Done
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3 h-3" />
            <span>Next EOD: {BANK_META.eodScheduleTime}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-300 border-l border-slate-700 pl-3">
            <Terminal className="w-3 h-3 text-slate-400" />
            <span>{BANK_META.systemTerminal.terminalId}</span>
          </div>
        </div>
      </div>

      {/* Primary Banking Operational Tier */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Hamburger (Mobile) + Branch Identifier */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 -ml-1 text-slate-700 hover:bg-slate-100 rounded focus:outline-none cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
              title="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          )}

          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 text-white rounded flex items-center justify-center font-mono font-bold text-xs sm:text-sm shrink-0 border border-slate-700">
            CV
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-semibold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                {BANK_META.currentBranch.name}
              </h1>
              <span className="font-mono text-[10px] sm:text-xs px-1.5 py-0.2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xs shrink-0 hidden xs:inline">
                {BANK_META.currentBranch.ifsc}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 truncate hidden sm:block">
              Branch Code: <span className="font-mono">{BANK_META.currentBranch.code}</span> • MICR: <span className="font-mono">{BANK_META.currentBranch.micr}</span> • {BANK_META.currentBranch.circle}
            </p>
          </div>
        </div>

        {/* Center: Global Search Bar with Live Structured Dropdown (Desktop/Tablet) */}
        <div className="flex-1 max-w-md hidden md:block" ref={dropdownRef}>
          <div className="relative">
            {isSearching ? (
              <RefreshCw className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 animate-spin pointer-events-none" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
            <input
              type="text"
              placeholder="Search Account #, Loan ID, Customer Name, CIF, or PAN..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults) setShowDropdown(true);
              }}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f1e36] focus:border-[#0f1e36] font-mono transition-all"
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

            {/* Categorized Search Results Dropdown per exact specification:
                "Searching should return structured results categorized by entity type: Accounts, Loans, Customers" */}
            {showDropdown && searchResults && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-300 rounded shadow-xl max-h-96 overflow-y-auto z-50 text-xs divide-y divide-slate-200">
                {/* 1. Accounts Category */}
                <div>
                  <div className="px-3 py-1.5 bg-slate-100/80 font-bold uppercase tracking-wider text-[10px] text-slate-600 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <WalletCards className="w-3 h-3 text-slate-500" />
                      Accounts ({searchResults.accounts.length})
                    </span>
                  </div>
                  {searchResults.accounts.length === 0 ? (
                    <div className="px-3 py-2 text-slate-400 italic text-[11px]">No matching accounts</div>
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
                            <div className="text-[10px] text-emerald-700 font-sans font-medium flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>View Account</span>
                              <ArrowRight className="w-3 h-3" />
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
                    <div className="px-3 py-2 text-slate-400 italic text-[11px]">No matching credit facilities</div>
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
                            <div className="text-[10px] text-amber-700 font-sans font-medium flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>View Facility</span>
                              <ArrowRight className="w-3 h-3" />
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
                    <div className="px-3 py-2 text-slate-400 italic text-[11px]">No matching customers</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {searchResults.customers.map((cust: any) => (
                        <div
                          key={cust.id}
                          onClick={() => handleItemClick('customer', cust.cifNumber)}
                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              {cust.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              CIF: {cust.cifNumber} • PAN: {cust.panNumber}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-semibold text-slate-800">
                              {cust.totalRelationshipValue ? formatINR(parseFloat(cust.totalRelationshipValue)) : 'TRV Active'}
                            </div>
                            <div className="text-[10px] text-blue-700 font-sans font-medium flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>View 360</span>
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions & Officer Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-1.5 rounded text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            title="Search accounts, loans, customers"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <Button
            size="sm"
            variant="outline"
            icon={<PlusCircle className="w-3.5 h-3.5 text-slate-600" />}
            onClick={onOpenNewTransaction}
            title="Create payment voucher or initiate transaction"
          >
            <span className="hidden sm:inline">New Voucher</span>
            <span className="sm:hidden">Voucher</span>
          </Button>

          {/* Maker Checker Notification Pill */}
          <button
            onClick={onOpenMakerChecker}
            className={`relative inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
              pendingAuthorizationsCount > 0
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Pending Maker-Checker Authorization Queue"
          >
            <BellRing className={`w-3.5 h-3.5 ${pendingAuthorizationsCount > 0 ? 'text-amber-700 animate-pulse' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Authorizations</span>
            <span
              className={`font-mono text-[11px] font-semibold px-1.5 py-0.2 rounded-xs ${
                pendingAuthorizationsCount > 0
                  ? 'bg-amber-700 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {pendingAuthorizationsCount}
            </span>
          </button>

          {/* Intelligent Notifications & Alerts Bell Button */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className={`relative inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer ${
              unreadNotificationsCount > 0
                ? 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Notifications & Intelligent Alerts"
          >
            <BellRing className={`w-3.5 h-3.5 ${unreadNotificationsCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Alerts</span>
            {unreadNotificationsCount > 0 && (
              <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded-xs bg-rose-600 text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Officer ID Badge & Session Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700">
                <UserCheck className="w-4 h-4 text-[#0f1e36]" />
              </div>
              <div className="text-left leading-tight">
                <div className="text-xs font-medium text-slate-900 flex items-center gap-1.5">
                  <span className="font-semibold">{user?.name || BANK_META.systemTerminal.workstationUser}</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xs">
                    {user?.roleName || 'Branch Officer'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {user?.employeeId || BANK_META.systemTerminal.employeeId} &bull; {user?.department || 'Operations'}
                </div>
              </div>
            </div>

            {/* Institutional Sign Out Button */}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded text-xs font-medium text-slate-700 hover:text-red-700 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
              title="Sign Out of workstation session"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-red-600" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Row (Toggled on Small Screens) */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-3 py-2 bg-slate-100/90 border-t border-slate-200 relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Account, Customer, CIF, Loan..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults) setShowDropdown(true);
              }}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 font-mono focus:outline-none focus:ring-1 focus:ring-[#0f1e36]"
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
        </div>
      )}

      {/* Notification Center Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={onNavigatePath}
        onCountChange={setUnreadNotificationsCount}
      />
    </header>
  );
};
