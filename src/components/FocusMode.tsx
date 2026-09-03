import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Note } from '../types/note';
import { renderMarkdown, calculateNoteStats } from '../utils/markdown';
import { Minimize2, Sliders } from 'lucide-react';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  font: string;
}

export const FocusMode: React.FC<FocusModeProps> = ({
  isOpen,
  onClose,
  note,
  onUpdateNote,
  font,
}) => {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [editorWidth, setEditorWidth] = useState<'narrow' | 'medium' | 'wide'>('medium');

  if (!isOpen || !note) return null;

  const stats = calculateNoteStats(note.content);
  const target = note.wordTargetGoal || 300;
  const progressPercent = Math.min(100, Math.round((stats.words / target) * 100));

  const widthClasses = {
    narrow: 'max-w-xl',
    medium: 'max-w-3xl',
    wide: 'max-w-5xl',
  };

  const fontClassMap: Record<string, string> = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
    dyslexic: 'font-dyslexic',
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)] flex flex-col animate-modal-enter text-[var(--text-primary)]">
      {/* Top Floating Control Bar */}
      <div className="h-14 px-6 border-b border-[var(--border-color)] flex items-center justify-between opacity-40 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--accent)]">Zen Focus Mode</span>
          <div className="flex items-center bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--border-color)]">
            <button
              onClick={() => setMode('write')}
              className={`p-1 px-2.5 rounded text-xs font-medium ${mode === 'write' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'}`}
            >
              Write
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`p-1 px-2.5 rounded text-xs font-medium ${mode === 'preview' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'}`}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Adjustments: Width & Font size */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Sliders className="w-3.5 h-3.5" />
            <select
              value={editorWidth}
              onChange={(e) => setEditorWidth(e.target.value as any)}
              className="bg-transparent outline-none text-xs text-[var(--text-primary)] cursor-pointer"
            >
              <option value="narrow" className="bg-[var(--bg-secondary)]">Narrow Width</option>
              <option value="medium" className="bg-[var(--bg-secondary)]">Normal Width</option>
              <option value="wide" className="bg-[var(--bg-secondary)]">Full Width</option>
            </select>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--border-highlight)] transition"
          >
            <Minimize2 className="w-4 h-4 text-indigo-400" />
            <span>Exit Zen Mode</span>
          </button>
        </div>
      </div>

      {/* Main Focused Editor Canvas */}
      <div className="flex-1 overflow-y-auto py-12 px-6 flex justify-center">
        <div className={`w-full ${widthClasses[editorWidth]} flex flex-col space-y-6`}>
          <input
            type="text"
            value={note.title}
            onChange={(e) => onUpdateNote(note.id, { title: e.target.value })}
            placeholder="Title..."
            className="w-full text-3xl font-bold bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] tracking-tight"
          />

          {mode === 'write' ? (
            <textarea
              value={note.content}
              onChange={(e) => onUpdateNote(note.id, { content: e.target.value })}
              placeholder="Write seamlessly..."
              className={`w-full min-h-[500px] bg-transparent outline-none resize-none leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ${fontClassMap[font] || 'font-sans'}`}
              autoFocus
            />
          ) : (
            <div
              className={`markdown-preview ${fontClassMap[font] || 'font-sans'}`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
            />
          )}
        </div>
      </div>

      {/* Subtle Bottom Zen Stats */}
      <div className="h-10 px-8 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)] font-mono opacity-60 hover:opacity-100 transition">
        <span>{stats.words} words</span>
        <span>Target Progress: {progressPercent}%</span>
        <span>Press ESC to exit</span>
      </div>
    </div>,
    document.body
  );
};
