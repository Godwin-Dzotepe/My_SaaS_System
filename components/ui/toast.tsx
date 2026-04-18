'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    const timer = setTimeout(() => remove(id), 4000);
    timers.current.set(id, timer);
  }, [remove]);

  const value = React.useMemo(() => ({
    toast,
    success: (m: string) => toast(m, 'success'),
    error:   (m: string) => toast(m, 'error'),
    info:    (m: string) => toast(m, 'info'),
  }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl text-sm font-medium ${
                t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                t.type === 'error'   ? 'bg-red-50 border-red-200 text-red-800' :
                                       'bg-white border-gray-200 text-gray-800'
              }`}
            >
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />}
              {t.type === 'error'   && <XCircle      className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />}
              {t.type === 'info'    && <Info         className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />}
              <span className="flex-1 leading-5">{t.message}</span>
              <button onClick={() => remove(t.id)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
