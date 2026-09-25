import React, { useState, useEffect } from 'react';
import {
  Landmark,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Server,
  Activity,
  ArrowRight,
  Info,
  KeyRound,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bankingApi } from '../../lib/api';

interface LoginPageProps {
  onSuccessRedirect?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccessRedirect }) => {
  const { login, sessionExpired } = useAuth();

  const [identifier, setIdentifier] = useState<string>(() => {
    try {
      return localStorage.getItem('corevia_saved_empid') || '';
    } catch (e) {
      return '';
    }
  });
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('corevia_saved_empid');
    } catch (e) {
      return false;
    }
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState<boolean>(false);

  // States: 'idle' | 'loading' | 'error' | 'success'
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');

  // Development Synthetic Accounts Helper
  const [devAccounts, setDevAccounts] = useState<any[]>([]);
  const [devPassword, setDevPassword] = useState<string>('CoreViaDev#2026!');
  const [showDevCredentials, setShowDevCredentials] = useState<boolean>(false);

  // Load dev test credentials documentation
  useEffect(() => {
    bankingApi
      .getDevCredentials()
      .then((res) => {
        if (res.accounts) setDevAccounts(res.accounts);
        if (res.syntheticTestPassword) setDevPassword(res.syntheticTestPassword);
      })
      .catch((e) => console.warn('Could not load dev accounts helper:', e));
  }, []);

  // Caps Lock detection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isCaps = e.getModifierState && e.getModifierState('CapsLock');
    setIsCapsLockOn(isCaps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setAuthStatus('error');
      setErrorMessage('Please enter both Email / Employee ID and Password.');
      return;
    }

    setAuthStatus('loading');
    setErrorMessage('');
    setErrorCode('');

    try {
      console.log('[LoginPage] Calling login api with:', identifier.trim());
      const res = await login({ email: identifier.trim(), password: password });
      console.log('[LoginPage] Login API resolved. Response:', res);
      
      setAuthStatus('success');

      try {
        if (rememberMe) {
          localStorage.setItem('corevia_saved_empid', identifier.trim());
        } else {
          localStorage.removeItem('corevia_saved_empid');
        }
      } catch (e) {
        console.warn('localStorage is not available');
      }

      console.log('[LoginPage] Triggering onSuccessRedirect...');
      if (onSuccessRedirect) {
        onSuccessRedirect();
      }
    } catch (err: any) {
      console.error('[LoginPage] Login caught an error:', err);
      setAuthStatus('error');
      setErrorCode(err?.code || 'AUTH_ERROR');
      if (err?.message) {
        setErrorMessage(err.message);
      } else if (err?.name === 'TypeError' || err?.message?.includes('fetch')) {
        setErrorMessage('Network communication error. Unable to reach core banking authentication service.');
      } else {
        setErrorMessage('Invalid credentials. Please verify your details and try again.');
      }
    }
  };

  const handleSelectDevAccount = (acc: any) => {
    setIdentifier(acc.email);
    setPassword(devPassword);
    setErrorMessage('');
    setAuthStatus('idle');
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col justify-between font-sans selection:bg-slate-300">
      {/* Institutional Top Bar */}
      <header className="bg-[#0b1626] text-slate-300 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white font-semibold tracking-wide">
            <Landmark className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold tracking-tight">COREvia</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-normal text-xs">Core Banking System</span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-xs bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
            STAGING / UAT ENVIRONMENT
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">CBS Gateway: Operational</span>
          </div>
          <div className="text-slate-400 border-l border-slate-700 pl-3">
            TLS 1.3 | SHA-256
          </div>
        </div>
      </header>

      {/* Main Authentication Workplace */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-4">
          {/* Session Timeout Banner */}
          {sessionExpired && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded p-3.5 text-xs flex items-start gap-2.5 shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Session Timed Out</span>
                Your banking session has ended due to security policies or inactivity. Please enter your credentials to authenticate.
              </div>
            </div>
          )}

          {/* Core Banking Login Card */}
          <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
            {/* Header / Brand Header */}
            <div className="p-6 border-b border-slate-200 bg-[#fbfcfd]">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded bg-[#0b1626] flex items-center justify-center text-amber-400 shadow-2xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-xs font-semibold">
                  SECURE AUTH v2.4
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                COREvia
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Banking Relationship Management Platform
              </p>
            </div>

            {/* Error Display */}
            {authStatus === 'error' && (
              <div className="mx-6 mt-6 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Authentication Failed</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Caps Lock Alert */}
            {isCapsLockOn && (
              <div className="mx-6 mt-4 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Caps Lock is currently ON. Passwords are case-sensitive.</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Employee ID / Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="identifier-input"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  Email / Employee ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="identifier-input"
                    type="text"
                    autoComplete="username"
                    required
                    disabled={authStatus === 'loading'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. branch.manager@corevia.bank.in or EMP-BM104"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b1626] focus:border-[#0b1626] transition-colors disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password-input"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Case-Sensitive
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    disabled={authStatus === 'loading'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter security password"
                    className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b1626] focus:border-[#0b1626] transition-colors disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Terminal Policy */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#0b1626] focus:ring-[#0b1626]"
                  />
                  <span>Remember Employee ID</span>
                </label>

                <span className="text-[11px] text-slate-500 font-mono">
                  Dual-Auth Ready
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authStatus === 'loading'}
                className="w-full mt-2 py-2.5 px-4 bg-[#0b1626] hover:bg-[#152945] text-white font-medium text-sm rounded shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
              >
                {authStatus === 'loading' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating with Core CBS...</span>
                  </>
                ) : authStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Authenticated. Redirecting...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Compliance & Security Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <p className="leading-normal">
                  <strong className="text-slate-800">Authorized Banking Access Only:</strong> This workstation is connected to the core banking ledger. All access sessions, IP footprints, and officer transactions are continuously logged, monitored, and audited pursuant to RBI IT Governance Framework and the Banking Regulation Act.
                </p>
              </div>
            </div>
          </div>

          {/* Development / Evaluator Synthetic Test Accounts Toggle */}
          <div className="bg-white border border-slate-300 rounded p-3 text-xs shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                <span>Evaluation Synthetic Test Roles</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDevCredentials(!showDevCredentials)}
                className="text-blue-700 hover:text-blue-900 font-medium text-[11px] cursor-pointer"
              >
                {showDevCredentials ? 'Hide Accounts' : 'Show Test Accounts'}
              </button>
            </div>

            {showDevCredentials && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                <div className="text-[11px] text-slate-600">
                  Click any role to autofill. Synthetic dev password:{' '}
                  <code className="bg-slate-100 text-slate-900 px-1 py-0.5 rounded font-mono font-bold">
                    {devPassword}
                  </code>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {devAccounts.map((acc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDevAccount(acc)}
                      className="text-left p-2 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-[11px] group-hover:text-blue-900">
                          {acc.roleTitle}
                        </span>
                        <span className="font-mono text-[9px] px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {acc.employeeId}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {acc.email}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Institutional Legal Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          COREvia Banking Technologies &copy; {new Date().getFullYear()} &bull; Enterprise Relationship Management
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Terminal Node: MUM-FORT-CBS-01 &bull; Port 3000
        </div>
      </footer>
    </div>
  );
};
