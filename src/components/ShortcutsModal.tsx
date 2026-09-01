import React from 'react';
import { createPortal } from 'react-dom';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K / Cmd + K', description: 'Open Command Palette' },
    { key: 'Ctrl + N', description: 'Create New Tab' },
    { key: 'Ctrl + O', description: 'Open Text File...' },
    { key: 'Ctrl + S', description: 'Save Text File' },
    { key: 'F5', description: 'Insert Time/Date Timestamp' },
    { key: 'Esc', description: 'Close Modals / Exit Focus Mode' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-[var(--text-primary)]">
      <div className="animate-modal-enter relative w-full max-w-md p-6 rounded-2xl glass-panel border border-[var(--border-highlight)] shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-[var(--accent)] font-semibold text-lg">
            <Keyboard className="w-5 h-5" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-sm text-[var(--text-secondary)]">{sc.description}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-[var(--bg-secondary)] text-[var(--accent)] border border-[var(--border-color)] shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
