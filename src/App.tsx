import React, { useState, useEffect, useMemo } from 'react';
import {
  ModuleType,
  BankAccount,
  CustomerKYC,
  LoanAccount,
  PaymentTransaction,
  TradeFinanceItem,
  PendingAuthorization,
  AuditLogEntry,
  BankExecutiveMetrics,
  AccountStatus,
  BiometricVerificationPayload,
} from './types';
import {
  INITIAL_METRICS,
  INITIAL_ACCOUNTS,
  INITIAL_CUSTOMERS,
  INITIAL_LOANS,
  INITIAL_PAYMENTS,
  INITIAL_TRADE_FINANCE,
  INITIAL_AUTHORIZATIONS,
  INITIAL_AUDIT_LOGS,
  BANK_META,
  formatINR,
} from './data/mockIndianBankingData';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { SystemStatusBar } from './components/layout/SystemStatusBar';
import { DashboardModule } from './components/modules/DashboardModule';
import { AccountsModule } from './components/modules/AccountsModule';
import { CustomerKYCModule } from './components/modules/CustomerKYCModule';
import { ProductsModule } from './components/modules/ProductsModule';
import { CasesModule } from './components/modules/CasesModule';
import { OpportunitiesModule } from './components/modules/OpportunitiesModule';
import { TasksModule } from './components/modules/TasksModule';
import { LendingModule } from './components/modules/LendingModule';
import { PaymentsSwitchModule } from './components/modules/PaymentsSwitchModule';
import { TradeFinanceModule } from './components/modules/TradeFinanceModule';
import { MakerCheckerModule } from './components/modules/MakerCheckerModule';
import { AuditRegulatoryModule } from './components/modules/AuditRegulatoryModule';
import { RelationshipIntelligenceModule } from './components/modules/RelationshipIntelligenceModule';
import { NextBestActionModule } from './components/modules/NextBestActionModule';
import { OpportunityRadarModule } from './components/modules/OpportunityRadarModule';
import { AnalyticsModule } from './components/modules/AnalyticsModule';
import { CopilotModule } from './components/modules/CopilotModule';
import { OnboardingModule } from './components/onboarding/OnboardingModule';
import { InteractionsModule } from './components/interactions/InteractionsModule';
import { DocumentIntelligenceModule } from './components/documents/DocumentIntelligenceModule';
import { RelationshipTwinModule } from './components/modules/RelationshipTwinModule';
import { CopilotDrawer } from './components/copilot/CopilotDrawer';
import { CopilotProvider, useCopilot } from './context/CopilotContext';
import { NewTransactionModal } from './components/modals/NewTransactionModal';
import { AccountDetailModal } from './components/modals/AccountDetailModal';
import { LienMarkModal } from './components/modals/LienMarkModal';
import { AiBankingAssistantModal } from './components/ai/AiBankingAssistantModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { AccessRestrictedNotice } from './components/common/AccessRestrictedNotice';
import { ShieldCheck, Sparkles, Bot } from 'lucide-react';

const pathToModule: Record<string, ModuleType> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/customers': 'customers',
  '/accounts': 'accounts',
  '/loans': 'lending',
  '/opportunities': 'opportunities',
  '/service-desk': 'cases',
  '/tasks': 'tasks',
  '/analytics': 'analytics',
  '/intelligence': 'intelligence',
  '/next-best-actions': 'next-best-actions',
  '/nba': 'next-best-actions',
  '/copilot': 'copilot',
  '/audit-logs': 'audit-regulatory',
  '/maker-checker': 'maker-checker',
  '/products': 'products',
  '/payments': 'payments',
  '/trade-finance': 'trade-finance',
  '/opportunity-radar': 'opportunity-radar',
  '/radar': 'opportunity-radar',
  '/onboarding': 'onboarding',
  '/interactions': 'interactions',
  '/documents': 'documents',
  '/relationship-twin': 'relationship-twin',
  '/twin': 'relationship-twin',
};

const moduleToPath: Record<ModuleType, string> = {
  dashboard: '/dashboard',
  customers: '/customers',
  accounts: '/accounts',
  lending: '/loans',
  opportunities: '/opportunities',
  cases: '/service-desk',
  tasks: '/tasks',
  intelligence: '/intelligence',
  'next-best-actions': '/next-best-actions',
  'opportunity-radar': '/opportunity-radar',
  analytics: '/analytics',
  copilot: '/copilot',
  'audit-regulatory': '/audit-logs',
  'maker-checker': '/maker-checker',
  products: '/products',
  payments: '/payments',
  'trade-finance': '/trade-finance',
  onboarding: '/onboarding',
  interactions: '/interactions',
  documents: '/documents',
  'relationship-twin': '/relationship-twin',
};

