import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = { success: Check, error: AlertTriangle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (type, message, ms = 4000) => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), ms);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m, 6000),
      info: (m) => push('info', m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.18 }}
                className={`pointer-events-auto flex items-start gap-3 border-l-4 bg-ink-800 px-4 py-3 text-sm text-bone shadow-2xl ${
                  t.type === 'error' ? 'border-blood-400' : t.type === 'success' ? 'border-bone' : 'border-ink-400'
                }`}
                role={t.type === 'error' ? 'alert' : 'status'}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${t.type === 'error' ? 'text-blood-400' : ''}`} aria-hidden />
                <p className="flex-1 leading-snug">{t.message}</p>
                <button onClick={() => dismiss(t.id)} className="text-ink-300 hover:text-white" aria-label="Dismiss notification">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  return ctx;
}
