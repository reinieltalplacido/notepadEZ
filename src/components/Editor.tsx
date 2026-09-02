import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Note, ViewMode, Folder, Tag, NoteRevision, AttachmentFile } from '../types/note';
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
  Edit3,
  Eye,
  Columns,
} from 'lucide-react';

interface EditorProps {
  note: Note | null;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
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
  viewMode = 'split',
  onViewModeChange,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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

  // Reset history stack when switching active note
  useEffect(() => {
    if (note) {
      currentNoteIdRef.current = note.id;
      lastContentRef.current = note.content;
      setUndoStack([]);
      setRedoStack([]);
    }
  }, [note?.id]);

  // Push state to undo stack
  const pushToUndo = useCallback((content: string) => {
    setUndoStack((prev) => [...prev.slice(-49), lastContentRef.current]);
    setRedoStack([]);
    lastContentRef.current = content;
  }, []);

  const handleContentChange = (newContent: string) => {
    if (!note) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      pushToUndo(newContent);
    }, 400);

    onUpdateNote(note.id, { content: newContent });
  };

  const handleUndo = useCallback(() => {
    if (!note || undoStack.length === 0) return;
    const prevContent = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, note.content]);
    lastContentRef.current = prevContent;
    onUpdateNote(note.id, { content: prevContent });
  }, [note, undoStack, onUpdateNote]);

  const handleRedo = useCallback(() => {
    if (!note || redoStack.length === 0) return;
    const nextContent = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, note.content]);
    lastContentRef.current = nextContent;
    onUpdateNote(note.id, { content: nextContent });
  }, [note, redoStack, onUpdateNote]);

  // Insert formatting helper with smart toggle (wrap / unwrap)
  const insertFormatting = useCallback((prefix: string, suffix: string = prefix, defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!note || !textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = note.content.substring(start, end);
    let newContent = '';
    let newStart = start;
    let newEnd = end;

    if (!selectedText && defaultText && start === end) {
      newContent = note.content.substring(0, start) + prefix + defaultText + suffix + note.content.substring(end);
      newStart = start + prefix.length;
      newEnd = newStart + defaultText.length;
      pushToUndo(newContent);
      onUpdateNote(note.id, { content: newContent });

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newStart, newEnd);
      }, 30);
      return;
    }

    const hasInternalFormatting =
      prefix &&
      suffix &&
      selectedText.length >= prefix.length + suffix.length &&
      selectedText.startsWith(prefix) &&
      selectedText.endsWith(suffix);

    const beforeText = note.content.substring(Math.max(0, start - prefix.length), start);
    const afterText = note.content.substring(end, Math.min(note.content.length, end + suffix.length));
    const hasExternalFormatting = prefix && suffix && beforeText === prefix && afterText === suffix;

    if (hasInternalFormatting) {
      const unwrapped = selectedText.substring(prefix.length, selectedText.length - suffix.length);
      newContent = note.content.substring(0, start) + unwrapped + note.content.substring(end);
      newStart = start;
      newEnd = start + unwrapped.length;
    } else if (hasExternalFormatting) {
      newContent =
        note.content.substring(0, start - prefix.length) +
        selectedText +
        note.content.substring(end + suffix.length);
      newStart = start - prefix.length;
      newEnd = newStart + selectedText.length;
    } else {
      newContent =
        note.content.substring(0, start) +
        prefix +
        selectedText +
        suffix +
        note.content.substring(end);
      newStart = start + prefix.length;
      newEnd = newStart + selectedText.length;
    }

    pushToUndo(newContent);
    onUpdateNote(note.id, { content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
    }, 30);
  }, [note, pushToUndo, onUpdateNote]);

  const insertLinePrefix = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!note || !textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = note.content.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = note.content.indexOf('\n', end);
    const actualEnd = lineEnd === -1 ? note.content.length : lineEnd;

    const currentLine = note.content.substring(lineStart, actualEnd);
    let newContent = '';

    if (currentLine.startsWith(prefix)) {
      const updatedLine = currentLine.substring(prefix.length);
      newContent = note.content.substring(0, lineStart) + updatedLine + note.content.substring(actualEnd);
    } else {
      const cleanedLine = currentLine.replace(/^(#{1,6}\s+|-\s*\[[ xX]\]\s*|[-*+]\s*|\d+\.\s*>*\s*)/, '');
      newContent = note.content.substring(0, lineStart) + `${prefix}${cleanedLine}` + note.content.substring(actualEnd);
    }

    pushToUndo(newContent);
    onUpdateNote(note.id, { content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + (newContent.length - note.content.length + currentLine.length));
    }, 30);
  }, [note, pushToUndo, onUpdateNote]);

  const insertTimestamp = useCallback(() => {
    const nowStr = `\n> 🕒 *${new Date().toLocaleString()}*\n`;
    insertFormatting(nowStr, '');
  }, [insertFormatting]);

  const insertTableTemplate = useCallback(() => {
    const tableTemplate = `\n| Item | Description | Status |\n| :--- | :--- | :---: |\n| Task 1 | Feature implementation | 🚀 |\n| Task 2 | UI Polishing | 🎨 |\n`;
    insertFormatting(tableTemplate, '');
  }, [insertFormatting]);

  // Keyboard Event Handler for Editor (Auto-brackets, Tab indent, Enter list continuation, Ctrl+Z / Ctrl+Y)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!note) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const isSelected = selectionStart !== selectionEnd;
    const content = note.content;

    // Hotkeys: Ctrl+Z / Ctrl+Y
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

    // Tab / Shift+Tab Line Indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const lineStart = content.lastIndexOf('\n', selectionStart - 1) + 1;
      const lineEnd = content.indexOf('\n', selectionEnd);
      const actualEnd = lineEnd === -1 ? content.length : lineEnd;
      const selectedLines = content.substring(lineStart, actualEnd).split('\n');

      let newLines: string[];
      let diff = 0;

      if (e.shiftKey) {
        newLines = selectedLines.map((line) => {
          if (line.startsWith('  ')) {
            diff -= 2;
            return line.substring(2);
          } else if (line.startsWith(' ')) {
            diff -= 1;
            return line.substring(1);
          }
          return line;
        });
      } else {
        newLines = selectedLines.map((line) => {
          diff += 2;
          return '  ' + line;
        });
      }

      const newContent =
        content.substring(0, lineStart) + newLines.join('\n') + content.substring(actualEnd);

      pushToUndo(newContent);
      onUpdateNote(note.id, { content: newContent });

      setTimeout(() => {
        textarea.focus();
        if (isSelected) {
          textarea.setSelectionRange(lineStart, Math.max(lineStart, selectionEnd + diff));
        } else {
          const newPos = Math.max(lineStart, selectionStart + (e.shiftKey ? -2 : 2));
          textarea.setSelectionRange(newPos, newPos);
        }
      }, 10);
      return;
    }

    // Smart Enter List Continuation
    if (e.key === 'Enter') {
      const lineStart = content.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = content.substring(lineStart, selectionStart);

      const indentMatch = currentLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';

      const checkboxMatch = currentLine.match(/^(\s*-\s*\[[ xX]\]\s*)/);
      const bulletMatch = currentLine.match(/^(\s*[-*+]\s*)/);
      const numberMatch = currentLine.match(/^(\s*(\d+)\.\s*)/);

      if (checkboxMatch) {
        if (currentLine.trim() === '- [ ]' || currentLine.trim() === '- [x]') {
          e.preventDefault();
          const newContent = content.substring(0, lineStart) + content.substring(selectionStart);
          pushToUndo(newContent);
          onUpdateNote(note.id, { content: newContent });
          setTimeout(() => textarea.setSelectionRange(lineStart, lineStart), 10);
          return;
        }
        e.preventDefault();
        const prefix = `\n${indent}- [ ] `;
        const newContent = content.substring(0, selectionStart) + prefix + content.substring(selectionEnd);
        pushToUndo(newContent);
        onUpdateNote(note.id, { content: newContent });
        setTimeout(() => textarea.setSelectionRange(selectionStart + prefix.length, selectionStart + prefix.length), 10);
        return;
      } else if (bulletMatch) {
        if (currentLine.trim() === '-' || currentLine.trim() === '*' || currentLine.trim() === '+') {
          e.preventDefault();
          const newContent = content.substring(0, lineStart) + content.substring(selectionStart);
          pushToUndo(newContent);
          onUpdateNote(note.id, { content: newContent });
          setTimeout(() => textarea.setSelectionRange(lineStart, lineStart), 10);
          return;
        }
        e.preventDefault();
        const prefix = `\n${indent}- `;
        const newContent = content.substring(0, selectionStart) + prefix + content.substring(selectionEnd);
        pushToUndo(newContent);
        onUpdateNote(note.id, { content: newContent });
        setTimeout(() => textarea.setSelectionRange(selectionStart + prefix.length, selectionStart + prefix.length), 10);
        return;
      } else if (numberMatch) {
        const currentNum = parseInt(numberMatch[2], 10);
        if (currentLine.trim() === `${currentNum}.`) {
          e.preventDefault();
          const newContent = content.substring(0, lineStart) + content.substring(selectionStart);
          pushToUndo(newContent);
          onUpdateNote(note.id, { content: newContent });
          setTimeout(() => textarea.setSelectionRange(lineStart, lineStart), 10);
          return;
        }
        e.preventDefault();
        const prefix = `\n${indent}${currentNum + 1}. `;
        const newContent = content.substring(0, selectionStart) + prefix + content.substring(selectionEnd);
        pushToUndo(newContent);
        onUpdateNote(note.id, { content: newContent });
        setTimeout(() => textarea.setSelectionRange(selectionStart + prefix.length, selectionStart + prefix.length), 10);
        return;
      }
    }

    // Auto-Closing Pairs
    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`',
    };

    if (pairs[e.key]) {
      const closing = pairs[e.key];

      if (!isSelected && content.charAt(selectionStart) === e.key && (e.key === '"' || e.key === "'" || e.key === '`')) {
        e.preventDefault();
        setTimeout(() => textarea.setSelectionRange(selectionStart + 1, selectionStart + 1), 10);
        return;
      }

      e.preventDefault();
      const selectedText = content.substring(selectionStart, selectionEnd);
      const newContent =
        content.substring(0, selectionStart) +
        e.key +
        selectedText +
        closing +
        content.substring(selectionEnd);

      pushToUndo(newContent);
      onUpdateNote(note.id, { content: newContent });

      setTimeout(() => {
        textarea.focus();
        if (isSelected) {
          textarea.setSelectionRange(selectionStart + 1, selectionStart + 1 + selectedText.length);
        } else {
          textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
        }
      }, 10);
      return;
    }

    // Backspace Pair Deletion
    if (e.key === 'Backspace' && !isSelected && selectionStart > 0) {
      const charBefore = content.charAt(selectionStart - 1);
      const charAfter = content.charAt(selectionStart);

      const isPair =
        (charBefore === '(' && charAfter === ')') ||
        (charBefore === '[' && charAfter === ']') ||
        (charBefore === '{' && charAfter === '}') ||
        (charBefore === '"' && charAfter === '"') ||
        (charBefore === "'" && charAfter === "'") ||
        (charBefore === '`' && charAfter === '`');

      if (isPair) {
        e.preventDefault();
        const newContent = content.substring(0, selectionStart - 1) + content.substring(selectionStart + 1);
        pushToUndo(newContent);
        onUpdateNote(note.id, { content: newContent });
        setTimeout(() => textarea.setSelectionRange(selectionStart - 1, selectionStart - 1), 10);
        return;
      }
    }
  };

  // Find & Replace helper methods
  const handleSearch = useCallback((query: string, matchCase: boolean) => {
    if (!note || !query) {
      setMatches([]);
      setCurrentMatchIdx(0);
      return;
    }

    const content = note.content;
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase ? 'g' : 'gi');
    const positions: number[] = [];
    let match;

    while ((match = searchRegex.exec(content)) !== null) {
      positions.push(match.index);
    }

    setMatches(positions);
    setCurrentMatchIdx(0);

    if (positions.length > 0 && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(positions[0], positions[0] + query.length);
    }
  }, [note]);

  const handleNavigateMatch = useCallback((direction: 'next' | 'prev') => {
    if (matches.length === 0 || !textareaRef.current) return;
    let nextIdx = direction === 'next' ? currentMatchIdx + 1 : currentMatchIdx - 1;
    if (nextIdx >= matches.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = matches.length - 1;

    setCurrentMatchIdx(nextIdx);
    const pos = matches[nextIdx];
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(pos, pos + (textareaRef.current.selectionEnd - textareaRef.current.selectionStart || 1));
  }, [matches, currentMatchIdx]);

  const handleReplaceCurrent = useCallback((replaceText: string) => {
    if (!note || matches.length === 0 || !textareaRef.current) return;
    const pos = matches[currentMatchIdx];
    const matchLen = textareaRef.current.selectionEnd - textareaRef.current.selectionStart || 1;

    const newContent =
      note.content.substring(0, pos) + replaceText + note.content.substring(pos + matchLen);

    pushToUndo(newContent);
    onUpdateNote(note.id, { content: newContent });
  }, [note, matches, currentMatchIdx, pushToUndo, onUpdateNote]);

  const handleReplaceAll = useCallback((replaceText: string) => {
    if (!note || matches.length === 0) return;
    const textarea = textareaRef.current;
    const query = note.content.substring(
      textarea?.selectionStart || 0,
      textarea?.selectionEnd || 0
    );

    if (!query) return;
    const newContent = note.content.replaceAll(query, replaceText);
    pushToUndo(newContent);
    onUpdateNote(note.id, { content: newContent });
  }, [note, matches, pushToUndo, onUpdateNote]);

  const handleSelectHeader = useCallback((line: number) => {
    if (!note || !textareaRef.current) return;
    const lines = note.content.split('\n');
    let charOffset = 0;
    for (let i = 0; i < line - 1 && i < lines.length; i++) {
      charOffset += lines[i].length + 1;
    }

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charOffset, charOffset + (lines[line - 1]?.length || 0));
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

  const renderedHtml = renderMarkdown(note.content);

  return (
    <div className={`flex-1 ${isFullScreen ? 'h-screen w-screen border-none rounded-none z-50' : 'h-[calc(100vh-4rem)]'} flex flex-col bg-[var(--bg-primary)] overflow-hidden relative`}>
      {/* Floating Exit Full Screen Pill */}
      {isFullScreen && (
        <div className="absolute top-4 right-6 z-50 transition-opacity opacity-40 hover:opacity-100 select-none">
          <button
            onClick={onToggleFullScreen}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 text-white text-xs font-mono backdrop-blur-md border border-white/20 shadow-xl hover:bg-black/90 hover:scale-105 transition"
            title="Exit Full Screen (Esc / F11)"
          >
            <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Exit Full Screen (Esc)</span>
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

          {/* Folder, Tags & View Mode Switcher */}
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

            {/* View Mode & Quick Utilities */}
            <div className="flex items-center gap-2">
              {/* View Mode Segmented Control */}
              <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                <button
                  onClick={() => onViewModeChange && onViewModeChange('edit')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    viewMode === 'edit'
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Edit Mode (Markdown Editor)"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onViewModeChange && onViewModeChange('split')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    viewMode === 'split'
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Split Mode (Editor + Preview Side-by-Side)"
                >
                  <Columns className="w-3 h-3" />
                  <span>Split</span>
                </button>
                <button
                  onClick={() => onViewModeChange && onViewModeChange('preview')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                    viewMode === 'preview'
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Preview Mode (Rendered View)"
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>
              </div>

              <div className="w-px h-4 bg-[var(--border-color)]" />

              {/* Utility Actions */}
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

      {/* Formatting Toolbar with Undo / Redo (Hidden in Full Screen) */}
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

          <button
            onClick={() => insertFormatting('**', '**', 'bold text')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('*', '*', 'italic text')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('~~', '~~', 'strikethrough')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

          <button
            onClick={() => insertLinePrefix('# ')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Heading 1 (#)"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertLinePrefix('## ')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Heading 2 (##)"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertLinePrefix('### ')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Heading 3 (###)"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

          <button
            onClick={() => insertLinePrefix('- [ ] ')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Checklist item (- [ ])"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
          </button>
          <button
            onClick={() => insertLinePrefix('- ')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Bullet list (-)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertLinePrefix('1. ')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Numbered list (1.)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

          <button
            onClick={() => insertFormatting('\n```ts\n', '\n```\n', '// Write code here')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Code block (```)"
          >
            <Code className="w-3.5 h-3.5 text-indigo-400" />
          </button>
          <button
            onClick={() => insertLinePrefix('> ')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Blockquote (>)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={insertTableTemplate}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Insert Markdown Table Grid"
          >
            <Table className="w-3.5 h-3.5 text-amber-400" />
          </button>
          <button
            onClick={() => insertFormatting('\n---\n', '')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Divider line (---)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Insert web link"
          >
            <Link className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Attach File (Images, PDFs, Code, Screenshots)"
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

      {/* Main Workspace Area (Editor / Split / Preview + Outline Drawer) */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 h-full flex overflow-hidden bg-[var(--bg-primary)] p-4">
          <div className={`${editorWidth === 'compact' ? 'max-w-2xl mx-auto' : editorWidth === 'comfortable' ? 'max-w-4xl mx-auto' : 'w-full'} flex-1 flex gap-4 h-full overflow-hidden`}>
            
            {/* Raw Markdown Editor Pane (Visible in Edit & Split modes) */}
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className="flex-1 h-full flex flex-col min-w-0 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 shadow-inner">
                <textarea
                  ref={textareaRef}
                  value={note.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your markdown content here..."
                  className={`w-full h-full bg-transparent text-[var(--text-primary)] outline-none resize-none leading-relaxed text-sm ${fontClassMap[font] || 'font-sans'} placeholder:text-[var(--text-muted)]`}
                />
              </div>
            )}

            {/* Rendered Live Markdown Preview Pane (Visible in Preview & Split modes) */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className="flex-1 h-full overflow-y-auto bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 shadow-inner">
                <div
                  ref={previewRef}
                  onClick={handleCanvasClick}
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  className={`markdown-preview leading-relaxed text-sm ${fontClassMap[font] || 'font-sans'}`}
                />

                {/* Note Attachments Section */}
                {note.attachments && note.attachments.length > 0 && (
                  <div className="border-t border-[var(--border-color)] pt-4 mt-6 space-y-2">
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
            )}
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
            insertFormatting(`[${text}](`, `)`, url);
          } else {
            insertFormatting(`[${url}](`, `)`);
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
