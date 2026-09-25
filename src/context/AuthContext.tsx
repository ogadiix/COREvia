import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { bankingApi, setSessionToken, getSessionToken } from '../lib/api';
import { InactivityWarningModal } from '../components/modals/InactivityWarningModal';

export interface AuthUser {
  id: number;
  uid: string;
  employeeId: string;
  email: string;
  name: string;
  role: string;
  roleName: string;
  department: string;
  status: string;
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  logout: (reason?: string) => Promise<void>;
  extendSession: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: string[]) => boolean;
  inactivityTimeoutSeconds: number;
  idleRemainingSeconds: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Banking compliance standard: 15 minutes of inactivity before terminal auto-lock
const DEFAULT_INACTIVITY_TIMEOUT_SECONDS = 15 * 60; // 900 seconds
const WARNING_BEFORE_TIMEOUT_SECONDS = 60; // 60-second warning countdown before termination

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);

  // Inactivity tracking states
  const [showInactivityWarning, setShowInactivityWarning] = useState<boolean>(false);
  const [warningRemainingSeconds, setWarningRemainingSeconds] = useState<number>(WARNING_BEFORE_TIMEOUT_SECONDS);
  const [idleRemainingSeconds, setIdleRemainingSeconds] = useState<number>(DEFAULT_INACTIVITY_TIMEOUT_SECONDS);

  const lastActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  // Check current session on initial application load
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await bankingApi.getMe();
      if (res && res.user) {
        setUser(res.user);
        setSessionExpired(false);
        lastActivityRef.current = Date.now();
      } else {
        setUser(null);
      }
    } catch (err: any) {
      setUser(null);
      if (err?.status === 401) {
        if (getSessionToken()) {
          setSessionExpired(true);
        }
        setSessionToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (credentials: { email: string; password: string }) => {
    console.log('[AuthContext] login started');
    setIsLoading(true);
    setSessionExpired(false);
    setShowInactivityWarning(false);
    lastActivityRef.current = Date.now();
    try {
      const res = await bankingApi.login(credentials);
      console.log('[AuthContext] login res:', res);
      if (res && res.user) {
        console.log('[AuthContext] Setting user from res.user:', res.user);
        setUser(res.user);
      } else {
        const meRes = await bankingApi.getMe();
        console.log('[AuthContext] Setting user from getMe:', meRes.user);
        setUser(meRes.user);
      }
      lastActivityRef.current = Date.now();
      return res;
    } catch (e) {
      console.error('[AuthContext] login error:', e);
      throw e;
    } finally {
      console.log('[AuthContext] login finally, setting isLoading false');
      setIsLoading(false);
    }
  };

  // Logout handler (supports reason: 'MANUAL_USER_LOGOUT' | 'INACTIVITY_TIMEOUT')
  const logout = useCallback(async (reason: string = 'MANUAL_USER_LOGOUT') => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setIsLoading(true);
    setShowInactivityWarning(false);

    try {
      await bankingApi.logout(reason);
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      setUser(null);
      setSessionToken(null);
      setIsLoading(false);
      isLoggingOutRef.current = false;
      if (reason === 'INACTIVITY_TIMEOUT') {
        setSessionExpired(true);
      }
    }
  }, []);

  // Extend session: sends heartbeat to backend and resets idle timer
  const extendSession = useCallback(async () => {
    lastActivityRef.current = Date.now();
    setShowInactivityWarning(false);
    setWarningRemainingSeconds(WARNING_BEFORE_TIMEOUT_SECONDS);
    setIdleRemainingSeconds(DEFAULT_INACTIVITY_TIMEOUT_SECONDS);

    try {
      await bankingApi.heartbeat();
    } catch (e) {
      console.warn('Failed to heartbeat backend:', e);
    }
  }, []);

  // Activity listener setup: monitors user interaction across the browser window
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    let lastThrottledTime = Date.now();

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle activity event processing to at most once per second
      if (now - lastThrottledTime < 1000) return;
      lastThrottledTime = now;

      // Only reset lastActivityRef if the critical warning modal is not currently open
      // (If warning is open, officer must explicitly click "Extend Banking Session" or type to acknowledge)
      if (!showInactivityWarning) {
        lastActivityRef.current = now;
      }
    };

    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
    };
  }, [user, showInactivityWarning]);

  // Inactivity monitor ticker: checks every 1000ms
  useEffect(() => {
    if (!user) {
      setShowInactivityWarning(false);
      return;
    }

    const interval = setInterval(() => {
      if (isLoggingOutRef.current) return;

      const idleMs = Date.now() - lastActivityRef.current;
      const totalTimeoutMs = DEFAULT_INACTIVITY_TIMEOUT_SECONDS * 1000;
      const warningThresholdMs = (DEFAULT_INACTIVITY_TIMEOUT_SECONDS - WARNING_BEFORE_TIMEOUT_SECONDS) * 1000;

      const remainingTotalSec = Math.max(0, Math.ceil((totalTimeoutMs - idleMs) / 1000));
      setIdleRemainingSeconds(remainingTotalSec);

      if (idleMs >= totalTimeoutMs) {
        // Inactivity timeout exceeded! Trigger secure automated logout immediately
        console.warn('Banking security policy enforced: Inactivity timeout reached. Auto-logging out.');
        clearInterval(interval);
        logout('INACTIVITY_TIMEOUT');
      } else if (idleMs >= warningThresholdMs) {
        // Inactivity warning phase: display countdown
        const warningSecs = Math.max(0, Math.ceil((totalTimeoutMs - idleMs) / 1000));
        setWarningRemainingSeconds(warningSecs);
        setShowInactivityWarning(true);
      } else {
        setShowInactivityWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, logout]);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMINISTRATOR' || user.permissions?.includes('admin:all')) {
      return true;
    }
    return user.permissions?.includes(permission) || false;
  };

  const hasRole = (...roles: string[]): boolean => {
    if (!user) return false;
    if (user.role === 'ADMINISTRATOR') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        sessionExpired,
        login,
        logout,
        extendSession,
        hasPermission,
        hasRole,
        inactivityTimeoutSeconds: DEFAULT_INACTIVITY_TIMEOUT_SECONDS,
        idleRemainingSeconds,
      }}
    >
      {children}

      {/* Institutional Inactivity Warning Modal */}
      {user && (
        <InactivityWarningModal
          isOpen={showInactivityWarning}
          remainingSeconds={warningRemainingSeconds}
          totalWarningSeconds={WARNING_BEFORE_TIMEOUT_SECONDS}
          onExtendSession={extendSession}
          onLogoutNow={() => logout('MANUAL_LOGOUT_FROM_WARNING')}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
