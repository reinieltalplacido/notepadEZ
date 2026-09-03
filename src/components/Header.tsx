import React, { useState } from 'react';
import { ThemeMode, FontChoice, Note, Folder, Tag } from '../types/note';
import {
  Sparkles,
  Volume2,
  Maximize2,
  Download,
  Command,
  HelpCircle,
  Palette,
  FileText,
  FileCode,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { exportNoteAsMarkdown, exportNoteAsText, exportNoteAsHtml, exportFullBackupJSON } from '../utils/export';

interface HeaderProps {
  activeNote: Note | null;
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  font: FontChoice;
  setFont: (font: FontChoice) => void;
  onOpenFocusMode: () => void;
  onOpenAudioPlayer: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  onImportBackup: (data: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeNote,
  notes,
  folders,
  tags,
  theme,
  setTheme,
  font,
  setFont,
  onOpenFocusMode,
  onOpenAudioPlayer,
  onOpenCommandPalette,
  onOpenShortcuts,
  onImportBackup,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themes: { id: ThemeMode; name: string; color: string }[] = [
    { id: 'cyber-dark', name: 'Cyber Dark', color: '#6366f1' },
    { id: 'neon-matrix', name: 'Neon Matrix', color: '#10b981' },
    { id: 'sunset-glow', name: 'Sunset Glow', color: '#ec4899' },
    { id: 'minimal-light', name: 'Minimal Light', color: '#2563eb' },
    { id: 'nordic-frost', name: 'Nordic Frost', color: '#38bdf8' },
  ];

  const fonts: { id: FontChoice; name: string }[] = [
    { id: 'sans', name: 'Modern Sans' },
    { id: 'serif', name: 'Classic Serif' },
    { id: 'mono', name: 'Monospace' },
    { id: 'dyslexic', name: 'Clean Dyslexic' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImportBackup(json);
      } catch (err) {
        alert('Invalid backup JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-16 px-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg shadow-[var(--accent-glow)]">
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-tight flex items-center gap-1.5">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--accent)]">
              notepadEZ
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-mono border border-[var(--accent)]/30">
              v1.0
            </span>
          </h1>
          <p className="text-[11px] text-[var(--text-muted)] hidden sm:block">Personal Supercharged Workspace</p>
        </div>
      </div>



      {/* Actions Toolbar */}
      <div className="flex items-center gap-2">
        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--border-highlight)] transition"
          title="Command Palette (Ctrl+K)"
        >
          <Command className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="hidden md:inline font-mono text-[11px] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
            Ctrl+K
          </span>
        </button>

        {/* Ambient Audio Button */}
        <button
          onClick={onOpenAudioPlayer}
          className="p-2 rounded-xl glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--border-highlight)] transition"
          title="Ambient Focus Sounds"
        >
          <Volume2 className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Zen Focus Mode Button */}
        <button
          onClick={onOpenFocusMode}
          className="p-2 rounded-xl glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--border-highlight)] transition"
          title="Distraction-Free Zen Mode"
        >
          <Maximize2 className="w-4 h-4 text-indigo-400" />
        </button>

        {/* Theme Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-xl glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--border-highlight)] transition"
            title="Switch Visual Theme"
          >
            <Palette className="w-4 h-4 text-amber-400" />
          </button>
          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-48 py-2 rounded-xl glass-panel border border-[var(--border-highlight)] shadow-2xl z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Theme Preset
              </div>
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setShowThemeMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-white/10 transition ${
                    theme === t.id ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  <span>{t.name}</span>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></span>
                </button>
              ))}
              <div className="my-1 border-t border-[var(--border-color)]"></div>
              <div className="px-3 py-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Font Family
              </div>
              {fonts.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFont(f.id);
                    setShowThemeMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition ${
                    font === f.id ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] font-medium transition shadow-md shadow-[var(--accent-glow)]"
            title="Export Note or Backup"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-52 py-2 rounded-xl glass-panel border border-[var(--border-highlight)] shadow-2xl z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Active Note
              </div>
              <button
                disabled={!activeNote}
                onClick={() => {
                  if (activeNote) exportNoteAsMarkdown(activeNote);
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
              >
                <FileCode className="w-4 h-4 text-indigo-400" />
                Export as Markdown (.md)
              </button>
              <button
                disabled={!activeNote}
                onClick={() => {
                  if (activeNote) exportNoteAsText(activeNote);
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                Export as Plain Text (.txt)
              </button>
              <button
                disabled={!activeNote}
                onClick={() => {
                  if (activeNote) exportNoteAsHtml(activeNote);
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                Export as HTML (.html)
              </button>
              <div className="my-1 border-t border-[var(--border-color)]"></div>
              <div className="px-3 py-1 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Full Data Backup
              </div>
              <button
                onClick={() => {
                  exportFullBackupJSON(notes, folders, tags);
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <Database className="w-4 h-4 text-cyan-400" />
                Backup All Data (JSON)
              </button>
              <label className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
                <Download className="w-4 h-4 text-rose-400 rotate-180" />
                Restore from JSON Backup
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {/* Shortcuts Button */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-xl glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--border-highlight)] transition"
          title="Keyboard Shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
