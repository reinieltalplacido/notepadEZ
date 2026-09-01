import React from 'react';
import { Note, NoteFilter, Folder, Tag } from '../types/note';
import {
  Search,
  Plus,
  Pin,
  Star,
  Trash2,
  Copy,
  RotateCcw,
  Clock,
  ArrowUpDown,
  FileText
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string) => void;
  filter: NoteFilter;
  setFilter: React.Dispatch<React.SetStateAction<NoteFilter>>;
  folders: Folder[];
  tags: Tag[];
  onCreateNote: () => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicateNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onPermanentDeleteNote: (id: string) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  activeNoteId,
  setActiveNoteId,
  filter,
  setFilter,
  folders,
  tags,
  onCreateNote,
  onTogglePin,
  onToggleFavorite,
  onDuplicateNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentDeleteNote,
}) => {
  const [deleteNoteTarget, setDeleteNoteTarget] = React.useState<Note | null>(null);
  const getFolder = (folderId?: string) => folders.find((f) => f.id === folderId);

  return (
    <div className="w-80 h-[calc(100vh-4rem)] border-r border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col z-10 shrink-0">
      {/* Top Search & Create Bar */}
      <div className="p-3 border-b border-[var(--border-color)] space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search notes..."
              value={filter.searchQuery}
              onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-tertiary)] text-xs text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--accent)] outline-none transition placeholder:text-[var(--text-muted)]"
            />
          </div>
          {!filter.onlyTrash && (
            <button
              onClick={onCreateNote}
              className="p-2 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition shadow-md shadow-[var(--accent-glow)] shrink-0"
              title="Create New Note"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort & Filter Indicator Bar */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] px-1">
          <span>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-[var(--accent)]" />
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter((prev) => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-transparent text-[var(--text-secondary)] font-medium outline-none cursor-pointer"
            >
              <option value="updatedAt">Modified</option>
              <option value="createdAt">Created</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Note List Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-[var(--text-muted)] space-y-3">
            <FileText className="w-10 h-10 stroke-[1.5] text-[var(--text-muted)] opacity-50" />
            <p className="text-xs font-medium">No notes found</p>
            {!filter.onlyTrash && (
              <button
                onClick={onCreateNote}
                className="px-3 py-1.5 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] text-xs font-semibold hover:bg-[var(--accent)]/25 transition border border-[var(--accent)]/30"
              >
                + Create Note
              </button>
            )}
          </div>
        ) : (
          notes.map((note) => {
            const isActive = activeNoteId === note.id;
            const folder = getFolder(note.folderId);
            const excerpt = note.content.replace(/[#*`_>~]/g, '').trim().slice(0, 75);

            return (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer group relative ${
                  isActive
                    ? 'bg-[var(--bg-card)] border-[var(--accent)] border-l-4 border-l-[var(--accent)] shadow-xl shadow-[var(--accent-glow)]'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-color)] border-l-4 border-l-transparent hover:border-[var(--border-highlight)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {/* Header Row: Title & Actions */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className={`text-xs font-semibold truncate flex-1 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                    {(note.title || 'Untitled Note').replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()}
                  </h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    {!filter.onlyTrash ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(note.id);
                          }}
                          className={`p-1 rounded hover:bg-white/10 ${note.isPinned ? 'text-cyan-400' : 'text-[var(--text-muted)]'}`}
                          title={note.isPinned ? 'Unpin' : 'Pin to top'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(note.id);
                          }}
                          className={`p-1 rounded hover:bg-white/10 ${note.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-muted)]'}`}
                          title="Favorite"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateNote(note.id);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note.id);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-rose-400"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreNote(note.id);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-emerald-400"
                          title="Restore Note"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteNoteTarget(note);
                          }}
                          className="p-1 rounded hover:bg-white/10 text-rose-400"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Excerpt Snippet */}
                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mb-2 leading-relaxed font-normal">
                  {excerpt || <span className="italic text-[var(--text-muted)]">Empty note...</span>}
                </p>

                {/* Footer Info: Date, Folder badge, Pin indicator */}
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                  <div className="flex items-center gap-1.5">
                    {folder && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folder.color }}></span>
                        {folder.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {note.isPinned && !filter.onlyTrash && <Pin className="w-3 h-3 text-cyan-400 shrink-0" />}
                    {note.isFavorite && !filter.onlyTrash && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                    <span className="font-mono">{new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Permanent Note Deletion */}
      <ConfirmModal
        isOpen={!!deleteNoteTarget}
        title="Permanently Delete Note"
        message={`Are you sure you want to permanently delete "${deleteNoteTarget?.title || 'Untitled'}"? This action cannot be undone.`}
        confirmText="Delete Permanently"
        onConfirm={() => {
          if (deleteNoteTarget) onPermanentDeleteNote(deleteNoteTarget.id);
        }}
        onCancel={() => setDeleteNoteTarget(null)}
      />
    </div>
  );
};
