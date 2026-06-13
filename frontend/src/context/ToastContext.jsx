import { createContext, useContext, useMemo, useState } from 'react';
import { CheckCircle2, TriangleAlert, Info } from 'lucide-react';

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const pushToast = (toast) => {
    const id = globalThis.crypto?.randomUUID?.() || `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, tone: 'info', ...toast }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, toast.duration || 2800);
  };

  const value = useMemo(() => ({ pushToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[70] flex w-[min(92vw,24rem)] flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = icons[toast.tone] || Info;
          return (
            <div key={toast.id} className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <Icon size={18} className={toast.tone === 'success' ? 'text-emerald-500' : toast.tone === 'error' ? 'text-red-500' : 'text-blue-500'} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--ui-text)]">{toast.title}</p>
                  {toast.message ? <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{toast.message}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
