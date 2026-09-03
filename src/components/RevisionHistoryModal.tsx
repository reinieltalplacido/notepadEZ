import React, { useState } from 'react';
import { Note, NoteRevision } from '../types/note';
import { History, RotateCcw, Plus, X, Calendar, FileText } from 'lucide-react';

interface RevisionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  onCreateSnapshot: () => void;
  onRestoreRevision: (revision: NoteRevision) => void;
}

export const RevisionHistoryModal: React.FC<RevisionHistoryModalProps> = ({
  isOpen,
  onClose,
  note,
  onCreateSnapshot,
  onRestoreRevision,
}) => {
  const [selectedRevision, setSelectedRevision] = useState<NoteRevision | null>(null);

  if (!isOpen || !note) return null;

  const revisions = note.revisions || [];
  const currentDiff = selectedRevision
    ? selectedRevision.content.length - note.content.length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl bg-[var(--bg-secondary)] border border-[var(--border-highlight)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Revision History & Snapshots
              </h2>
              <p className="text-xs text-[var(--text-secondary)] truncate max-w-md">
                Viewing revisions for <strong className="text-[var(--text-primary)]">{note.title || 'Untitled Note'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateSnapshot}
              className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Save Snapshot Now
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body (Timeline + Preview Pane) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Timeline List Sidebar */}
          <div className="w-72 border-r border-[var(--border-color)] bg-[var(--bg-primary)]/50 overflow-y-auto p-3 space-y-2 shrink-0">
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">
              Snapshots ({revisions.length})
            </div>

            {revisions.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-muted)] space-y-2">
                <History className="w-8 h-8 mx-auto opacity-30 text-[var(--text-muted)]" />
                <p>No snapshots saved yet.</p>
                <p className="text-[10px] opacity-75">Click "Save Snapshot Now" to create your first note restore point.</p>
              </div>
            ) : (
              revisions.map((rev, idx) => {
                const isSelected = selectedRevision?.id === rev.id;
                const formattedDate = new Date(rev.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <button
                    key={rev.id}
                    onClick={() => setSelectedRevision(rev)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition space-y-1 ${
                      isSelected
                        ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--text-primary)] shadow-sm'
                        : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--accent)]/50 text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span className="truncate">{rev.title || 'Snapshot'}</span>
                      <span className="text-[10px] font-mono text-[var(--accent)]">
                        #{revisions.length - idx}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                      <Calendar className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      {rev.charCount} characters
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Snapshot Preview Pane */}
          <div className="flex-1 flex flex-col bg-[var(--bg-secondary)] p-4 overflow-hidden">
            {selectedRevision ? (
              <>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-color)]">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {selectedRevision.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                      <span>Saved {new Date(selectedRevision.timestamp).toLocaleString()}</span>
                      <span>•</span>
                      <span className="font-mono">
                        Diff: {currentDiff > 0 ? `+${currentDiff}` : currentDiff} chars
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onRestoreRevision(selectedRevision);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-emerald-900/30"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore Version
                  </button>
                </div>

                {/* Preview Box */}
                <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed select-text">
                  {selectedRevision.content || <em className="text-[var(--text-muted)]">Empty note snapshot</em>}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-xs text-[var(--text-muted)] space-y-3">
                <FileText className="w-12 h-12 stroke-[1.2] opacity-30 text-[var(--text-muted)]" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Select a Snapshot</p>
                  <p className="text-[var(--text-secondary)] mt-1">
                    Choose a revision from the left timeline to preview or restore it.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
