import React, { useState, useEffect, useRef } from 'react';
import { Link, X, Check } from 'lucide-react';

interface LinkInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, text?: string) => void;
  initialText?: string;
}

export const LinkInsertModal: React.FC<LinkInsertModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialText = '',
}) => {
  const [url, setUrl] = useState('https://');
  const [displayText, setDisplayText] = useState(initialText);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl('https://');
      setDisplayText(initialText);
      setTimeout(() => {
        if (urlInputRef.current) {
          urlInputRef.current.focus();
          urlInputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onInsert(url.trim(), displayText.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div
        className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
              <Link className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Insert Web Link</h3>
              <p className="text-xs text-[var(--text-secondary)]">Add a clickable link to your note</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Link Text (Optional)</label>
            <input
              type="text"
              value={displayText}
              onChange={(e) => setDisplayText(e.target.value)}
              placeholder="e.g. Visit Website"
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Web URL</label>
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 shadow-md shadow-[var(--accent)]/30 flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Insert Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
