import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ToastMessage } from '../hooks/useNotes';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => onClose(), 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const styles = {
    success: {
      card: 'bg-emerald-500 text-white',
      icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-100" />,
      close: 'hover:bg-emerald-400/40 text-emerald-100',
    },
    warning: {
      card: 'bg-rose-500 text-white',
      icon: <AlertCircle className="w-4 h-4 shrink-0 text-rose-100" />,
      close: 'hover:bg-rose-400/40 text-rose-100',
    },
    info: {
      card: 'bg-blue-600 text-white',
      icon: <Info className="w-4 h-4 shrink-0 text-blue-100" />,
      close: 'hover:bg-blue-400/40 text-blue-100',
    },
  };

  const s = styles[toast.type || 'info'];

  return createPortal(
    /* Fixed full-width row pinned to top — no transform conflicts */
    <div className="fixed top-6 left-0 right-0 z-[110] flex justify-center pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl min-w-[260px] max-w-sm animate-slide-down ${s.card}`}
        style={{ fontFamily: 'Inter, Segoe UI, sans-serif' }}
      >
        {s.icon}
        <span className="flex-1 text-sm font-medium leading-tight">
          {toast.text}
        </span>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition shrink-0 ${s.close}`}
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>,
    document.body
  );
};
