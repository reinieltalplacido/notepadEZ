import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="animate-modal-enter relative w-full max-w-sm p-6 rounded-2xl glass-panel border border-[var(--border-highlight)] shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
            <AlertTriangle className={`w-4 h-4 ${isDanger ? 'text-rose-400' : 'text-amber-400'}`} />
            <span>{title}</span>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Content */}
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{message}</p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)] transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold text-white shadow-md transition flex items-center gap-1.5 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-[var(--accent-glow)]'
            }`}
          >
            {isDanger && <Trash2 className="w-3.5 h-3.5" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
