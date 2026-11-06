import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { zIndex } from './tokens';
import { toastVariants } from '../../lib/motion';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, message, title, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newToast: ToastItem = { id, type, message, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => addToast({ type: 'success', message, title }),
    [addToast]
  );

  const error = useCallback(
    (message: string, title?: string) => addToast({ type: 'error', message, title, duration: 6000 }),
    [addToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => addToast({ type: 'warning', message, title }),
    [addToast]
  );

  const info = useCallback(
    (message: string, title?: string) => addToast({ type: 'info', message, title }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    // Provide safe fallback if invoked outside ToastProvider
    return {
      toasts: [],
      addToast: () => '',
      removeToast: () => {},
      success: (msg: string) => {
        console.log('[Toast Success]:', msg);
        return '';
      },
      error: (msg: string) => {
        console.error('[Toast Error]:', msg);
        return '';
      },
      warning: (msg: string) => {
        console.warn('[Toast Warning]:', msg);
        return '';
      },
      info: (msg: string) => {
        console.info('[Toast Info]:', msg);
        return '';
      },
    };
  }
  return context;
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      style={{ zIndex: zIndex.toast }}
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none px-3"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const typeConfig: Record<
            ToastType,
            { bg: string; border: string; text: string; icon: React.ReactNode }
          > = {
            success: {
              bg: 'bg-white',
              border: 'border-[#16803C]',
              text: 'text-[#14532d]',
              icon: <CheckCircle2 className="w-4 h-4 text-[#16803C] shrink-0" />,
            },
            warning: {
              bg: 'bg-white',
              border: 'border-[#B45309]',
              text: 'text-[#78350f]',
              icon: <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />,
            },
            error: {
              bg: 'bg-white',
              border: 'border-[#B42318]',
              text: 'text-[#7f1d1d]',
              icon: <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0" />,
            },
            info: {
              bg: 'bg-white',
              border: 'border-[#2563EB]',
              text: 'text-[#1e3a8a]',
              icon: <Info className="w-4 h-4 text-[#2563EB] shrink-0" />,
            },
          };

          const cfg = typeConfig[t.type];

          return (
            <motion.div
              key={t.id}
              role="status"
              layout
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`pointer-events-auto rounded-sm border-l-4 ${cfg.border} border border-[#CBD5E1] bg-white p-3 shadow-lg flex items-start justify-between gap-3`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5">{cfg.icon}</span>
                <div className="min-w-0 text-left">
                  {t.title && (
                    <h5 className="text-xs font-bold text-[#172033] tracking-tight uppercase">
                      {t.title}
                    </h5>
                  )}
                  <p className="text-xs text-[#475569] leading-snug break-words">
                    {t.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDismiss(t.id)}
                className="text-[#94A3B8] hover:text-[#172033] p-0.5 rounded-xs transition-colors shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

