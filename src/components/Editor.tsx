import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Note, Folder, Tag, NoteRevision, AttachmentFile } from '../types/note';
import { renderMarkdown } from '../utils/markdown';
import { StatsBar } from './StatsBar';
import { FindReplaceBar } from './FindReplaceBar';
import { OutlinePanel } from './OutlinePanel';
import { RevisionHistoryModal } from './RevisionHistoryModal';
import { LinkInsertModal } from './LinkInsertModal';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Table,
  Minus,
  Link,
  Clock,
  Folder as FolderIcon,
  Tag as TagIcon,
  FileText,
  Undo,
  Redo,
  Search,
  ListTree,
  History,
  Maximize2,
  Minimize2,
  Paperclip,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
} from 'lucide-react';

interface EditorProps {
  note: Note | null;
  folders: Folder[];
  tags: Tag[];
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  font: string;
  onCreateSnapshot?: (id: string) => void;
  onRestoreRevision?: (id: string, revision: NoteRevision) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  editorWidth?: 'compact' | 'comfortable' | 'full';
  onAddAttachment?: (noteId: string, file: AttachmentFile) => void;
  onRemoveAttachment?: (noteId: string, attachmentId: string) => void;
}

export const Editor: React.FC<EditorProps> = ({
  note,
  folders,
  tags,
  onUpdateNote,
  font,
  onCreateSnapshot,
  onRestoreRevision,
  isFullScreen = false,
  onToggleFullScreen,
  editorWidth = 'full',
  onAddAttachment,
  onRemoveAttachment,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Replace state
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [matches, setMatches] = useState<number[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  // Outline & History panel state
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Custom Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const lastContentRef = useRef<string>('');
  const currentNoteIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to format content as HTML if raw markdown is passed
  const formatInitialHtml = (rawContent: string): string => {
    if (!rawContent) return '';
    // If it already looks like HTML (has HTML tags), return as is
    if (/<[a-z][\s\S]*>/i.test(rawContent)) {
      return rawContent;
    }
    // Otherwise convert markdown to HTML for rich text display
    return renderMarkdown(rawContent);
  };

  // Sync editor innerHTML when activeNote changes
  useEffect(() => {
    if (note && editorRef.current) {
      if (currentNoteIdRef.current !== note.id) {
        currentNoteIdRef.current = note.id;
        const html = formatInitialHtml(note.content);
        editorRef.current.innerHTML = html;
        lastContentRef.current = html;
        setUndoStack([]);
        setRedoStack([]);
      } else if (editorRef.current.innerHTML !== note.content && lastContentRef.current !== note.content) {
        const html = formatInitialHtml(note.content);
        editorRef.current.innerHTML = html;
        lastContentRef.current = html;
      }
    }
  }, [note?.id, note?.content]);

  // Push state to undo stack
  const pushToUndo = useCallback((content: string) => {
    setUndoStack((prev) => [...prev.slice(-49), lastContentRef.current]);
    setRedoStack([]);
    lastContentRef.current = content;
  }, []);

  const handleEditorInput = () => {
    if (!note || !editorRef.current) return;
    const newHtml = editorRef.current.innerHTML;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      pushToUndo(newHtml);
    }, 400);

    onUpdateNote(note.id, { content: newHtml });
  };

  const handleUndo = useCallback(() => {
    if (!note || undoStack.length === 0 || !editorRef.current) return;
    const prevContent = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, editorRef.current?.innerHTML || note.content]);
    lastContentRef.current = prevContent;
    editorRef.current.innerHTML = prevContent;
    onUpdateNote(note.id, { content: prevContent });
  }, [note, undoStack, onUpdateNote]);

  const handleRedo = useCallback(() => {
    if (!note || redoStack.length === 0 || !editorRef.current) return;
    const nextContent = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, editorRef.current?.innerHTML || note.content]);
    lastContentRef.current = nextContent;
    editorRef.current.innerHTML = nextContent;
    onUpdateNote(note.id, { content: nextContent });
  }, [note, redoStack, onUpdateNote]);

  // Rich Text Formatting Helper
  const execCmd = useCallback((command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleEditorInput();
  }, []);

  const insertTableTemplate = useCallback(() => {
    const tableHtml = `
      <div class="table-container my-3">
        <table class="md-table border-collapse border border-[var(--border-color)] w-full text-xs">
          <thead>
            <tr class="bg-[var(--bg-tertiary)]">
              <th class="md-th border border-[var(--border-color)] p-2 font-semibold">Header 1</th>
              <th class="md-th border border-[var(--border-color)] p-2 font-semibold">Header 2</th>
              <th class="md-th border border-[var(--border-color)] p-2 font-semibold">Header 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="md-td border border-[var(--border-color)] p-2">Item 1</td>
              <td class="md-td border border-[var(--border-color)] p-2">Item 2</td>
              <td class="md-td border border-[var(--border-color)] p-2">Item 3</td>
            </tr>
            <tr>
              <td class="md-td border border-[var(--border-color)] p-2">Data A</td>
              <td class="md-td border border-[var(--border-color)] p-2">Data B</td>
              <td class="md-td border border-[var(--border-color)] p-2">Data C</td>
            </tr>
          </tbody>
        </table>
      </div><p><br></p>
    `;
    execCmd('insertHTML', tableHtml);
  }, [execCmd]);

  const insertTimestamp = useCallback(() => {
    const nowStr = `<p class="text-xs text-[var(--accent)] font-mono my-1">🕒 <em>${new Date().toLocaleString()}</em></p><p><br></p>`;
    execCmd('insertHTML', nowStr);
  }, [execCmd]);

  const insertChecklistItem = useCallback(() => {
    const taskHtml = `<div class="task-item flex items-center gap-2 my-1"><input type="checkbox" class="task-checkbox accent-[var(--accent)] cursor-pointer" /> <span contenteditable="true">New Task Item</span></div><p><br></p>`;
    execCmd('insertHTML', taskHtml);
  }, [execCmd]);

  // Keyboard Shortcuts Handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      handleUndo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault();
      handleRedo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      execCmd('bold');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      execCmd('italic');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
      e.preventDefault();
      execCmd('underline');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setIsFindOpen(true);
      setIsReplaceMode(false);
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      setIsFindOpen(true);
      setIsReplaceMode(true);
      return;
    }
  };

  // Search & Replace logic
  const handleSearch = useCallback((query: string, matchCase: boolean) => {
    if (!note || !query) {
      setMatches([]);
      setCurrentMatchIdx(0);
      return;
    }
    const content = note.content;
    const matchIndices: number[] = [];
    try {
      const flags = matchCase ? 'g' : 'gi';
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      let m;
      while ((m = regex.exec(content)) !== null) {
        matchIndices.push(m.index);
      }
    } catch {
      // Invalid regex, ignore
    }
    setMatches(matchIndices);
    setCurrentMatchIdx(0);
  }, [note]);

  const handleNavigateMatch = useCallback((direction: 'next' | 'prev') => {
    if (matches.length === 0) return;
    if (direction === 'next') {
      setCurrentMatchIdx((prev) => (prev + 1) % matches.length);
    } else {
      setCurrentMatchIdx((prev) => (prev - 1 + matches.length) % matches.length);
    }
  }, [matches]);

  const handleReplaceCurrent = useCallback((replaceText: string) => {
    if (!note || matches.length === 0 || !editorRef.current) return;
    const text = editorRef.current.innerText;
    if (text) {
      const updated = text.replace(text.substring(matches[currentMatchIdx], matches[currentMatchIdx] + 5), replaceText);
      editorRef.current.innerText = updated;
      handleEditorInput();
    }
  }, [note, matches, currentMatchIdx, handleEditorInput]);

  const handleReplaceAll = useCallback((replaceText: string) => {
    if (!note || matches.length === 0 || !editorRef.current) return;
    const currentText = editorRef.current.innerText;
    if (currentText) {
      editorRef.current.innerText = currentText.replaceAll(currentText, replaceText);
      handleEditorInput();
    }
  }, [note, matches, handleEditorInput]);

  const handleSelectHeader = useCallback((line: number) => {
    if (!note || !editorRef.current) return;
    editorRef.current.focus();
  }, [note]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const linkAnchor = target.closest('a');
    if (linkAnchor) {
      const url = linkAnchor.getAttribute('href') || (linkAnchor as HTMLAnchorElement).href;
      if (url && url !== '#') {
        e.preventDefault();
        e.stopPropagation();
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Listen for Escape key to exit Full Screen
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen && onToggleFullScreen) {
        onToggleFullScreen();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFullScreen, onToggleFullScreen]);

  if (!note) {
    return (
      <div className="flex-1 h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center p-8 bg-[var(--bg-primary)] text-[var(--text-muted)] space-y-4">
        <FileText className="w-16 h-16 stroke-[1.2] opacity-30 text-[var(--text-muted)] animate-pulse" />
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">No Note Selected</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Select a note from the sidebar or click <strong className="text-[var(--accent)]">+ New Note</strong> to start writing!
          </p>
        </div>
      </div>
    );
  }

  const fontClassMap: Record<string, string> = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
    dyslexic: 'font-dyslexic',
  };

  return (
    <div className={`flex-1 ${isFullScreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'h-[calc(100vh-4rem)]'} flex flex-col bg-[var(--bg-primary)] overflow-hidden relative`}>
      {/* Sleek Full Screen Header Bar */}
      {isFullScreen && (
        <div className="h-12 px-6 bg-[var(--bg-secondary)]/90 backdrop-blur-md border-b border-[var(--border-color)] flex items-center justify-between z-50 shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 truncate max-w-[70%]">
            <span className="text-[10px] font-semibold text-[var(--accent)] font-mono uppercase tracking-wider bg-[var(--accent)]/15 px-2 py-0.5 rounded-md border border-[var(--accent)]/30">
              Zen Mode
            </span>
            <h2 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
              {note.title || 'Untitled Note'}
            </h2>
          </div>

          <button
            onClick={onToggleFullScreen}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-color)] hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all duration-200 shadow-sm group"
            title="Exit Full Screen (Esc)"
          >
            <Minimize2 className="w-3.5 h-3.5 text-[var(--accent)] group-hover:text-rose-400 transition" />
            <span>Exit Full Screen</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 font-mono text-[var(--text-muted)] border border-white/10">Esc</span>
          </button>
        </div>
      )}

      {/* Title & Meta Options Header (Hidden in Full Screen) */}
      {!isFullScreen && (
        <div className="p-4 pb-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] space-y-3">
          <input
            type="text"
            value={note.title}
            onChange={(e) => onUpdateNote(note.id, { title: e.target.value })}
            placeholder="Untitled Note"
            className="w-full text-xl sm:text-2xl font-bold bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none tracking-tight pb-1 border-b border-transparent focus:border-[var(--accent)] transition-all duration-200"
          />

          {/* Folder, Tags & Utilities Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
            <div className="flex flex-wrap items-center gap-3">
              {/* Folder Selector */}
              <div className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">
                <FolderIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
                <select
                  value={note.folderId || ''}
                  onChange={(e) => onUpdateNote(note.id, { folderId: e.target.value || undefined })}
                  className="bg-transparent outline-none cursor-pointer font-medium text-[var(--text-primary)]"
                >
                  <option value="" className="bg-[var(--bg-secondary)]">No Folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id} className="bg-[var(--bg-secondary)]">
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <TagIcon className="w-3.5 h-3.5 text-purple-400" />
                {tags.map((tag) => {
                  const isSelected = note.tags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        const newTags = isSelected
                          ? note.tags.filter((t) => t !== tag.id)
                          : [...note.tags, tag.id];
                        onUpdateNote(note.id, { tags: newTags });
                      }}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition border ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Utilities */}
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleFullScreen}
                className={`p-1.5 rounded-lg border transition ${
                  isFullScreen
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]'
                }`}
                title={isFullScreen ? 'Exit Full Screen Editor (F11 / Esc)' : 'Full Screen Editor (F11)'}
              >
                {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  setIsFindOpen(!isFindOpen);
                  setIsReplaceMode(false);
                }}
                className={`p-1.5 rounded-lg border transition ${
                  isFindOpen
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
                }`}
                title="Find & Replace (Ctrl+F)"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOutlineOpen(!isOutlineOpen)}
                className={`p-1.5 rounded-lg border transition ${
                  isOutlineOpen
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
                }`}
                title="Toggle Table of Contents Outline"
              >
                <ListTree className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsHistoryOpen(true)}
                className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition"
                title="Revision History & Snapshots"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formatting Toolbar with Undo / Redo */}
      {!isFullScreen && (
        <div className="px-3 py-1.5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center gap-1 overflow-x-auto select-none shrink-0">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

          {/* Formatting Actions */}
          <button
            onClick={() => execCmd('bold')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => execCmd('italic')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => execCmd('strikeThrough')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

          <button
            onClick={() => execCmd('formatBlock', '<h1>')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => execCmd('formatBlock', '<h2>')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => execCmd('formatBlock', '<h3>')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

          <button
            onClick={insertChecklistItem}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Checklist item"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
          </button>
          <button
            onClick={() => execCmd('insertUnorderedList')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Bullet list"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => execCmd('insertOrderedList')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Numbered list"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

          <button
            onClick={() => execCmd('formatBlock', '<pre>')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Code block"
          >
            <Code className="w-3.5 h-3.5 text-indigo-400" />
          </button>
          <button
            onClick={() => execCmd('formatBlock', '<blockquote>')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={insertTableTemplate}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Insert Table Grid"
          >
            <Table className="w-3.5 h-3.5 text-amber-400" />
          </button>
          <button
            onClick={() => execCmd('insertHorizontalRule')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Divider line"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Insert link"
          >
            <Link className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Attach File"
          >
            <Paperclip className="w-3.5 h-3.5 text-[var(--accent)]" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const files = e.target.files;
              if (!files || files.length === 0 || !note || !onAddAttachment) return;
              const file = files[0];
              const reader = new FileReader();
              reader.onload = (event) => {
                const url = event.target?.result as string;
                const attachment: AttachmentFile = {
                  id: `att-${Date.now()}`,
                  name: file.name,
                  size: file.size,
                  type: file.type || 'application/octet-stream',
                  url: url,
                  createdAt: Date.now(),
                };
                onAddAttachment(note.id, attachment);
              };
              reader.readAsDataURL(file);
              e.target.value = '';
            }}
            className="hidden"
          />

          <button
            onClick={insertTimestamp}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Insert timestamp"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      )}

      {/* Floating Find & Replace Bar */}
      <FindReplaceBar
        isOpen={isFindOpen}
        initialReplaceMode={isReplaceMode}
        onClose={() => setIsFindOpen(false)}
        onSearch={handleSearch}
        onNavigateMatch={handleNavigateMatch}
        onReplaceCurrent={handleReplaceCurrent}
        onReplaceAll={handleReplaceAll}
        matchIndex={currentMatchIdx}
        totalMatches={matches.length}
      />

      {/* Main Workspace Area (Clean WYSIWYG ContentEditable Canvas) */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 h-full flex overflow-hidden bg-[var(--bg-primary)] p-4">
          <div className={`${editorWidth === 'compact' ? 'max-w-2xl mx-auto' : editorWidth === 'comfortable' ? 'max-w-4xl mx-auto' : 'w-full'} flex-1 flex gap-4 h-full overflow-hidden`}>
            
            {/* Seamless Rich Text Editor */}
            <div className="flex-1 h-full flex flex-col min-w-0 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5 shadow-inner overflow-y-auto">
              <div
                ref={editorRef}
                contentEditable={true}
                onInput={handleEditorInput}
                onKeyDown={handleKeyDown}
                onClick={handleCanvasClick}
                className={`w-full h-full min-h-[300px] outline-none leading-relaxed text-sm ${fontClassMap[font] || 'font-sans'} text-[var(--text-primary)] markdown-preview`}
                style={{ wordBreak: 'break-word' }}
              />

              {/* Note Attachments Section */}
              {note.attachments && note.attachments.length > 0 && (
                <div className="border-t border-[var(--border-color)] pt-4 mt-6 space-y-2 select-none">
                  <div className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5 uppercase tracking-wider">
                    <Paperclip className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Attachments ({note.attachments.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {note.attachments.map((att) => {
                      const isImg = att.type.startsWith('image/');
                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs group hover:border-[var(--accent)] transition"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isImg ? (
                              <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <File className="w-4 h-4 text-cyan-400 shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="font-medium text-[var(--text-primary)] truncate">{att.name}</p>
                              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                                {(att.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={att.url}
                              download={att.name}
                              className="p-1 rounded hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              title="Download Attachment"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            {onRemoveAttachment && (
                              <button
                                onClick={() => onRemoveAttachment(note.id, att.id)}
                                className="p-1 rounded hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-400"
                                title="Delete Attachment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Outline / Table of Contents Panel */}
        <OutlinePanel
          isOpen={isOutlineOpen}
          content={note.content}
          onClose={() => setIsOutlineOpen(false)}
          onSelectHeader={handleSelectHeader}
        />
      </div>

      {/* Link Insertion Modal */}
      <LinkInsertModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onInsert={(url, text) => {
          if (text) {
            execCmd('insertHTML', `<a href="${url}" target="_blank" class="md-link text-[var(--accent)] underline">${text}</a>`);
          } else {
            execCmd('createLink', url);
          }
        }}
      />

      {/* Revision History Modal */}
      <RevisionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        note={note}
        onCreateSnapshot={() => {
          if (onCreateSnapshot && note) onCreateSnapshot(note.id);
        }}
        onRestoreRevision={(rev) => {
          if (onRestoreRevision && note) onRestoreRevision(note.id, rev);
        }}
      />

      {/* Integrated Real-time Stats Bar */}
      <StatsBar content={note.content} wordTargetGoal={note.wordTargetGoal} />
    </div>
  );
};
