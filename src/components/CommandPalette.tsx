import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Note, ThemeMode } from '../types/note';
import { Search, Plus, Palette, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onCreateNote,
  setTheme,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredNotes = notes
    .filter((n) => !n.isTrash)
    .filter((n) => n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  const actions = [
    {
      id: 'create-note',
      title: 'Create New Note',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      run: () => {
        onCreateNote();
        onClose();
      },
    },

    {
      id: 'theme-cyber',
      title: 'Switch Theme to Cyber Dark',
      icon: <Palette className="w-4 h-4 text-indigo-400" />,
      run: () => {
        setTheme('cyber-dark');
        onClose();
      },
    },
    {
      id: 'theme-matrix',
      title: 'Switch Theme to Neon Matrix',
      icon: <Palette className="w-4 h-4 text-emerald-400" />,
      run: () => {
        setTheme('neon-matrix');
        onClose();
      },
    },
    {
      id: 'theme-sunset',
      title: 'Switch Theme to Sunset Glow',
      icon: <Palette className="w-4 h-4 text-pink-400" />,
      run: () => {
        setTheme('sunset-glow');
        onClose();
      },
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm text-[var(--text-primary)]">
      <div className="animate-modal-enter relative w-full max-w-lg rounded-2xl glass-panel border border-[var(--border-highlight)] shadow-2xl overflow-hidden">
        {/* Search Header Input */}
        <div className="flex items-center px-4 border-b border-[var(--border-color)]">
          <Search className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-3.5 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List Body */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Notes Match Section */}
          {filteredNotes.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Notes
              </div>
              {filteredNotes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    onSelectNote(n.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-white/10 text-[var(--text-primary)] transition"
                >
                  <span className="font-medium truncate">{n.title || 'Untitled Note'}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(n.updatedAt).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Actions
            </div>
            {actions.map((act) => (
              <button
                key={act.id}
                onClick={act.run}
                className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-3 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              >
                {act.icon}
                <span>{act.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
