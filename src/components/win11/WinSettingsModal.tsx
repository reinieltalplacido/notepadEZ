import React from 'react';
import { createPortal } from 'react-dom';
import { AppSettings, ThemeMode, FontChoice } from '../../types/note';
import { X, Settings as SettingsIcon, Sun, Moon, Monitor, Type } from 'lucide-react';

interface WinSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const WinSettingsModal: React.FC<WinSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const themes: { id: ThemeMode; name: string; bg: string; accent: string }[] = [
    { id: 'minimal-light', name: 'Light Mode (Windows 11)', bg: '#f8fafc', accent: '#2563eb' },
    { id: 'cyber-dark', name: 'Dark Mode (Obsidian Cyber)', bg: '#070913', accent: '#6366f1' },
    { id: 'neon-matrix', name: 'Neon Matrix', bg: '#050b07', accent: '#10b981' },
    { id: 'sunset-glow', name: 'Sunset Glow', bg: '#120816', accent: '#ec4899' },
    { id: 'nordic-frost', name: 'Nordic Frost', bg: '#0f172a', accent: '#38bdf8' },
    { id: 'transparent', name: 'Transparent / Acrylic Glass', bg: 'rgba(15, 23, 42, 0.4)', accent: '#a855f7' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="animate-modal-enter relative w-full max-w-md p-6 rounded-2xl glass-panel border border-[var(--border-highlight)] shadow-2xl space-y-6 text-xs text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <SettingsIcon className="w-4 h-4 text-[var(--accent)]" />
            <span>Notepad Settings</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Settings */}
        <div className="space-y-2">
          <label className="font-semibold text-[var(--text-secondary)] block uppercase tracking-wider text-[10px]">
            App Theme
          </label>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((t) => {
              const isSelected = settings.theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ theme: t.id })}
                  className={`p-2.5 rounded-xl transition flex flex-col justify-between gap-2 border text-left ${
                    isSelected
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--border-highlight)]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-[11px] truncate">{t.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ background: t.bg }} />
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.accent }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <label className="font-semibold text-[var(--text-secondary)] block uppercase tracking-wider text-[10px]">
            Font Family
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'mono', name: 'Monospace' },
              { id: 'sans', name: 'Segoe UI' },
              { id: 'serif', name: 'Serif' },
              { id: 'dyslexic', name: 'Clean UI' },
              { id: 'geist', name: 'Geist' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => onUpdateSettings({ font: f.id as FontChoice })}
                className={`p-2.5 rounded-xl text-center border transition ${
                  settings.font === f.id
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)]'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[var(--text-secondary)]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Font Size</span>
            <span className="font-mono">{settings.fontSize}px</span>
          </div>
          <input
            type="range"
            min="12"
            max="28"
            step="1"
            value={settings.fontSize}
            onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value) })}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>

        {/* Editor Width */}
        <div className="space-y-2">
          <label className="font-semibold text-[var(--text-secondary)] block uppercase tracking-wider text-[10px]">
            Editor Width
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'compact', name: 'Compact' },
              { id: 'comfortable', name: 'Comfortable' },
              { id: 'full', name: 'Full Width' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => onUpdateSettings({ editorWidth: w.id as any })}
                className={`p-2 rounded-xl text-center border transition font-medium ${
                  (settings.editorWidth || 'full') === w.id
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)]'
                }`}
              >
                {w.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border-color)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--accent)] text-white font-medium shadow-md shadow-[var(--accent-glow)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
