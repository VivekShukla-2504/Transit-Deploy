import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = 'info', duration = 3500) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      const newToast = { id, message, type, duration };

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

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration || 4500),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Floating Toast Container */}
      <aside
        aria-label="Notifications"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => {
          let borderClass = 'border-signal-500/30';
          let bgClass = 'bg-base-900/95';
          let textClass = 'text-base-100';
          let icon = <Info className="h-5 w-5 text-signal-500 shrink-0" />;

          if (item.type === 'success') {
            borderClass = 'border-ok-500/40';
            icon = <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
          } else if (item.type === 'error') {
            borderClass = 'border-danger-500/40';
            icon = <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />;
          } else if (item.type === 'warning') {
            borderClass = 'border-warn-500/40';
            icon = <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
          }

          return (
            <div
              key={item.id}
              role="alert"
              className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border ${borderClass} ${bgClass} p-3.5 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 duration-200`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {icon}
                <p className={`text-xs font-medium leading-relaxed ${textClass} break-words`}>
                  {item.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="rounded-lg p-1 text-base-400 hover:bg-base-800 hover:text-base-200 transition shrink-0"
                aria-label="Dismiss toast"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

