import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Note, ViewMode, Folder, Tag, NoteRevision } from '../types/note';
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
}

export const Editor: React.FC<EditorProps> = ({
  note,
  viewMode,
  onViewModeChange,
  folders,
  tags,
  onUpdateNote,
  font,
  onCreateSnapshot,
  onRestoreRevision,
  isFullScreen = false,
  onToggleFullScreen,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Search & Replace state
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [matches, setMatches] = useState<number[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  // Outline panel state
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);

  // Revision history modal state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Undo / Redo custom history stacks
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const lastContentRef = useRef<string>('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const isTypingPreviewRef = useRef<boolean>(false);

  // Sync content history on note selection change
  useEffect(() => {
    if (note) {
      lastContentRef.current = note.content;
      setUndoStack([]);
      setRedoStack([]);
    }
  }, [note?.id]);

  // Sync rendered preview HTML when note content changes
  useEffect(() => {
    if (previewRef.current) {
      if (!isTypingPreviewRef.current) {
        previewRef.current.innerHTML = renderMarkdown(note ? note.content : '');
      }
    }
  }, [note?.content, note?.id]);

  const handlePreviewInput = () => {
    if (!previewRef.current || !note) return;
    isTypingPreviewRef.current = true;
    const text = previewRef.current.innerText || '';
    handleContentChange(text);
    setTimeout(() => {
      isTypingPreviewRef.current = false;
    }, 150);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const plainText = e.clipboardData.getData('text/plain');
    const htmlText = e.clipboardData.getData('text/html');

    let htmlToInsert = '';
    if (
      plainText &&
      (plainText.includes('#') ||
        plainText.includes('*') ||
        plainText.includes('`') ||
        plainText.includes('---') ||
        plainText.includes('>'))
    ) {
      htmlToInsert = renderMarkdown(plainText);
    } else if (htmlText) {
      htmlToInsert = htmlText;
    } else if (plainText) {
      htmlToInsert = renderMarkdown(plainText);
    }

    if (htmlToInsert) {
      document.execCommand('insertHTML', false, htmlToInsert);
      if (previewRef.current && note) {
        handleContentChange(previewRef.current.innerText || plainText);
      }
    }
  };

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

  const execRichFormat = (command: string, value: string = '') => {
    if (previewRef.current) {
      previewRef.current.focus();
      document.execCommand(command, false, value);
      handlePreviewInput();
    }
  };

  // Push state to undo stack
  const pushToUndo = useCallback((content: string) => {
    setUndoStack((prev) => [...prev.slice(-49), lastContentRef.current]);
    setRedoStack([]);
    lastContentRef.current = content;
  }, []);

  const handleContentChange = (newContent: string) => {
    if (!note) return;

    // Debounce pushing typing changes to undo stack so fast typing stays in one undo step
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
  const insertFormatting = (prefix: string, suffix: string = prefix, defaultText: string = '') => {
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
      }, 50);
      return;
    }

    // Check Case 1: Highlighted text itself starts with prefix and ends with suffix
    const hasInternalFormatting =
      prefix &&
      suffix &&
      selectedText.length >= prefix.length + suffix.length &&
      selectedText.startsWith(prefix) &&
      selectedText.endsWith(suffix) &&
      !(prefix === '*' && selectedText.startsWith('**')) &&
      !(suffix === '*' && selectedText.endsWith('**'));

    // Check Case 2: Content before start & after end has prefix and suffix
    const beforeText = note.content.substring(Math.max(0, start - prefix.length), start);
    const afterText = note.content.substring(end, Math.min(note.content.length, end + suffix.length));
    const hasExternalFormatting =
      prefix &&
      suffix &&
      beforeText === prefix &&
      afterText === suffix &&
      !(prefix === '*' && note.content.substring(Math.max(0, start - 2), start) === '**') &&
      !(suffix === '*' && note.content.substring(end, Math.min(note.content.length, end + 2)) === '**');

    if (hasInternalFormatting) {
      // Toggle OFF: Remove internal formatting
      const unwrapped = selectedText.substring(prefix.length, selectedText.length - suffix.length);
      newContent = note.content.substring(0, start) + unwrapped + note.content.substring(end);
      newStart = start;
      newEnd = start + unwrapped.length;
    } else if (hasExternalFormatting) {
      // Toggle OFF: Remove external formatting
      newContent =
        note.content.substring(0, start - prefix.length) +
        selectedText +
        note.content.substring(end + suffix.length);
      newStart = start - prefix.length;
      newEnd = newStart + selectedText.length;
    } else {
      // Toggle ON: Add formatting
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
    }, 50);
  };

  const insertLinePrefix = (prefix: string) => {
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
      // Toggle OFF: Remove prefix from line
      const updatedLine = currentLine.substring(prefix.length);
      newContent = note.content.substring(0, lineStart) + updatedLine + note.content.substring(actualEnd);
    } else {
      // Toggle ON: Add prefix to line (stripping any conflicting prefix if necessary)
      const cleanedLine = currentLine.replace(/^(#{1,6}\s+|-\s*\[[ xX]\]\s*|[-*+]\s*|\d+\.\s*>*\s*)/, '');
      newContent = note.content.substring(0, lineStart) + `${prefix}${cleanedLine}` + note.content.substring(actualEnd);
    }

    pushToUndo(newContent);
    onUpdateNote(note.id, { content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + (newContent.length - note.content.length + currentLine.length));
    }, 50);
  };

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
        // Unindent
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
        // Indent 2 spaces
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

    // Smart Enter List Continuation & Indentation
    if (e.key === 'Enter') {
      const lineStart = content.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = content.substring(lineStart, selectionStart);

      // Check leading indentation
      const indentMatch = currentLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';

      // Check list patterns
      const checkboxMatch = currentLine.match(/^(\s*-\s*\[[ xX]\]\s*)/);
      const bulletMatch = currentLine.match(/^(\s*[-*+]\s*)/);
      const numberMatch = currentLine.match(/^(\s*(\d+)\.\s*)/);

      if (checkboxMatch) {
        // If line is empty checkbox `- [ ] `, clear it on enter
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
      '*': '*',
    };

    if (pairs[e.key]) {
      const closing = pairs[e.key];

      // Overtyping closing pair if typed right before it
      if (!isSelected && content.charAt(selectionStart) === e.key && (e.key === '"' || e.key === "'" || e.key === '`' || e.key === '*')) {
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
        (charBefore === '`' && charAfter === '`') ||
        (charBefore === '*' && charAfter === '*');

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
    // Replace all using regex match
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
      charOffset += lines[i].length + 1; // +1 for newline
    }

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charOffset, charOffset + (lines[line - 1]?.length || 0));
  }, [note]);

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

  const insertTimestamp = () => {
    const nowStr = `\n> 🕒 *${new Date().toLocaleString()}*\n`;
    insertFormatting(nowStr);
  };

  const insertTableTemplate = () => {
    const tableTemplate = `\n| Item | Description | Status |\n| :--- | :--- | :---: |\n| Task 1 | Feature implementation | 🚀 |\n| Task 2 | UI Polishing | 🎨 |\n`;
    insertFormatting(tableTemplate);
  };

  const fontClassMap: Record<string, string> = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
    dyslexic: 'font-dyslexic',
  };

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

        {/* Folder & Tags Bar */}
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

          {/* Quick Utility Actions (Find, Outline, Snapshots, Full Screen) */}
          <div className="flex items-center gap-1.5">
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

            <div className="w-px h-4 bg-[var(--border-color)]" />

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
          onClick={() => execRichFormat('bold')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Bold (B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => execRichFormat('italic')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Italic (I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => execRichFormat('strikeThrough')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Strikethrough (S)"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

        <button
          onClick={() => execRichFormat('formatBlock', '<h1>')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Heading 1 (H1)"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => execRichFormat('formatBlock', '<h2>')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Heading 2 (H2)"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => execRichFormat('formatBlock', '<h3>')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Heading 3 (H3)"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

        <button
          onClick={() => execRichFormat('insertHTML', '<input type="checkbox" style="margin-right:6px;" />&nbsp;')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Checklist item"
        >
          <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
        </button>
        <button
          onClick={() => execRichFormat('insertUnorderedList')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Bullet list"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => execRichFormat('insertOrderedList')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Numbered list"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

        <button
          onClick={() => execRichFormat('insertHTML', '<pre style="background:rgba(0,0,0,0.2);padding:10px;border-radius:8px;font-family:monospace;margin:8px 0;"><code>// Write code here...</code></pre><p><br></p>')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Code block"
        >
          <Code className="w-3.5 h-3.5 text-indigo-400" />
        </button>
        <button
          onClick={() => execRichFormat('formatBlock', '<blockquote>')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => execRichFormat('insertHTML', '<table border="1" style="border-collapse:collapse;width:100%;margin:10px 0;"><thead><tr><th style="padding:6px;border:1px solid currentColor;">Col 1</th><th style="padding:6px;border:1px solid currentColor;">Col 2</th></tr></thead><tbody><tr><td style="padding:6px;border:1px solid currentColor;">Data 1</td><td style="padding:6px;border:1px solid currentColor;">Data 2</td></tr></tbody></table><p><br></p>')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Insert table grid"
        >
          <Table className="w-3.5 h-3.5 text-amber-400" />
        </button>
        <button
          onClick={() => execRichFormat('insertHorizontalRule')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          title="Divider line"
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
          onClick={() => execRichFormat('insertHTML', `<span>🕒 ${new Date().toLocaleString()}</span>&nbsp;`)}
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

      {/* Main Workspace Area (Editor + Outline Drawer) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Unified Clean Rich Text Canvas */}
        <div className="flex-1 h-full p-6 overflow-y-auto bg-[var(--bg-primary)]">
          <div
            ref={previewRef}
            contentEditable={true}
            suppressContentEditableWarning
            onInput={handlePreviewInput}
            onPaste={handlePaste}
            onClick={handleCanvasClick}
            className={`markdown-preview outline-none leading-relaxed text-sm ${fontClassMap[font] || 'font-sans'} cursor-text min-h-[500px] p-3 rounded-xl focus:ring-1 focus:ring-[var(--accent)]/20 transition`}
          />
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
            execRichFormat('insertHTML', `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:underline;">${text}</a>&nbsp;`);
          } else {
            execRichFormat('createLink', url);
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