function BankingWorkplace() {
  const { isAuthenticated, isLoading, user, hasPermission, hasRole } = useAuth();
  const { openDrawer, toggleDrawer } = useCopilot();

  // RBAC Permission checks for modules
  const canAccessAccounts = hasPermission('accounts:read');
  const canAccessCustomers = hasPermission('customers:read');
  const canAccessOnboarding = hasPermission('customers:read') || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'RELATIONSHIP_MANAGER', 'KYC_ANALYST', 'OPERATIONS', 'SERVICE_AGENT', 'ANALYST', 'COMPLIANCE');
  const canAccessCases = hasPermission('cases:manage') || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'SERVICE_AGENT', 'RELATIONSHIP_MANAGER');
  const canAccessOpportunities = hasPermission('opportunities:manage') || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'RELATIONSHIP_MANAGER');
  const canAccessLending = hasPermission('loans:read') || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'RELATIONSHIP_MANAGER', 'ANALYST');
  const canAccessPayments = hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'OPERATIONS', 'SERVICE_AGENT');
  const canAccessTradeFinance = hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'OPERATIONS', 'RELATIONSHIP_MANAGER');
  const canAccessAudit = hasPermission('audit:read') || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'OPERATIONS', 'ANALYST');
  const canAccessIntelligence = hasPermission('intelligence:read') || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'RELATIONSHIP_MANAGER', 'ANALYST', 'SERVICE_AGENT');
  const canAccessNBA = hasPermission('nba:read') || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'RELATIONSHIP_MANAGER', 'ANALYST', 'SERVICE_AGENT');
  const canAccessRadar = hasPermission('radar:read') || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'RELATIONSHIP_MANAGER', 'ANALYST', 'SERVICE_AGENT');
  const canAccessAnalytics = hasPermission('analytics:read') || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'RELATIONSHIP_MANAGER', 'ANALYST');
  const canAccessInteractions = canAccessCustomers || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'RELATIONSHIP_MANAGER', 'SERVICE_AGENT', 'ANALYST');
  const canAccessDocuments = canAccessCustomers || hasPermission('customers:read') || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'RELATIONSHIP_MANAGER', 'KYC_ANALYST', 'OPERATIONS', 'SERVICE_AGENT', 'ANALYST', 'COMPLIANCE');
  const canAccessTwin = canAccessIntelligence || hasPermission('intelligence:read') || hasRole('ADMINISTRATOR', 'BRANCH_MANAGER', 'RELATIONSHIP_MANAGER', 'ANALYST', 'SERVICE_AGENT');

  // Navigation State initialized from URL path
  const [activeModule, setActiveModule] = useState<ModuleType>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return pathToModule[path] || 'dashboard';
    }
    return 'dashboard';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Handle URL changes & popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (pathToModule[path]) {
        setActiveModule(pathToModule[path]);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync module state to URL path when authenticated
  const handleSelectModule = (mod: ModuleType) => {
    setActiveModule(mod);
    setIsMobileMenuOpen(false);
    const path = moduleToPath[mod] || '/dashboard';
    if (window.location.pathname !== path) {
      try {
        window.history.pushState({}, '', path);
      } catch (e) {
        console.warn('history.pushState blocked by sandbox environment');
      }
    }
  };

  const handleNavigatePath = (path: string) => {
    const mod = pathToModule[path];
    if (mod) {
      handleSelectModule(mod);
    }
  };

  // Ensure unauthenticated users are on /login, and authenticated users leave /login
  useEffect(() => {
    // Critical: Do NOT perform any route redirection while authentication check is in progress
    if (isLoading) {
      return;
    }

    try {
      if (!isAuthenticated) {
        if (window.location.pathname !== '/login') {
          try {
            // Preserve the requested path so the user can be restored after authenticating
            if (pathToModule[window.location.pathname]) {
              sessionStorage.setItem('corevia_intended_route', window.location.pathname);
            }
          } catch (e) {
            // sessionStorage unavailable in strict sandbox
          }
          window.history.replaceState({}, '', '/login');
        }
      } else if (isAuthenticated && window.location.pathname === '/login') {
        let targetPath = '/dashboard';
        try {
          const saved = sessionStorage.getItem('corevia_intended_route');
          if (saved && pathToModule[saved]) {
            targetPath = saved;
            sessionStorage.removeItem('corevia_intended_route');
          }
        } catch (e) {
          // fallback
        }
        window.history.replaceState({}, '', targetPath);
        const targetModule = pathToModule[targetPath] || 'dashboard';
        setActiveModule(targetModule);
      }
    } catch (e) {
      console.warn('history.replaceState blocked by sandbox environment');
    }
  }, [isAuthenticated, isLoading]);

  // Core Banking Data States
  const [metrics, setMetrics] = useState<BankExecutiveMetrics>(INITIAL_METRICS);
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_ACCOUNTS);
  const [customers, setCustomers] = useState<CustomerKYC[]>(INITIAL_CUSTOMERS);
  const [loans, setLoans] = useState<LoanAccount[]>(INITIAL_LOANS);
  const [payments, setPayments] = useState<PaymentTransaction[]>(INITIAL_PAYMENTS);
  const [tradeItems, setTradeItems] = useState<TradeFinanceItem[]>(INITIAL_TRADE_FINANCE);
  const [pendingAuthorizations, setPendingAuthorizations] = useState<PendingAuthorization[]>(
    INITIAL_AUTHORIZATIONS
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Modals
  const [isNewTxnModalOpen, setIsNewTxnModalOpen] = useState<boolean>(false);
  const [isAccountDetailModalOpen, setIsAccountDetailModalOpen] = useState<boolean>(false);
  const [isLienModalOpen, setIsLienModalOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

  // Functional Keyboard Shortcuts (F1 - F8 standard in enterprise banking terminals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting when user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        setActiveModule('dashboard');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveModule('accounts');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveModule('customers');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveModule('lending');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveModule('payments');
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveModule('trade-finance');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setActiveModule('maker-checker');
      } else if (e.key === 'F8') {
        e.preventDefault();
        setActiveModule('next-best-actions');
      } else if (e.key === 'F9') {
        e.preventDefault();
        setActiveModule('opportunity-radar');
      } else if (e.key === 'F10') {
        e.preventDefault();
        toggleDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter accounts when global search is used
  const filteredAccountsForSearch = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(
      (a) =>
        a.accountNumber.includes(q) ||
        a.customerName.toLowerCase().includes(q) ||
        a.cifNumber.toLowerCase().includes(q) ||
        a.panNumber.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  // Handle New Transaction Creation
  const handleCreateTransaction = (data: {
    sourceAccount: string;
    rail: PaymentTransaction['rail'];
    destAccount: string;
    destName: string;
    destBankIfsc: string;
    amount: number;
    narration: string;
    biometricVerification?: BiometricVerificationPayload;
  }) => {
    const now = new Date();
    const timeString = `${BANK_META.activeBusinessDate} ${now.toTimeString().split(' ')[0]} IST`;
    const txnId = `TXN-20260909-${Math.floor(100 + Math.random() * 900)}`;
    const utrNumber = `CRVIAR520260909${Math.floor(10000000 + Math.random() * 90000000)}`;

    const sourceAcc = accounts.find((a) => a.accountNumber === data.sourceAccount);
    const sourceName = sourceAcc ? sourceAcc.customerName : 'Fort Branch Client';

    const isHighValue = data.amount >= 10000000; // >= ₹1 Crore triggers dual-control

    const newPayment: PaymentTransaction = {
      transactionId: txnId,
      utrNumber,
      rail: data.rail,
      timestamp: timeString,
      sourceAccount: data.sourceAccount,
      sourceName,
      sourceBankIfsc: BANK_META.currentBranch.ifsc,
      destAccount: data.destAccount,
      destName: data.destName,
      destBankIfsc: data.destBankIfsc,
      amount: data.amount,
      status: isHighValue ? 'HELD_FOR_VERIFICATION' : 'SETTLED',
      narration: data.narration,
    };

    setPayments((prev) => [newPayment, ...prev]);

    if (isHighValue) {
      // Escalate to Maker-Checker Queue
      const newAuth: PendingAuthorization = {
        id: `AUTH-${Date.now()}`,
        voucherNumber: `VCH-${data.rail}-0104-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: timeString,
        actionType: 'RTGS_OUTWARD_APPROVAL',
        description: `High Value ${data.rail} Transfer of ${formatINR(data.amount)}`,
        makerUserId: user?.employeeId || 'EMP-401928',
        makerUserName: `${user?.name || 'Deepak Nambiar'} (Maker)`,
        makerRole: user?.roleName || user?.role || 'Clearing Desk Officer',
        accountNumber: data.sourceAccount,
        amount: data.amount,
        criticality: 'CRITICAL',
        status: 'PENDING',
        auditReason: `Amount of ${formatINR(data.amount)} exceeds ₹1.00 Cr threshold. Mandatory Level-3 Checker sign-off required.${
          data.biometricVerification ? ' [Biometrically Authenticated via FIDO2]' : ''
        }`,
        details: {
          remitter: sourceName,
          remitterAccount: data.sourceAccount,
          beneficiary: data.destName,
          beneficiaryBank: data.destBankIfsc,
          narration: data.narration,
          ...(data.biometricVerification
            ? {
                biometricSignature: `${data.biometricVerification.method} (Token: ${data.biometricVerification.tokenHash})`,
                biometricOfficer: `${data.biometricVerification.officerName} (${data.biometricVerification.officerEmployeeId})`,
                biometricVerifiedAt: data.biometricVerification.verifiedAt,
              }
            : {}),
        },
        biometricVerification: data.biometricVerification,
      };

      setPendingAuthorizations((prev) => [newAuth, ...prev]);

      // Audit entry for initiation
      const auditEntry: AuditLogEntry = {
        id: `LOG-${Date.now()}`,
        timestamp: timeString,
        operatorId: user?.employeeId || BANK_META.systemTerminal.employeeId,
        operatorName: user?.name || BANK_META.systemTerminal.workstationUser,
        terminalId: 'TER-MUM-0104-D',
        module: `PAYMENTS_${data.rail}`,
        action: data.biometricVerification ? 'INITIATE_HIGH_VALUE_TRANSFER_WITH_BIOMETRICS' : 'INITIATE_HIGH_VALUE_TRANSFER',
        recordIdentifier: `${txnId} (${formatINR(data.amount)})${data.biometricVerification ? ` | BIO: ${data.biometricVerification.method}` : ''}`,
        ipAddress: '10.14.104.42',
        authorizationLevel: data.biometricVerification ? 'LEVEL_1_MAKER_BIOMETRIC' : 'LEVEL_1_MAKER',
        severity: 'ALERT',
        rbiReportable: true,
      };

      // Additional dedicated Biometric Audit Log if step-up was executed
      const logsToAdd = [auditEntry];
      if (data.biometricVerification) {
        logsToAdd.push({
          id: `LOG-BIO-${Date.now()}`,
          timestamp: timeString,
          operatorId: data.biometricVerification.officerEmployeeId,
          operatorName: data.biometricVerification.officerName,
          terminalId: data.biometricVerification.terminalId,
          module: 'SECURITY_BIOMETRICS',
          action: 'HIGH_VALUE_BIOMETRIC_STEP_UP_VERIFIED',
          recordIdentifier: `FIDO2 Token: ${data.biometricVerification.tokenHash} | Quality: ${data.biometricVerification.qualityScore}% | Amount: ${formatINR(data.amount)}`,
          ipAddress: '10.14.104.42',
          authorizationLevel: 'LEVEL_1_MAKER_BIOMETRIC',
          severity: 'NOTICE',
          rbiReportable: true,
        });
      }

      setAuditLogs((prev) => [...logsToAdd, ...prev]);
    } else {
      // Commit immediately to ledger
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.accountNumber === data.sourceAccount) {
            return {
              ...acc,
              availableBalance: acc.availableBalance - data.amount,
              ledgerBalance: acc.ledgerBalance - data.amount,
            };
          }
          return acc;
        })
      );

      // Audit entry for immediate settlement
      const auditEntry: AuditLogEntry = {
        id: `LOG-${Date.now()}`,
        timestamp: timeString,
        operatorId: user?.employeeId || BANK_META.systemTerminal.employeeId,
        operatorName: user?.name || BANK_META.systemTerminal.workstationUser,
        terminalId: BANK_META.systemTerminal.terminalId,
        module: `PAYMENTS_${data.rail}`,
        action: 'SETTLE_OUTWARD_TRANSFER',
        recordIdentifier: `${txnId} (${formatINR(data.amount)})`,
        ipAddress: '10.14.104.11',
        authorizationLevel: 'LEVEL_3_CHECKER',
        severity: 'INFO',
        rbiReportable: data.amount >= 1000000, // Reportable if >= 10 Lakhs
      };

      setAuditLogs((prev) => [auditEntry, ...prev]);
    }
  };

  // Handle Maker-Checker Approval
  const handleApproveAuthorization = (
    item: PendingAuthorization,
    checkerRemark: string
  ) => {
    const now = new Date();
    const timeString = `${BANK_META.activeBusinessDate} ${now.toTimeString().split(' ')[0]} IST`;

    // 1. Update pending authorizations list
    setPendingAuthorizations((prev) => prev.filter((a) => a.id !== item.id));

    // 2. Perform business logic depending on action
    if (item.actionType === 'RTGS_OUTWARD_APPROVAL' && item.amount && item.accountNumber) {
      // Update payment transaction to SETTLED
      setPayments((prev) =>
        prev.map((p) => {
          if (p.sourceAccount === item.accountNumber && p.status === 'HELD_FOR_VERIFICATION') {
            return { ...p, status: 'SETTLED' };
          }
          return p;
        })
      );

      // Deduct from account ledger
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.accountNumber === item.accountNumber) {
            return {
              ...acc,
              availableBalance: Math.max(0, acc.availableBalance - item.amount!),
              ledgerBalance: Math.max(0, acc.ledgerBalance - item.amount!),
            };
          }
          return acc;
        })
      );
    } else if (item.actionType === 'ACCOUNT_LIEN_MARK' && item.accountNumber && item.amount) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.accountNumber === item.accountNumber) {
            return {
              ...acc,
              lienAmount: item.amount!,
            };
          }
          return acc;
        })
      );
    } else if (item.actionType === 'ACCOUNT_STATUS_CHANGE' && item.accountNumber) {
      const newStatus = (item.details?.requestedStatus as AccountStatus) || 'ACTIVE';
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.accountNumber === item.accountNumber) {
            return { ...acc, status: newStatus };
          }
          return acc;
        })
      );
    } else if (item.actionType === 'KYC_RISK_OVERRIDE' && item.cifNumber) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.cifNumber === item.cifNumber) {
            return { ...c, riskCategory: 'HIGH' };
          }
          return c;
        })
      );
    } else if (item.actionType === 'CASH_VAULT_DEPOSIT' && item.amount) {
      setMetrics((prev) => ({
        ...prev,
        vaultCashInHandInr: Math.max(0, prev.vaultCashInHandInr - item.amount!),
      }));
    }

    // 3. Log immutable audit entry
    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeString,
      operatorId: user?.employeeId || BANK_META.systemTerminal.employeeId,
      operatorName: user?.name || BANK_META.systemTerminal.workstationUser,
      terminalId: BANK_META.systemTerminal.terminalId,
      module: 'MAKER_CHECKER_SIGN_OFF',
      action: `AUTHORIZE_${item.actionType}`,
      recordIdentifier: `${item.voucherNumber} • Checker: ${checkerRemark}`,
      ipAddress: '10.14.104.11',
      authorizationLevel: 'LEVEL_3_CHECKER',
      severity: 'NOTICE',
      rbiReportable: true,
    };

    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  // Handle Maker-Checker Rejection
  const handleRejectAuthorization = (
    item: PendingAuthorization,
    checkerRemark: string
  ) => {
    const now = new Date();
    const timeString = `${BANK_META.activeBusinessDate} ${now.toTimeString().split(' ')[0]} IST`;

    // 1. Remove from queue
    setPendingAuthorizations((prev) => prev.filter((a) => a.id !== item.id));

    // 2. If it was a payment, mark as REJECTED
    if (item.actionType === 'RTGS_OUTWARD_APPROVAL' && item.accountNumber) {
      setPayments((prev) =>
        prev.map((p) => {
          if (p.sourceAccount === item.accountNumber && p.status === 'HELD_FOR_VERIFICATION') {
            return {
              ...p,
              status: 'REJECTED',
              returnReason: `Rejected by Checker: ${checkerRemark}`,
            };
          }
          return p;
        })
      );
    }

    // 3. Log audit entry
    const auditEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: timeString,
      operatorId: user?.employeeId || BANK_META.systemTerminal.employeeId,
      operatorName: user?.name || BANK_META.systemTerminal.workstationUser,
      terminalId: BANK_META.systemTerminal.terminalId,
      module: 'MAKER_CHECKER_SIGN_OFF',
      action: `REJECT_${item.actionType}`,
      recordIdentifier: `${item.voucherNumber} • Rejection Remark: ${checkerRemark}`,
      ipAddress: '10.14.104.11',
      authorizationLevel: 'LEVEL_3_CHECKER',
      severity: 'WARNING',
      rbiReportable: true,
    };

    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  // Handle Request Account Status Change (Escalates to Maker-Checker)
  const handleRequestStatusChange = (account: BankAccount, newStatus: AccountStatus) => {
    const now = new Date();
    const timeString = `${BANK_META.activeBusinessDate} ${now.toTimeString().split(' ')[0]} IST`;

    const newAuth: PendingAuthorization = {
      id: `AUTH-${Date.now()}`,
      voucherNumber: `VCH-STATUS-0104-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: timeString,
      actionType: 'ACCOUNT_STATUS_CHANGE',
      description: `Alter Operational Status of Account ${account.accountNumber} to ${newStatus}`,
      makerUserId: user?.employeeId || 'EMP-401928',
      makerUserName: `${user?.name || 'Deepak Nambiar'} (Maker)`,
      makerRole: user?.roleName || user?.role || 'Accounts Officer',
      accountNumber: account.accountNumber,
      cifNumber: account.cifNumber,
      criticality: 'HIGH',
      status: 'PENDING',
      auditReason: `Request to place account under ${newStatus} per statutory / compliance mandate.`,
      details: {
        customerName: account.customerName,
        currentStatus: account.status,
        requestedStatus: newStatus,
      },
    };

    setPendingAuthorizations((prev) => [newAuth, ...prev]);
    setActiveModule('maker-checker');
  };

  // Handle Submit Lien Modification (Escalates to Maker-Checker)
  const handleSubmitLien = (account: BankAccount, lienAmount: number, reason: string) => {
    const now = new Date();
    const timeString = `${BANK_META.activeBusinessDate} ${now.toTimeString().split(' ')[0]} IST`;

    const newAuth: PendingAuthorization = {
      id: `AUTH-${Date.now()}`,
      voucherNumber: `VCH-LIEN-0104-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: timeString,
      actionType: 'ACCOUNT_LIEN_MARK',
      description: `Mark Account Lien of ${formatINR(lienAmount)} on ${account.accountNumber}`,
      makerUserId: user?.employeeId || 'EMP-591024',
      makerUserName: `${user?.name || 'Pooja Iyer'} (Maker)`,
      makerRole: user?.roleName || user?.role || 'Trade Finance Officer',
      accountNumber: account.accountNumber,
      cifNumber: account.cifNumber,
      amount: lienAmount,
      criticality: 'HIGH',
      status: 'PENDING',
      auditReason: reason,
      details: {
        customerName: account.customerName,
        previousLien: formatINR(account.lienAmount),
        proposedLien: formatINR(lienAmount),
      },
    };

    setPendingAuthorizations((prev) => [newAuth, ...prev]);
    setActiveModule('maker-checker');
  };

  // Handle Customer AML Risk Reclassification
  const handleRequestRiskOverride = (customer: CustomerKYC) => {
    const now = new Date();
    const timeString = `${BANK_META.activeBusinessDate} ${now.toTimeString().split(' ')[0]} IST`;

    const newAuth: PendingAuthorization = {
      id: `AUTH-${Date.now()}`,
      voucherNumber: `VCH-KYC-0104-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: timeString,
      actionType: 'KYC_RISK_OVERRIDE',
      description: `Reclassify Customer Risk Profile from ${customer.riskCategory} to HIGH`,
      makerUserId: user?.employeeId || 'EMP-771029',
      makerUserName: `${user?.name || 'Rohit Kulkarni'} (Maker)`,
      makerRole: user?.roleName || user?.role || 'AML Compliance Officer',
      cifNumber: customer.cifNumber,
      criticality: 'NORMAL',
      status: 'PENDING',
      auditReason: 'Overdue trade bills and repeated court freeze notice on export remittances.',
      details: {
        customer: customer.name,
        existingRisk: customer.riskCategory,
        proposedRisk: 'HIGH',
        cKycRef: customer.cKycNumber,
      },
    };

    setPendingAuthorizations((prev) => [newAuth, ...prev]);
    setActiveModule('maker-checker');
  };

  // Handle Loan Limit Revision Request
  const handleRequestLimitRevision = (loan: LoanAccount) => {
    const now = new Date();
    const timeString = `${BANK_META.activeBusinessDate} ${now.toTimeString().split(' ')[0]} IST`;

    const newAuth: PendingAuthorization = {
      id: `AUTH-${Date.now()}`,
      voucherNumber: `VCH-LOAN-0104-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: timeString,
      actionType: 'LOAN_LIMIT_REVISION',
      description: `Stock Audit Drawing Power Re-assessment for ${loan.borrowerName}`,
      makerUserId: user?.employeeId || 'EMP-884102',
      makerUserName: `${user?.name || 'Ananya Deshmukh'} (Credit Analyst)`,
      makerRole: user?.roleName || user?.role || 'Credit Officer',
      accountNumber: loan.loanAccountNumber,
      cifNumber: loan.cifNumber,
      amount: loan.sanctionedLimit,
      criticality: 'HIGH',
      status: 'PENDING',
      auditReason: 'Updated stock and debtors statement received for August 2026; DP adjustment proposed.',
      details: {
        borrower: loan.borrowerName,
        currentLimit: formatINR(loan.sanctionedLimit),
        drawingPower: formatINR(loan.drawingPower),
      },
    };

    setPendingAuthorizations((prev) => [newAuth, ...prev]);
    setActiveModule('maker-checker');
  };

  const handleSelectSearchResult = (type: string, id: string) => {
    if (type === 'account') {
      handleSelectModule('accounts');
    } else if (type === 'loan') {
      handleSelectModule('lending');
    } else if (type === 'customer') {
      handleSelectModule('customers');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
        <div className="bg-white border border-slate-300 rounded-lg p-8 max-w-sm w-full shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded bg-[#0b1626] flex items-center justify-center text-amber-400 mx-auto shadow-2xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">COREvia Terminal Gateway</h2>
            <p className="text-xs text-slate-500 mt-1">Verifying encrypted security session & TLS connection...</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#0b1626] h-1.5 rounded-full animate-pulse w-2/3 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onSuccessRedirect={() => {
          let targetPath = '/dashboard';
          try {
            const saved = sessionStorage.getItem('corevia_intended_route');
            if (saved && pathToModule[saved]) {
              targetPath = saved;
              sessionStorage.removeItem('corevia_intended_route');
            }
          } catch (e) {
            // fallback
          }
          try {
            window.history.pushState({}, '', targetPath);
          } catch (e) {
            console.warn('history.pushState blocked by sandbox environment');
          }
          setActiveModule(pathToModule[targetPath] || 'dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-900 font-sans selection:bg-slate-200">
      {/* Institutional Topmost Header */}
      <Header
        pendingAuthorizationsCount={pendingAuthorizations.length}
        onOpenMakerChecker={() => handleSelectModule('maker-checker')}
        onOpenNewTransaction={() => setIsNewTxnModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectSearchResult={handleSelectSearchResult}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNavigatePath={handleNavigatePath}
      />

      {/* Primary Layout: Sidebar + Main Workplace */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeModule={activeModule}
          onSelectModule={handleSelectModule}
          pendingAuthorizationsCount={pendingAuthorizations.length}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeModule === 'dashboard' && (
              <DashboardModule
                metrics={metrics}
                accounts={accounts}
                recentPayments={payments}
                pendingAuthorizations={pendingAuthorizations}
                onNavigateToAccounts={() => setActiveModule('accounts')}
                onNavigateToPayments={() => setActiveModule('payments')}
                onNavigateToMakerChecker={() => setActiveModule('maker-checker')}
                onNavigateToLending={() => setActiveModule('lending')}
                onNavigateToTradeFinance={() => setActiveModule('trade-finance')}
                onNavigateToCustomers={() => setActiveModule('customers')}
                onNavigateToNextBestActions={() => setActiveModule('next-best-actions')}
                onNavigateToOpportunityRadar={() => setActiveModule('opportunity-radar')}
                onOpenNewTransaction={() => setIsNewTxnModalOpen(true)}
                onNavigateToEntity={handleNavigatePath}
                onViewAccountDetail={(acc) => {
                  setSelectedAccount(acc);
                  setIsAccountDetailModalOpen(true);
                }}
              />
            )}

            {activeModule === 'accounts' && (
              canAccessAccounts ? (
                <AccountsModule
                  accounts={filteredAccountsForSearch}
                  onSelectAccount={(acc) => {
                    setSelectedAccount(acc);
                    setIsAccountDetailModalOpen(true);
                  }}
                  onOpenNewAccountOrVoucher={() => setIsNewTxnModalOpen(true)}
                  onRequestStatusChange={handleRequestStatusChange}
                  onRequestLienChange={(acc) => {
                    setSelectedAccount(acc);
                    setIsLienModalOpen(true);
                  }}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="CASA & Term Deposits (Accounts)"
                  requiredPermission="accounts:read"
                  requiredRoles={['Branch Manager', 'Relationship Manager', 'Operations', 'Service Agent']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'customers' && (
              canAccessCustomers ? (
                <CustomerKYCModule
                  customers={customers}
                  onRequestRiskOverride={handleRequestRiskOverride}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Customer 360 & cKYC"
                  requiredPermission="customers:read"
                  requiredRoles={['Branch Manager', 'Relationship Manager', 'Service Agent', 'Analyst']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'onboarding' && (
              canAccessOnboarding ? (
                <OnboardingModule
                  onNavigateToCustomer={(customerCode) => {
                    handleSelectModule('customers');
                  }}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Digital Onboarding & KYC Workspace"
                  requiredRoles={['Relationship Manager', 'Branch Manager', 'Operations', 'Compliance']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'documents' && (
              canAccessDocuments ? (
                <DocumentIntelligenceModule />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Banking Document Intelligence & Vault"
                  requiredPermission="customers:read"
                  requiredRoles={['Relationship Manager', 'Branch Manager', 'Operations', 'Compliance', 'Analyst']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'products' && (
              <ProductsModule
                onNavigateToCustomer={(customerCode) => {
                  setActiveModule('customers');
                }}
              />
            )}

            {activeModule === 'cases' && (
              canAccessCases ? (
                <CasesModule />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Service Cases & Customer Grievances"
                  requiredPermission="cases:manage"
                  requiredRoles={['Service Agent', 'Relationship Manager', 'Branch Manager']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'opportunities' && (
              canAccessOpportunities ? (
                <OpportunitiesModule />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Deals & Relationship Pipeline"
                  requiredPermission="opportunities:manage"
                  requiredRoles={['Relationship Manager', 'Branch Manager']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'tasks' && <TasksModule />}

            {activeModule === 'interactions' && (
              canAccessInteractions ? (
                <InteractionsModule
                  onNavigateToCustomer={(cId) => {
                    handleSelectModule('customers');
                  }}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Customer Communication & Interaction Hub"
                  requiredPermission="customers:read"
                  requiredRoles={['Relationship Manager', 'Branch Manager', 'Service Agent', 'Analyst']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'intelligence' && (
              canAccessIntelligence ? (
                <RelationshipIntelligenceModule
                  onNavigateToModule={(mod) => handleSelectModule(mod)}
                  onNavigateToCustomer={(cif) => {
                    handleSelectModule('customers');
                  }}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Relationship Intelligence Engine"
                  requiredPermission="intelligence:read"
                  requiredRoles={['Relationship Manager', 'Branch Manager', 'Analyst', 'Service Agent']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'next-best-actions' && (
              canAccessNBA ? (
                <NextBestActionModule
                  onNavigateToCustomer={(customerId) => {
                    handleSelectModule('customers');
                  }}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Next Best Action Engine"
                  requiredPermission="nba:read"
                  requiredRoles={['Relationship Manager', 'Branch Manager', 'Analyst', 'Service Agent']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'opportunity-radar' && (
              canAccessRadar ? (
                <OpportunityRadarModule
                  onNavigateToCustomer={(customerId) => {
                    handleSelectModule('customers');
                  }}
                  onNavigateToOpportunities={() => {
                    handleSelectModule('opportunities');
                  }}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Customer Opportunity Radar"
                  requiredPermission="radar:read"
                  requiredRoles={['Relationship Manager', 'Branch Manager', 'Administrator']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'relationship-twin' && (
              canAccessTwin ? (
                <RelationshipTwinModule
                  initialCustomerId={1}
                  onNavigateToCustomer={(cId) => {
                    handleSelectModule('customers');
                  }}
                  onNavigateToModule={(mod) => {
                    handleSelectModule(mod as any);
                  }}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Relationship Digital Twin"
                  requiredPermission="intelligence:read"
                  requiredRoles={['Relationship Manager', 'Branch Manager', 'Analyst', 'Service Agent']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'copilot' && (
              <CopilotModule onNavigate={handleNavigatePath} />
            )}

            {activeModule === 'analytics' && (
              canAccessAnalytics ? (
                <AnalyticsModule
                  onNavigateToCustomer={(cifOrId) => {
                    handleSelectModule('customers');
                  }}
                  onNavigateToModule={(mod) => {
                    handleSelectModule(mod);
                  }}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Management Intelligence & Advanced Analytics"
                  requiredPermission="analytics:read"
                  requiredRoles={['Administrator', 'Branch Manager', 'Relationship Manager', 'Analyst']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'lending' && (
              canAccessLending ? (
                <LendingModule
                  loans={loans}
                  onRequestLimitRevision={handleRequestLimitRevision}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Lending & Advances Portfolio"
                  requiredPermission="loans:read"
                  requiredRoles={['Credit Officer', 'Branch Manager', 'Relationship Manager', 'Analyst']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'payments' && (
              canAccessPayments ? (
                <PaymentsSwitchModule
                  payments={payments}
                  onOpenNewTransaction={() => setIsNewTxnModalOpen(true)}
                  onNavigateToMakerChecker={() => setActiveModule('maker-checker')}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Payments Switch & High-Value Settlement"
                  requiredRoles={['Operations', 'Service Agent', 'Branch Manager']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'trade-finance' && (
              canAccessTradeFinance ? (
                <TradeFinanceModule
                  tradeItems={tradeItems}
                  onOpenNewLC={() => setIsNewTxnModalOpen(true)}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Trade Finance, Guarantees & Forex"
                  requiredRoles={['Operations', 'Relationship Manager', 'Branch Manager']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}

            {activeModule === 'maker-checker' && (
              <MakerCheckerModule
                pendingAuthorizations={pendingAuthorizations}
                onApprove={handleApproveAuthorization}
                onReject={handleRejectAuthorization}
              />
            )}

            {activeModule === 'audit-regulatory' && (
              canAccessAudit ? (
                <AuditRegulatoryModule
                  auditLogs={auditLogs}
                  metrics={metrics}
                  accounts={accounts}
                  payments={payments}
                  loans={loans}
                  tradeItems={tradeItems}
                  pendingAuthorizations={pendingAuthorizations}
                />
              ) : (
                <AccessRestrictedNotice
                  moduleName="Statutory Audit & Regulatory Reporting"
                  requiredPermission="audit:read"
                  requiredRoles={['Branch Manager', 'Operations', 'Analyst', 'Compliance']}
                  onGoBack={() => handleSelectModule('dashboard')}
                />
              )
            )}
          </div>
        </main>
      </div>

      {/* Enterprise Bottom Status Bar */}
      <SystemStatusBar />

      {/* Transaction & Operational Modals */}
      <NewTransactionModal
        isOpen={isNewTxnModalOpen}
        onClose={() => setIsNewTxnModalOpen(false)}
        accounts={accounts}
        onSubmitTransaction={handleCreateTransaction}
        officerName={user?.name || 'Deepak Nambiar'}
        officerEmployeeId={user?.employeeId || 'EMP-401928'}
        terminalId="TER-MUM-0104-D"
      />

      <AccountDetailModal
        isOpen={isAccountDetailModalOpen}
        account={selectedAccount}
        onClose={() => {
          setIsAccountDetailModalOpen(false);
          setSelectedAccount(null);
        }}
        onRequestStatusChange={handleRequestStatusChange}
        onRequestLienChange={(acc) => {
          setSelectedAccount(acc);
          setIsLienModalOpen(true);
        }}
      />

      <LienMarkModal
        isOpen={isLienModalOpen}
        account={selectedAccount}
        onClose={() => {
          setIsLienModalOpen(false);
          setSelectedAccount(null);
        }}
        onSubmitLien={handleSubmitLien}
      />

      {/* Floating Gemini Banking Copilot Launcher */}
      <button
        onClick={() => toggleDrawer()}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl border border-emerald-500/40 hover:border-emerald-500 transition-all hover:scale-105 cursor-pointer group"
        title="Open COREvia Gemini Banking Copilot (F10)"
      >
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 group-hover:bg-emerald-500/40 transition-colors">
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="flex flex-col items-start leading-tight pr-1">
          <span className="text-xs font-semibold">Banking Copilot</span>
          <span className="text-[9px] text-slate-400 font-mono">F10 · Phase 14</span>
        </div>
      </button>

      {/* Global Slide-Over Copilot Drawer */}
      <CopilotDrawer onNavigate={handleNavigatePath} />

      {/* Global AI Banking Assistant Modal (Treasury & Knowledge) */}
      <AiBankingAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CopilotProvider>
        <BankingWorkplace />
      </CopilotProvider>
    </AuthProvider>
  );
}

