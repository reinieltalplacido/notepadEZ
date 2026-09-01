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

  const themes: { id: ThemeMode; name: string; icon?: string }[] = [
    { id: 'minimal-light', name: 'Light Mode (Windows 11 Default)' },
    { id: 'cyber-dark', name: 'Dark Mode (Obsidian Cyber)' },
    { id: 'neon-matrix', name: 'Neon Matrix' },
    { id: 'sunset-glow', name: 'Sunset Glow' },
    { id: 'nordic-frost', name: 'Nordic Frost' },
    { id: 'transparent', name: '✦ Transparent / Acrylic' },
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
          <div className="space-y-1">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => onUpdateSettings({ theme: t.id })}
                className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between border ${
                  settings.theme === t.id
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--border-highlight)]'
                }`}
              >
                <span>{t.name}</span>
                {settings.theme === t.id && <span className="text-[10px] font-mono font-bold">ACTIVE</span>}
              </button>
            ))}
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
              { id: 'geist', name: '✦ Geist' },
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
