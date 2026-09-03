import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Note, Folder, Tag, NoteFilter, AppSettings, NoteRevision, TemplateType, AttachmentFile } from '../types/note';
import { NOTE_TEMPLATES } from '../utils/templates';
import {
  loadNotesFromStorage,
  saveNotesToStorage,
  loadFoldersFromStorage,
  saveFoldersToStorage,
  loadTagsFromStorage,
  saveTagsToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
} from '../utils/storage';

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'info' | 'warning';
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(loadNotesFromStorage);
  const [folders, setFolders] = useState<Folder[]>(loadFoldersFromStorage);
  const [tags, setTags] = useState<Tag[]>(loadTagsFromStorage);
  const [settings, setSettings] = useState<AppSettings>(loadSettingsFromStorage);

  // Active Note Session Persistence
  const [activeNoteId, setActiveNoteIdState] = useState<string | null>(() => {
    const loaded = loadNotesFromStorage();
    const savedActive = localStorage.getItem('notepadEZ_activeNoteId');
    if (savedActive && loaded.some((n) => n.id === savedActive && !n.isTrash)) {
      return savedActive;
    }
    const active = loaded.find((n) => !n.isTrash);
    return active ? active.id : null;
  });

  // Open Tabs Session Persistence
  const [openTabIds, setOpenTabIds] = useState<string[]>(() => {
    const loaded = loadNotesFromStorage();
    const savedTabs = localStorage.getItem('notepadEZ_openTabIds');
    if (savedTabs) {
      try {
        const parsed: string[] = JSON.parse(savedTabs);
        const valid = parsed.filter((id) => loaded.some((n) => n.id === id && !n.isTrash));
        if (valid.length > 0) return valid;
      } catch {
        // Fallback to active non-trash notes
      }
    }
    return loaded.filter((n) => !n.isTrash).map((n) => n.id);
  });

  const [filter, setFilter] = useState<NoteFilter>({
    searchQuery: '',
    folderId: null,
    tagId: null,
    onlyPinned: false,
    onlyFavorites: false,
    onlyTrash: false,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ id: Date.now().toString(), text, type });
  }, []);

  // Save notes whenever state changes
  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  // Persist Active Note ID
  useEffect(() => {
    if (activeNoteId) {
      localStorage.setItem('notepadEZ_activeNoteId', activeNoteId);
    } else {
      localStorage.removeItem('notepadEZ_activeNoteId');
    }
  }, [activeNoteId]);

  // Persist Open Tab IDs
  useEffect(() => {
    localStorage.setItem('notepadEZ_openTabIds', JSON.stringify(openTabIds));
  }, [openTabIds]);

  // Ensure active note is always included in open tabs
  const setActiveNoteId = useCallback((id: string | null) => {
    setActiveNoteIdState(id);
    if (id) {
      setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  }, []);

  // Close tab (hides tab from header without deleting the note)
  const closeTab = useCallback((id: string) => {
    setOpenTabIds((prev) => {
      const nextTabs = prev.filter((tId) => tId !== id);
      if (activeNoteId === id) {
        setActiveNoteIdState(nextTabs.length > 0 ? nextTabs[nextTabs.length - 1] : null);
      }
      return nextTabs;
    });
  }, [activeNoteId]);

  // Synchronous auto-save beforeunload listener
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveNotesToStorage(notes);
      if (activeNoteId) localStorage.setItem('notepadEZ_activeNoteId', activeNoteId);
      localStorage.setItem('notepadEZ_openTabIds', JSON.stringify(openTabIds));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [notes, activeNoteId, openTabIds]);

  useEffect(() => {
    saveFoldersToStorage(folders);
  }, [folders]);

  useEffect(() => {
    saveTagsToStorage(tags);
  }, [tags]);

  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings]);

  // Filtered Notes computation
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        // Trash filter
        if (filter.onlyTrash) {
          if (!note.isTrash) return false;
        } else {
          if (note.isTrash) return false;
        }

        // Folder filter
        if (filter.folderId && note.folderId !== filter.folderId) {
          return false;
        }

        // Tag filter
        if (filter.tagId && !note.tags.includes(filter.tagId)) {
          return false;
        }

        // Pinned filter
        if (filter.onlyPinned && !note.isPinned) {
          return false;
        }

        // Favorites filter
        if (filter.onlyFavorites && !note.isFavorite) {
          return false;
        }

        // Search Query
        if (filter.searchQuery.trim() !== '') {
          const q = filter.searchQuery.toLowerCase();
          const matchTitle = note.title.toLowerCase().includes(q);
          const matchContent = note.content.toLowerCase().includes(q);
          const matchTags = note.tags.some((t) => t.toLowerCase().includes(q));
          return matchTitle || matchContent || matchTags;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned notes always stay on top if not viewing trash and not specifically sorting
        if (!filter.onlyTrash) {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
        }

        let valA: string | number = a.updatedAt;
        let valB: string | number = b.updatedAt;

        if (filter.sortBy === 'createdAt') {
          valA = a.createdAt;
          valB = b.createdAt;
        } else if (filter.sortBy === 'title') {
          valA = (a.title || 'Untitled').toLowerCase();
          valB = (b.title || 'Untitled').toLowerCase();
        }

        if (valA < valB) return filter.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return filter.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [notes, filter]);

  // Active Note
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Auto-Snapshot Timer Ref
  const autoSnapshotTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Actions
  const createNoteFromTemplate = useCallback((templateType: TemplateType = 'blank', folderId?: string) => {
    const tmpl = NOTE_TEMPLATES.find((t) => t.type === templateType) || NOTE_TEMPLATES[0];
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: tmpl.defaultTitle,
      content: tmpl.defaultContent,
      folderId: folderId || filter.folderId || tmpl.folderId || undefined,
      tags: tmpl.tags || [],
      isPinned: false,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      wordTargetGoal: settings.wordGoal,
      template: templateType,
      attachments: [],
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    showToast(`Created note from ${tmpl.label}`, 'success');
    return newNote;
  }, [filter.folderId, settings.wordGoal, setActiveNoteId, showToast]);

  const createNote = useCallback((folderId?: string) => {
    return createNoteFromTemplate('blank', folderId);
  }, [createNoteFromTemplate]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;

        const updatedNote = { ...n, ...updates, updatedAt: Date.now() };

        // Auto-Snapshotting on content change after 4s pause
        if (updates.content !== undefined && updates.content !== n.content) {
          if (autoSnapshotTimerRef.current[id]) {
            clearTimeout(autoSnapshotTimerRef.current[id]);
          }

          autoSnapshotTimerRef.current[id] = setTimeout(() => {
            setNotes((currentNotes) =>
              currentNotes.map((cn) => {
                if (cn.id === id && updates.content) {
                  const snapshot: NoteRevision = {
                    id: `auto-rev-${Date.now()}`,
                    timestamp: Date.now(),
                    title: cn.title,
                    content: updates.content,
                    charCount: updates.content.length,
                  };
                  const existing = cn.revisions || [];
                  // Only snapshot if content is different from latest revision
                  if (existing.length === 0 || existing[0].content !== updates.content) {
                    return { ...cn, revisions: [snapshot, ...existing].slice(0, 25) };
                  }
                }
                return cn;
              })
            );
          }, 4000);
        }

        return updatedNote;
      })
    );
  }, []);

  const addAttachment = useCallback((id: string, file: AttachmentFile) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const current = n.attachments || [];
          return { ...n, attachments: [...current, file], updatedAt: Date.now() };
        }
        return n;
      })
    );
    showToast(`Attached ${file.name}`, 'success');
  }, [showToast]);

  const removeAttachment = useCallback((id: string, attachmentId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const current = n.attachments || [];
          return {
            ...n,
            attachments: current.filter((a) => a.id !== attachmentId),
            updatedAt: Date.now(),
          };
        }
        return n;
      })
    );
    showToast('Removed attachment', 'info');
  }, [showToast]);

  const togglePin = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const nextState = !n.isPinned;
          showToast(nextState ? 'Pinned note to top' : 'Unpinned note', 'info');
          return { ...n, isPinned: nextState, updatedAt: Date.now() };
        }
        return n;
      })
    );
  }, [showToast]);

  const toggleFavorite = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const nextState = !n.isFavorite;
          showToast(nextState ? 'Added to favorites' : 'Removed from favorites', 'info');
          return { ...n, isFavorite: nextState, updatedAt: Date.now() };
        }
        return n;
      })
    );
  }, [showToast]);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          showToast('Moved note to Trash', 'warning');
          return { ...n, isTrash: true, isPinned: false, updatedAt: Date.now() };
        }
        return n;
      })
    );

    // Switch active note if deleting active note
    if (activeNoteId === id) {
      const remaining = notes.filter((n) => n.id !== id && !n.isTrash);
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [activeNoteId, notes, setActiveNoteId, showToast]);

  const restoreNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          showToast('Restored note from Trash', 'success');
          return { ...n, isTrash: false, updatedAt: Date.now() };
        }
        return n;
      })
    );
    setActiveNoteId(id);
  }, [setActiveNoteId, showToast]);

  const permanentDeleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
    showToast('Permanently deleted note', 'info');
  }, [activeNoteId, setActiveNoteId, showToast]);

  const createRevisionSnapshot = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const snapshot: NoteRevision = {
            id: `rev-${Date.now()}`,
            timestamp: Date.now(),
            title: n.title,
            content: n.content,
            charCount: n.content.length,
          };
          const existing = n.revisions || [];
          // Keep max 20 snapshots per note
          const updatedRevisions = [snapshot, ...existing].slice(0, 20);
          return { ...n, revisions: updatedRevisions };
        }
        return n;
      })
    );
    showToast('Saved note snapshot', 'success');
  }, [showToast]);

  const restoreRevision = useCallback((id: string, revision: NoteRevision) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          // Create auto-snapshot before restoring
          const currentSnapshot: NoteRevision = {
            id: `rev-${Date.now()}`,
            timestamp: Date.now(),
            title: n.title,
            content: n.content,
            charCount: n.content.length,
          };
          const existing = n.revisions || [];
          const updatedRevisions = [currentSnapshot, ...existing].slice(0, 20);

          return {
            ...n,
            title: revision.title,
            content: revision.content,
            updatedAt: Date.now(),
            revisions: updatedRevisions,
          };
        }
        return n;
      })
    );
    showToast(`Restored version from ${new Date(revision.timestamp).toLocaleTimeString()}`, 'success');
  }, [showToast]);

  const duplicateNote = useCallback((id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const dup: Note = {
      ...target,
      id: `note-${Date.now()}`,
      title: `${target.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes((prev) => [dup, ...prev]);
    setActiveNoteId(dup.id);
    showToast('Duplicated note', 'success');
  }, [notes, setActiveNoteId, showToast]);

  const addFolder = useCallback((name: string, color?: string) => {
    if (!name.trim()) return;
    const newFolder: Folder = {
      id: `f-${Date.now()}`,
      name: name.trim(),
      color: color || '#3b82f6',
    };
    setFolders((prev) => [...prev, newFolder]);
    showToast(`Created folder "${name}"`, 'success');
  }, [showToast]);

  const deleteFolder = useCallback((folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    // Remove folder reference from notes
    setNotes((prev) => prev.map((n) => (n.folderId === folderId ? { ...n, folderId: undefined } : n)));
    showToast('Deleted folder', 'warning');
  }, [showToast]);

  const addTag = useCallback((name: string, color?: string) => {
    if (!name.trim()) return;
    const tagId = `t-${name.toLowerCase().replace(/\s+/g, '-')}`;
    if (tags.some((t) => t.id === tagId)) return;

    const newTag: Tag = {
      id: tagId,
      name: name.trim().toLowerCase(),
      color: color || '#8b5cf6',
    };
    setTags((prev) => [...prev, newTag]);
    showToast(`Created tag "${name}"`, 'success');
  }, [tags, showToast]);

  const deleteTag = useCallback((tagId: string) => {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    setNotes((prev) => prev.map((n) => ({ ...n, tags: n.tags.filter((t) => t !== tagId) })));
    showToast('Deleted tag', 'warning');
  }, [showToast]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const restoreBackupData = useCallback((backup: { notes: Note[]; folders?: Folder[]; tags?: Tag[] }) => {
    if (backup.notes && Array.isArray(backup.notes)) {
      setNotes(backup.notes);
      if (backup.folders && Array.isArray(backup.folders)) setFolders(backup.folders);
      if (backup.tags && Array.isArray(backup.tags)) setTags(backup.tags);
      if (backup.notes.length > 0) setActiveNoteId(backup.notes[0].id);
      showToast('Successfully imported backup data', 'success');
    }
  }, [setActiveNoteId, showToast]);

  return {
    notes,
    filteredNotes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    folders,
    tags,
    settings,
    filter,
    setFilter,
    toast,
    setToast,
    showToast,
    createNote,
    createNoteFromTemplate,
    updateNote,
    addAttachment,
    removeAttachment,
    deleteNote,
    restoreNote,
    permanentDeleteNote,
    duplicateNote,
    togglePin,
    toggleFavorite,
    addFolder,
    deleteFolder,
    addTag,
    deleteTag,
    updateSettings,
    restoreBackupData,
    createRevisionSnapshot,
    restoreRevision,
    openTabIds,
    closeTab,
  };
}
