import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  KeyRound,
  ShieldAlert,
  Server,
  Activity,
  Layers,
  Scale,
  Sparkles,
  Network,
  Cpu,
  FileCheck,
  X,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { bankingApi } from '../../lib/api';
import { ThemeSwitcher } from '../common/ThemeSwitcher';

interface LoginPageProps {
  onSuccessRedirect?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccessRedirect }) => {
  const { login, sessionExpired } = useAuth();
  const { isDark, theme } = useTheme();

  // Form states
  const [identifier, setIdentifier] = useState<string>(() => {
    try {
      return localStorage.getItem('corevia_saved_empid') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('corevia_saved_empid');
    } catch {
      return false;
    }
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState<boolean>(false);

  // Validation & status: 'idle' | 'loading' | 'error' | 'success'
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{ identifier?: string; password?: string }>({});

  // Synthetic Test Roles Helper
  const [devAccounts, setDevAccounts] = useState<any[]>([]);
  const [devPassword, setDevPassword] = useState<string>('CoreViaDev#2026!');
  const [showDevCredentials, setShowDevCredentials] = useState<boolean>(false);

  // Security & Compliance Protocol Drawer/Modal
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);

  // Load synthetic test credentials
  useEffect(() => {
    bankingApi
      .getDevCredentials()
      .then((res) => {
        if (res.accounts) setDevAccounts(res.accounts);
        if (res.syntheticTestPassword) setDevPassword(res.syntheticTestPassword);
      })
      .catch((e) => console.warn('Could not load synthetic accounts helper:', e));
  }, []);

  // Monitor Caps Lock dynamically
  const handleKeyActivity = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  }, []);

  const validateForm = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      errors.identifier = 'Officer Email or Employee Identifier is required.';
    }
    if (!password) {
      errors.password = 'Workstation security password is required.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setAuthStatus('error');
      setErrorMessage('Please provide both credentials to establish an authenticated session.');
      return;
    }

    setAuthStatus('loading');
    setErrorMessage('');
    setErrorCode('');
    setValidationErrors({});

    try {
      await login({ email: identifier.trim(), password });
      setAuthStatus('success');

      // Update employee ID local storage preference safely
      try {
        if (rememberMe) {
          localStorage.setItem('corevia_saved_empid', identifier.trim());
        } else {
          localStorage.removeItem('corevia_saved_empid');
        }
      } catch {
        // Ignored in strict sandbox environments
      }

      if (onSuccessRedirect) {
        onSuccessRedirect();
      }
    } catch (err: any) {
      console.error('[LoginPage] Authentication failed:', err);
      setAuthStatus('error');
      setErrorCode(err?.code || 'AUTH_REJECTED');
      if (err?.message) {
        setErrorMessage(err.message);
      } else if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
        setErrorMessage('Network connection error: Unable to contact CBS Authentication Authority.');
      } else {
        setErrorMessage('Invalid corporate credentials. Verify your officer identity and workstation password.');
      }
    }
  };

  const handleSelectDevAccount = (acc: any) => {
    setIdentifier(acc.email);
    setPassword(devPassword);
    setValidationErrors({});
    setErrorMessage('');
    setErrorCode('');
    setAuthStatus('idle');
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#080F19] text-[#273444] dark:text-[#E8EEF5] flex flex-col justify-between font-sans selection:bg-[#168C83]/20 transition-colors duration-200">
      {/* =========================================================================
          1. INSTITUTIONAL TOP APPLICATION BAR
          ========================================================================= */}
      <header className="bg-white/95 dark:bg-[#101C2A]/95 backdrop-blur-md border-b border-[#DCE3EA] dark:border-[#33485D] px-4 sm:px-8 py-2.5 flex items-center justify-between text-xs sticky top-0 z-30 shadow-2xs">
        {/* Left: Brand Monogram & Classification */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#142C45] dark:bg-[#168C83] flex items-center justify-center text-white shadow-xs border border-[#142C45] dark:border-[#168C83]">
              <Landmark className="w-4 h-4 text-[#D9A441] dark:text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 leading-none">
                <span className="text-sm font-bold tracking-tight text-[#142C45] dark:text-[#E8EEF5]">
                  COREvia
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-xs bg-[#EDF1F5] dark:bg-[#1C3045] text-[#168C83] dark:text-[#2dd4c7] border border-[#DCE3EA] dark:border-[#33485D] uppercase tracking-wider">
                  INSTITUTIONAL CRM
                </span>
              </div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#8194A8] font-medium tracking-tight">
                Scheduled Commercial Banking Platform
              </span>
            </div>
          </div>
        </div>

        {/* Right: CBS Telemetry, Security Protocol Trigger & Theme Switcher */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Security Telemetry Badge */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-[#5D6B7B] dark:text-[#A9BACB] bg-[#EDF1F5] dark:bg-[#162638] px-2.5 py-1 rounded-sm border border-[#DCE3EA] dark:border-[#33485D]">
            <span className="w-2 h-2 rounded-full bg-[#16803C] dark:bg-[#22C55E] animate-pulse" />
            <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">CBS GATEWAY: ONLINE</span>
            <span className="text-[#8793A1] dark:text-[#8194A8]">&bull;</span>
            <span>TLS 1.3 · AES-256</span>
          </div>

          {/* Security Protocol Info Trigger */}
          <button
            type="button"
            onClick={() => setShowSecurityModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#5D6B7B] hover:text-[#142C45] dark:text-[#A9BACB] dark:hover:text-[#E8EEF5] bg-transparent hover:bg-[#EDF1F5] dark:hover:bg-[#162638] rounded-sm transition-colors cursor-pointer border border-transparent hover:border-[#DCE3EA] dark:hover:border-[#33485D]"
            title="View Institutional Security Protocols"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#168C83] dark:text-[#2dd4c7]" />
            <span className="hidden sm:inline">Security Architecture</span>
          </button>

          <div className="h-4 w-px bg-[#DCE3EA] dark:bg-[#33485D]" />

          {/* Theme Switcher Segmented Control */}
          <ThemeSwitcher variant="segmented" />
        </div>
      </header>

      {/* =========================================================================
          2. MAIN SPLIT-SCREEN EXECUTIVE CONSOLE
          ========================================================================= */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-md shadow-xl overflow-hidden transition-all duration-200">
          {/* =========================================================================
              LEFT PANEL: INSTITUTIONAL BRAND SHOWCASE & REGULATORY CREDENTIALS
              ========================================================================= */}
          <div className="hidden lg:flex lg:col-span-5 bg-[#142C45] dark:bg-[#101C2A] text-white p-8 flex-col justify-between relative overflow-hidden border-r border-[#101C2A] dark:border-[#33485D]">
            {/* Subtle institutional micro-grid pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="w-96 h-96 rounded-full border border-[#D9A441] -top-24 -left-24 absolute" />
              <div className="w-[450px] h-[450px] rounded-full border border-[#168C83] -bottom-36 -right-36 absolute" />
              <div className="w-full h-full bg-[radial-gradient(#168C83_1.2px,transparent_1.2px)] [background-size:18px_18px]" />
            </div>

            {/* Header Crest & Mission Statement */}
            <div className="relative z-10 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-[#168C83] flex items-center justify-center text-white shadow-sm border border-[#1B9D92]/40">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold tracking-tight text-white font-sans">COREvia</span>
                    <span className="text-[9px] font-mono uppercase bg-[#168C83]/30 text-[#2dd4c7] px-1.5 py-0.5 rounded-xs border border-[#168C83]/40">
                      Tier 1
                    </span>
                  </div>
                  <p className="text-[10px] text-[#A9BACB] font-mono tracking-wider uppercase">
                    Scheduled Commercial Banking
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight text-white leading-snug">
                  Modern Institutional Banking Architecture
                </h2>
                <p className="text-xs text-[#A9BACB] leading-relaxed">
                  Mission-critical relationship management, credit governance, and real-time portfolio intelligence engineered for institutional officers under Reserve Bank of India regulatory directives.
                </p>
              </div>

              {/* Institutional Pillars */}
              <div className="space-y-2.5 pt-1">
                {/* Pillar 1 */}
                <div className="flex items-start gap-3 p-3 rounded-sm bg-[#162638]/70 dark:bg-[#162638]/90 border border-[#33485D]/70 backdrop-blur-xs">
                  <div className="p-1 rounded-xs bg-[#168C83]/20 text-[#2dd4c7] mt-0.5 shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Relationship Intelligence (RI-v1)</h3>
                    <p className="text-[11px] text-[#A9BACB] mt-0.5 leading-snug">
                      Explainable CORE Score modeling (0–1000), real-time churn risk indicators, and predictive opportunity radar.
                    </p>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="flex items-start gap-3 p-3 rounded-sm bg-[#162638]/70 dark:bg-[#162638]/90 border border-[#33485D]/70 backdrop-blur-xs">
                  <div className="p-1 rounded-xs bg-[#D9A441]/20 text-[#D9A441] mt-0.5 shrink-0">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Maker-Checker Dual Governance</h3>
                    <p className="text-[11px] text-[#A9BACB] mt-0.5 leading-snug">
                      Mandatory four-eyes principle workflow with cryptographic SHA-256 hash chains for all transaction approvals.
                    </p>
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="flex items-start gap-3 p-3 rounded-sm bg-[#162638]/70 dark:bg-[#162638]/90 border border-[#33485D]/70 backdrop-blur-xs">
                  <div className="p-1 rounded-xs bg-[#2563EB]/20 text-[#60a5fa] mt-0.5 shrink-0">
                    <Network className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Entity Graph & Digital Twin</h3>
                    <p className="text-[11px] text-[#A9BACB] mt-0.5 leading-snug">
                      Topological corporate group mapping, beneficial ownership analysis, and scenario-based stress testing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Compliance Seals & Node Info */}
            <div className="relative z-10 pt-4 border-t border-[#33485D]/80 space-y-3">
              <div className="flex items-center justify-between text-[10px] text-[#A9BACB] font-mono">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3 h-3 text-[#168C83]" />
                  <span>NODE: MUM-FORT-01</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[#22C55E]" />
                  <span>LATENCY: &lt;12ms</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap text-[9px] text-[#8194A8] font-mono uppercase tracking-wider">
                <span className="px-1.5 py-0.5 rounded-xs bg-[#101C2A] border border-[#33485D]">RBI CSF Cat-IV</span>
                <span className="px-1.5 py-0.5 rounded-xs bg-[#101C2A] border border-[#33485D]">ISO 27001:2022</span>
                <span className="px-1.5 py-0.5 rounded-xs bg-[#101C2A] border border-[#33485D]">SOC-2 Type II</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              RIGHT PANEL: AUTHENTICATION CONSOLE
              ========================================================================= */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6 bg-white dark:bg-[#162638]">
            <div className="space-y-5">
              {/* Header Title Section */}
              <div className="border-b border-[#DCE3EA] dark:border-[#26394C] pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-xs bg-[#EDF1F5] dark:bg-[#101C2A] text-[#168C83] dark:text-[#2dd4c7] border border-[#DCE3EA] dark:border-[#33485D] uppercase tracking-wider">
                    <Lock className="w-3 h-3" />
                    RESTRICTED WORKSTATION TERMINAL
                  </span>
                  <span className="text-[10px] font-mono text-[#8793A1] dark:text-[#8194A8]">
                    v3.0 Production
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#273444] dark:text-[#E8EEF5]">
                  Officer Authentication
                </h1>
                <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-1 leading-relaxed">
                  Enter your core banking credentials to initialize an authenticated, cryptographically logged session.
                </p>
              </div>

              {/* Session Expired Alert */}
              {sessionExpired && (
                <div
                  role="alert"
                  className="bg-[#FEFCE8] dark:bg-[#341A04] border border-[#FEF08A] dark:border-[#B45309] text-[#B7791F] dark:text-[#F59E0B] rounded-sm p-3 text-xs flex items-start gap-2.5 shadow-2xs"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Session Inactivity Timeout</span>
                    Your previous banking session timed out pursuant to RBI mandatory inactivity controls (15-minute threshold). Please re-authenticate.
                  </div>
                </div>
              )}

              {/* Rejection / Error Alert */}
              {authStatus === 'error' && (
                <div
                  role="alert"
                  className="p-3 bg-[#FEF2F2] dark:bg-[#370B0B] border border-[#FECACA] dark:border-[#B91C1C] rounded-sm text-xs text-[#B42318] dark:text-[#EF4444] flex items-start gap-2.5 shadow-2xs"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">
                      Authentication Failure {errorCode ? `[${errorCode}]` : ''}
                    </span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Real-time Caps Lock Detection Warning */}
              {isCapsLockOn && (
                <div
                  role="status"
                  className="p-2.5 bg-[#FEFCE8] dark:bg-[#341A04] border border-[#FEF08A] dark:border-[#B45309] rounded-sm text-xs text-[#B7791F] dark:text-[#F59E0B] flex items-center gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium">Caps Lock is active. Passwords are strictly case-sensitive.</span>
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* 1. Email / Employee ID Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="identifier-input"
                      className="block text-xs font-semibold text-[#273444] dark:text-[#E8EEF5] uppercase tracking-wider"
                    >
                      Officer Email or Employee ID <span className="text-[#B42318] dark:text-[#EF4444]">*</span>
                    </label>
                    <span className="text-[10px] text-[#8793A1] dark:text-[#8194A8] font-mono">
                      Domain: @corevia.bank.in
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8793A1] dark:text-[#8194A8]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="identifier-input"
                      type="text"
                      autoComplete="username"
                      required
                      disabled={authStatus === 'loading'}
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (validationErrors.identifier) {
                          setValidationErrors((prev) => ({ ...prev, identifier: undefined }));
                        }
                      }}
                      placeholder="e.g. admin@corevia.bank.in or EMP-ADM001"
                      className={`w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#101C2A] border ${
                        validationErrors.identifier
                          ? 'border-[#B42318] dark:border-[#EF4444] ring-1 ring-[#B42318] dark:ring-[#EF4444]'
                          : 'border-[#DCE3EA] dark:border-[#33485D]'
                      } rounded-sm text-[#273444] dark:text-[#E8EEF5] placeholder:text-[#8793A1] dark:placeholder:text-[#8194A8] focus:outline-none focus:ring-2 focus:ring-[#168C83] focus:border-[#168C83] transition-colors disabled:bg-[#EDF1F5] dark:disabled:bg-[#162638] font-sans`}
                    />
                    {identifier && (
                      <button
                        type="button"
                        onClick={() => setIdentifier('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8793A1] hover:text-[#273444] dark:text-[#8194A8] dark:hover:text-[#E8EEF5] cursor-pointer"
                        title="Clear field"
                        aria-label="Clear identifier field"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {validationErrors.identifier && (
                    <p className="text-[11px] text-[#B42318] dark:text-[#EF4444] mt-0.5">
                      {validationErrors.identifier}
                    </p>
                  )}
                </div>

                {/* 2. Security Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password-input"
                      className="block text-xs font-semibold text-[#273444] dark:text-[#E8EEF5] uppercase tracking-wider"
                    >
                      Workstation Security Password <span className="text-[#B42318] dark:text-[#EF4444]">*</span>
                    </label>
                    <span className="text-[10px] text-[#8793A1] dark:text-[#8194A8] font-mono">
                      FIPS 140-3 Compliant
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8793A1] dark:text-[#8194A8]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      disabled={authStatus === 'loading'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (validationErrors.password) {
                          setValidationErrors((prev) => ({ ...prev, password: undefined }));
                        }
                      }}
                      onKeyDown={handleKeyActivity}
                      onKeyUp={handleKeyActivity}
                      placeholder="Enter workstation password"
                      className={`w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-white dark:bg-[#101C2A] border ${
                        validationErrors.password
                          ? 'border-[#B42318] dark:border-[#EF4444] ring-1 ring-[#B42318] dark:ring-[#EF4444]'
                          : 'border-[#DCE3EA] dark:border-[#33485D]'
                      } rounded-sm text-[#273444] dark:text-[#E8EEF5] placeholder:text-[#8793A1] dark:placeholder:text-[#8194A8] focus:outline-none focus:ring-2 focus:ring-[#168C83] focus:border-[#168C83] transition-colors disabled:bg-[#EDF1F5] dark:disabled:bg-[#162638] font-sans`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8793A1] hover:text-[#273444] dark:text-[#8194A8] dark:hover:text-[#E8EEF5] transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-[11px] text-[#B42318] dark:text-[#EF4444] mt-0.5">
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                {/* 3. Station Settings & Policy Notice */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#5D6B7B] dark:text-[#A9BACB] select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded-xs border-[#DCE3EA] dark:border-[#33485D] text-[#168C83] focus:ring-[#168C83] cursor-pointer"
                    />
                    <span>Remember Employee ID</span>
                  </label>

                  <span className="text-[11px] text-[#168C83] dark:text-[#2dd4c7] font-mono font-medium">
                    Session Timeout: 15m
                  </span>
                </div>

                {/* 4. Action Submission Button */}
                <button
                  type="submit"
                  disabled={authStatus === 'loading'}
                  className="w-full mt-2 py-2.5 px-4 bg-[#142C45] hover:bg-[#101C2A] dark:bg-[#168C83] dark:hover:bg-[#1B9D92] text-white font-medium text-xs sm:text-sm rounded-sm shadow-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
                >
                  {authStatus === 'loading' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating with CBS Security Gateway...</span>
                    </>
                  ) : authStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Credentials Verified · Initializing Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Institutional Workplace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* =========================================================================
                SYNTHETIC EVALUATION ROLES DRAWER (DEV / DEMO ACCORDION)
                ========================================================================= */}
            <div className="border border-[#DCE3EA] dark:border-[#33485D] rounded-sm bg-[#F8FAFC] dark:bg-[#101C2A] p-3 text-xs transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#273444] dark:text-[#E8EEF5] font-semibold">
                  <KeyRound className="w-3.5 h-3.5 text-[#168C83] dark:text-[#2dd4c7]" />
                  <span>Evaluation & Sandbox Personas</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDevCredentials(!showDevCredentials)}
                  className="text-[#168C83] hover:text-[#1B9D92] dark:text-[#2dd4c7] font-medium text-[11px] cursor-pointer flex items-center gap-1"
                >
                  <span>{showDevCredentials ? 'Hide Roles' : 'View 6 Pre-Configured Personas'}</span>
                </button>
              </div>

              {showDevCredentials && (
                <div className="mt-3 pt-3 border-t border-[#DCE3EA] dark:border-[#26394C] space-y-2.5">
                  <div className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] flex items-center justify-between flex-wrap gap-1">
                    <span>Click any officer persona to auto-fill credentials:</span>
                    <span className="font-mono text-[10px] text-[#8793A1] dark:text-[#8194A8]">
                      Password:{' '}
                      <code className="bg-white dark:bg-[#162638] text-[#142C45] dark:text-[#D9A441] px-1.5 py-0.5 rounded-xs font-mono font-bold border border-[#DCE3EA] dark:border-[#33485D]">
                        {devPassword}
                      </code>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {devAccounts.map((acc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDevAccount(acc)}
                        className="text-left p-2 rounded-xs border border-[#DCE3EA] dark:border-[#33485D] bg-white dark:bg-[#162638] hover:border-[#168C83] dark:hover:border-[#168C83] hover:shadow-2xs transition-all group cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#273444] dark:text-[#E8EEF5] text-[11px] group-hover:text-[#168C83] dark:group-hover:text-[#2dd4c7]">
                            {acc.roleTitle}
                          </span>
                          <span className="font-mono text-[9px] px-1 py-0.2 bg-[#EDF1F5] dark:bg-[#101C2A] text-[#5D6B7B] dark:text-[#A9BACB] rounded-xs border border-[#DCE3EA] dark:border-[#26394C]">
                            {acc.employeeId}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8793A1] dark:text-[#8194A8] font-mono truncate mt-0.5">
                          {acc.email}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Legal / Regulatory Notice */}
            <div className="pt-2 border-t border-[#DCE3EA] dark:border-[#26394C] text-[10px] text-[#8793A1] dark:text-[#8194A8] flex items-start gap-1.5 leading-normal">
              <Info className="w-3.5 h-3.5 shrink-0 text-[#168C83] mt-0.5" />
              <span>
                <strong>Official Banking Notice:</strong> This terminal is restricted to authorized officers. All authentication attempts and subsequent data queries are cryptographically recorded in accordance with the Information Technology Act and RBI IT Governance Directives.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          3. INSTITUTIONAL LEGAL & TELEMETRY FOOTER
          ========================================================================= */}
      <footer className="bg-white/95 dark:bg-[#101C2A]/95 backdrop-blur-md border-t border-[#DCE3EA] dark:border-[#33485D] px-6 py-2.5 text-center text-xs text-[#5D6B7B] dark:text-[#A9BACB] flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs">
        <div>
          COREvia Banking Technologies &copy; {new Date().getFullYear()} &bull; Modern Institutional Banking CRM
        </div>
        <div className="font-mono text-[11px] text-[#8793A1] dark:text-[#8194A8] flex items-center gap-3">
          <span>Node: MUM-FORT-CBS-01</span>
          <span>&bull;</span>
          <span>Active Theme: {theme.toUpperCase()}</span>
          <span>&bull;</span>
          <span className="text-[#16803C] dark:text-[#22C55E] font-semibold">&bull; SECURE GATEWAY</span>
        </div>
      </footer>

      {/* =========================================================================
          4. INSTITUTIONAL SECURITY ARCHITECTURE MODAL
          ========================================================================= */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#DCE3EA] dark:border-[#26394C] bg-[#F8FAFC] dark:bg-[#101C2A]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#168C83] dark:text-[#2dd4c7]" />
                <h3 className="text-sm font-bold text-[#273444] dark:text-[#E8EEF5]">
                  COREvia Institutional Security Architecture
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSecurityModal(false)}
                className="p-1 text-[#8793A1] hover:text-[#273444] dark:text-[#8194A8] dark:hover:text-[#E8EEF5] rounded-xs cursor-pointer"
                title="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-[#5D6B7B] dark:text-[#A9BACB] max-h-[75vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-semibold text-[#273444] dark:text-[#E8EEF5] mb-1">
                  1. Zero-Trust Access & Session Isolation
                </h4>
                <p className="leading-relaxed text-[11px]">
                  All session tokens are managed as strictly HttpOnly, SameSite=Strict cookies with cryptographic validation. No session secrets or bearer tokens are ever exposed to browser script execution or client-side storage.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#273444] dark:text-[#E8EEF5] mb-1">
                  2. Maker-Checker Dual Control (Four-Eyes Principle)
                </h4>
                <p className="leading-relaxed text-[11px]">
                  High-value credit facilities, entity risk restructuring, and administrative user modifications mandate two independent officer signatures: Maker submission followed by Checker verification.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#273444] dark:text-[#E8EEF5] mb-1">
                  3. Tamper-Evident SHA-256 Audit Chaining
                </h4>
                <p className="leading-relaxed text-[11px]">
                  Every balance modification, decision trace, and administrative action is appended with a cryptographic SHA-256 hash linked to the previous state, rendering unauthorized audit alterations mathematically detectable.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#273444] dark:text-[#E8EEF5] mb-1">
                  4. Regulatory Compliance & IT Governance
                </h4>
                <p className="leading-relaxed text-[11px]">
                  Designed to adhere to Reserve Bank of India (RBI) Master Direction on Information Technology Governance, Risk, Controls and Assurance Practices, and ISO/IEC 27001:2022 standards.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] dark:bg-[#101C2A] border-t border-[#DCE3EA] dark:border-[#26394C] flex justify-end">
              <button
                type="button"
                onClick={() => setShowSecurityModal(false)}
                className="px-3.5 py-1.5 bg-[#142C45] dark:bg-[#168C83] text-white text-xs font-medium rounded-sm cursor-pointer hover:bg-[#101C2A] dark:hover:bg-[#1B9D92] transition-colors"
              >
                Close Protocol Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
