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
            { border: string; icon: React.ReactNode }
          > = {
            success: {
              border: 'border-l-[#16803C] dark:border-l-[#22C55E]',
              icon: <CheckCircle2 className="w-4 h-4 text-[#16803C] dark:text-[#22C55E] shrink-0" />,
            },
            warning: {
              border: 'border-l-[#B7791F] dark:border-l-[#F59E0B]',
              icon: <AlertTriangle className="w-4 h-4 text-[#B7791F] dark:text-[#F59E0B] shrink-0" />,
            },
            error: {
              border: 'border-l-[#B42318] dark:border-l-[#EF4444]',
              icon: <AlertCircle className="w-4 h-4 text-[#B42318] dark:text-[#EF4444] shrink-0" />,
            },
            info: {
              border: 'border-l-[#2563EB] dark:border-l-[#3B82F6]',
              icon: <Info className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6] shrink-0" />,
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
              className={`pointer-events-auto rounded-sm border-l-4 ${cfg.border} border border-[#DCE3EA] dark:border-[#33485D] bg-white dark:bg-[#162638] p-3 shadow-lg flex items-start justify-between gap-3`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5">{cfg.icon}</span>
                <div className="min-w-0 text-left">
                  {t.title && (
                    <h5 className="text-xs font-bold text-[#273444] dark:text-[#E8EEF5] tracking-tight uppercase">
                      {t.title}
                    </h5>
                  )}
                  <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] leading-snug break-words">
                    {t.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDismiss(t.id)}
                className="text-[#8793A1] hover:text-[#273444] dark:text-[#8194A8] dark:hover:text-[#E8EEF5] p-0.5 rounded-xs transition-colors shrink-0 cursor-pointer"
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
