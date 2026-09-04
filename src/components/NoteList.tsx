import React, { useState, useRef } from 'react';
import { Note, NoteFilter, Folder, Tag } from '../types/note';
import {
  Search,
  Plus,
  Pin,
  Star,
  Trash2,
  Copy,
  RotateCcw,
  ArrowUpDown,
  FileText,
  LayoutGrid,
  List as ListIcon,
  FolderInput,
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
  onUpdateNoteFolder?: (noteId: string, folderId: string | undefined) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  activeNoteId,
  setActiveNoteId,
  filter,
  setFilter,
  folders,
  tags: _tags,
  onCreateNote,
  onTogglePin,
  onToggleFavorite,
  onDuplicateNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentDeleteNote,
  onUpdateNoteFolder,
}) => {
  const [deleteNoteTarget, setDeleteNoteTarget] = useState<Note | null>(null);
  const [noteListWidth, setNoteListWidth] = useState(280);
  const [cardLayout, setCardLayout] = useState<'card' | 'list'>('card');
  const [noteContextMenu, setNoteContextMenu] = useState<{ noteId: string; x: number; y: number } | null>(null);
  const isResizingRef = useRef(false);

  const getFolder = (folderId?: string) => folders.find((f) => f.id === folderId);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isResizingRef.current) {
        const newWidth = Math.max(220, Math.min(480, moveEvent.clientX - 220));
        setNoteListWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResetWidth = () => {
    setNoteListWidth(280);
  };

  return (
    <div
      style={{ width: `${noteListWidth}px` }}
      className="h-[calc(100vh-4rem)] border-r border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col z-10 shrink-0 relative transition-[width] duration-150"
    >
      {/* Resizable Divider Handle */}
      <div
        onMouseDown={handleMouseDownResize}
        onDoubleClick={handleResetWidth}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[var(--accent)]/50 transition-colors z-30 group"
        title="Drag to resize note list width, double-click to reset"
      >
        <div className="w-full h-full group-hover:bg-[var(--accent)] opacity-40 transition" />
      </div>
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
          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Card vs Compact List */}
            <button
              onClick={() => setCardLayout(cardLayout === 'card' ? 'list' : 'card')}
              className="p-1 rounded hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              title={cardLayout === 'card' ? 'Switch to Compact List View' : 'Switch to Card Grid View'}
            >
              {cardLayout === 'card' ? <ListIcon className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
            </button>

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
      </div>

      {/* Note List Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2" onClick={() => setNoteContextMenu(null)}>
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
            const cleanExcerptText = note.content
              .replace(/<style[\s\S]*?<\/style>/gi, '')
              .replace(/<script[\s\S]*?<\/script>/gi, '')
              .replace(/&nbsp;/gi, ' ')
              .replace(/&amp;/gi, '&')
              .replace(/&lt;/gi, '<')
              .replace(/&gt;/gi, '>')
              .replace(/&quot;/gi, '"')
              .replace(/&#039;/gi, "'")
              .replace(/<\/?[a-z0-9]+\b[^>]*>/gi, ' ')
              .replace(/<\/?[a-z0-9]{1,10}(?=\s|[A-Z0-9]|$)/gi, ' ')
              .replace(/[<>]/g, ' ')
              .replace(/[#*`_>~]/g, '')
              .replace(/\s+/g, ' ')
              .trim();
            const excerpt = cleanExcerptText.slice(0, 85);

            return (
              <div
                key={note.id}
                draggable={!filter.onlyTrash}
                onDragStart={(e) => {
                  e.dataTransfer.setData('noteId', note.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setNoteContextMenu({ noteId: note.id, x: e.clientX, y: e.clientY });
                }}
                onClick={() => setActiveNoteId(note.id)}
                className={`rounded-xl border transition-all duration-200 cursor-pointer group relative ${
                  cardLayout === 'card' ? 'p-3' : 'p-2 flex items-center justify-between'
                } ${
                  isActive
                    ? 'bg-[var(--bg-card)] border-[var(--accent)] border-l-4 border-l-[var(--accent)] shadow-xl shadow-[var(--accent-glow)]'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-color)] border-l-4 border-l-transparent hover:border-[var(--border-highlight)] hover:bg-[var(--bg-tertiary)]'
                }`}
                title="Drag note into a folder in the sidebar to reorganize"
              >
                {/* Header Row: Title & Actions */}
                <div className="flex items-start justify-between gap-2 mb-1 flex-1">
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

                {cardLayout === 'card' && (
                  <>
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
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Note Context Menu */}
      {noteContextMenu && (
        <div
          style={{ top: `${noteContextMenu.y}px`, left: `${noteContextMenu.x}px` }}
          className="fixed z-[100] w-48 py-1.5 rounded-xl glass-panel border border-[var(--border-highlight)] shadow-2xl text-xs space-y-0.5 animate-modal-enter"
        >
          <button
            onClick={() => {
              onTogglePin(noteContextMenu.noteId);
              setNoteContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center justify-between text-[var(--text-primary)]"
          >
            <span>Toggle Pin</span>
            <Pin className="w-3.5 h-3.5 text-cyan-400" />
          </button>
          <button
            onClick={() => {
              onToggleFavorite(noteContextMenu.noteId);
              setNoteContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center justify-between text-[var(--text-primary)]"
          >
            <span>Toggle Favorite</span>
            <Star className="w-3.5 h-3.5 text-amber-400" />
          </button>
          <button
            onClick={() => {
              onDuplicateNote(noteContextMenu.noteId);
              setNoteContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center justify-between text-[var(--text-primary)]"
          >
            <span>Duplicate Note</span>
            <Copy className="w-3.5 h-3.5" />
          </button>

          {folders.length > 0 && onUpdateNoteFolder && (
            <div className="border-t border-[var(--border-color)] pt-1 my-1">
              <div className="px-3 py-0.5 text-[10px] text-[var(--text-muted)] font-semibold uppercase">Move to folder</div>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onUpdateNoteFolder(noteContextMenu.noteId, f.id);
                    setNoteContextMenu(null);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-white/10 flex items-center gap-1.5 text-[var(--text-secondary)]"
                >
                  <FolderInput className="w-3 h-3 text-[var(--accent)]" />
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-[var(--border-color)] pt-1 my-1" />
          <button
            onClick={() => {
              onDeleteNote(noteContextMenu.noteId);
              setNoteContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex items-center justify-between text-rose-400"
          >
            <span>Move to Trash</span>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
