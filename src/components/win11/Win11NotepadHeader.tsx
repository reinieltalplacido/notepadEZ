import React, { useState, useRef, useEffect } from 'react';
import { Note, TemplateType } from '../../types/note';
import { NOTE_TEMPLATES } from '../../utils/templates';
import {
  FileText,
  Plus,
  X,
  Settings,
  Minus,
  Square,
  Bold,
  Italic,
  Strikethrough,
  Link,
  Table,
  Eraser,
  List,
  ChevronDown,
  Sidebar as SidebarIcon,
  CheckSquare,
  Users,
  FolderGit2,
  GraduationCap,
  BookOpen,
  Pin,
  Copy,
} from 'lucide-react';

interface Win11NotepadHeaderProps {
  notes: Note[];
  openTabIds?: string[];
  activeNoteId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: (templateType?: TemplateType) => void;
  activeNote: Note | null;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onOpenSettings: () => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onSaveFileAs: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenFocusMode: () => void;
  onDuplicateNote?: (id: string) => void;
  onTogglePin?: (id: string) => void;
}

export const Win11NotepadHeader: React.FC<Win11NotepadHeaderProps> = ({
  notes,
  openTabIds,
  activeNoteId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  activeNote,
  onUpdateNote,
  onOpenSettings,
  onOpenFile,
  onSaveFile,
  onSaveFileAs,
  onToggleSidebar,
  isSidebarOpen,
  onOpenFocusMode,
  onDuplicateNote,
  onTogglePin,
}) => {
  const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'view' | null>(null);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [tabContextMenu, setTabContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const templateMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
      setTabContextMenu(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  const tabNotes = openTabIds && openTabIds.length > 0
    ? openTabIds.map((id) => notes.find((n) => n.id === id && !n.isTrash)).filter((n): n is Note => Boolean(n))
    : notes.filter((n) => !n.isTrash);

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'CheckSquare': return <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Users': return <Users className="w-3.5 h-3.5 text-indigo-400" />;
      case 'FolderGit2': return <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />;
      case 'GraduationCap': return <GraduationCap className="w-3.5 h-3.5 text-amber-400" />;
      case 'BookOpen': return <BookOpen className="w-3.5 h-3.5 text-pink-400" />;
      default: return <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />;
    }
  };

  const handleCloseOtherTabs = (id: string) => {
    tabNotes.forEach((n) => {
      if (n.id !== id) onCloseTab(n.id);
    });
  };

  const handleCloseRightTabs = (id: string) => {
    const idx = tabNotes.findIndex((n) => n.id === id);
    if (idx !== -1) {
      tabNotes.slice(idx + 1).forEach((n) => onCloseTab(n.id));
    }
  };

  // Formatting helpers
  const applyHeading = (level: string) => {
    if (!activeNote) return;
    const content = activeNote.content;
    const lines = content.split('\n');
    const firstLine = lines[0] || '';
    const cleanFirstLine = firstLine.replace(/^(#{1,6}\s+)/, '');

    if (level === 'normal') {
      lines[0] = cleanFirstLine;
    } else {
      const prefix = `${'#'.repeat(parseInt(level, 10))} `;
      lines[0] = firstLine.startsWith(prefix) ? cleanFirstLine : `${prefix}${cleanFirstLine}`;
    }
    onUpdateNote(activeNote.id, { content: lines.join('\n') });
  };

  const applyInline = (symbol: string) => {
    if (!activeNote) return;
    const content = activeNote.content;
    onUpdateNote(activeNote.id, { content: `${content}\n${symbol}text${symbol}` });
  };

  return (
    <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] select-none sticky top-0 z-40">
      <div className="h-10 px-2 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-primary)]" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center gap-1 overflow-x-auto flex-1 h-full pt-1">
          <button
            onClick={onToggleSidebar}
            style={{ WebkitAppRegion: 'no-drag' } as any}
            className={`p-1.5 rounded-lg text-xs transition mr-1.5 ${
              isSidebarOpen
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]'
            }`}
            title="Toggle Sidebar & Note Store (Ctrl+B)"
          >
            <SidebarIcon className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 overflow-x-auto">
            {tabNotes.slice(0, 10).map((note) => {
              const isActive = note.id === activeNoteId;
              const cleanTitle = (note.title || 'Untitled').replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
              return (
                <div
                  key={note.id}
                  onClick={() => onSelectTab(note.id)}
                  onMouseDown={(e) => {
                    if (e.button === 1) {
                      e.preventDefault();
                      onCloseTab(note.id);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTabContextMenu({ id: note.id, x: e.clientX, y: e.clientY });
                  }}
                  style={{ WebkitAppRegion: 'no-drag' } as any}
                  className={`h-8 px-2.5 rounded-t-xl text-xs font-medium flex items-center gap-1.5 border-t-2 border-x transition-all cursor-pointer group shrink-0 ${
                    isActive
                      ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-t-[var(--accent)] border-x-[var(--border-color)] shadow-md font-semibold'
                      : 'bg-transparent text-[var(--text-muted)] border-t-transparent border-x-transparent hover:bg-white/5 hover:text-[var(--text-secondary)]'
                  }`}
                  title={`${note.title} (Middle-click to close)`}
                >
                  <FileText className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <div className="flex items-baseline max-w-[140px] truncate text-xs gap-1">
                    <span className="truncate">{cleanTitle || 'Untitled'}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">.{note.fileType || 'txt'}</span>
                  </div>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 animate-pulse" title="Active Note" />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(note.id);
                    }}
                    className="p-0.5 rounded hover:bg-white/20 opacity-0 group-hover:opacity-100 transition text-[var(--text-muted)] hover:text-rose-400 shrink-0 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="relative shrink-0 ml-1" ref={templateMenuRef} style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="flex items-center bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg hover:border-[var(--border-highlight)] transition">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNewTab('blank');
                }}
                className="px-2 py-1 text-xs text-[var(--text-primary)] font-medium flex items-center gap-1 hover:bg-white/10 rounded-l-lg transition"
                title="Create Blank Note (Ctrl+N)"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent)] pointer-events-none" />
                <span>New</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTemplateMenuOpen((prev) => !prev);
                }}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 rounded-r-lg border-l border-[var(--border-color)] transition"
                title="Choose Note Template"
              >
                <ChevronDown className="w-3 h-3 pointer-events-none" />
              </button>
            </div>
            {isTemplateMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-52 py-1.5 rounded-xl glass-panel border border-[var(--border-highlight)] shadow-2xl z-50 text-xs animate-modal-enter">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  Starter Templates
                </div>
                {NOTE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.type}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewTab(tmpl.type);
                      setIsTemplateMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 text-[var(--text-primary)] transition"
                  >
                    {getTemplateIcon(tmpl.iconName)}
                    <span>{tmpl.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button onClick={onOpenSettings} className="p-2 text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)] transition" title="Settings (⚙️)"><Settings className="w-3.5 h-3.5" /></button>
          <button onClick={handleMinimize} className="p-2 px-3 text-[var(--text-secondary)] hover:bg-white/10 transition"><Minus className="w-3.5 h-3.5" /></button>
          <button onClick={handleMaximize} className="p-2 px-3 text-[var(--text-secondary)] hover:bg-white/10 transition"><Square className="w-3 h-3" /></button>
          <button onClick={handleClose} className="p-2 px-3 text-[var(--text-secondary)] hover:bg-rose-600 hover:text-white transition"><X className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="h-7 px-3 flex items-center gap-1 text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] relative" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')} className="px-2.5 py-0.5 rounded hover:bg-white/10 hover:text-[var(--text-primary)] transition font-medium">File</button>
          {activeMenu === 'file' && (
            <div className="absolute left-0 mt-1 w-48 py-1 rounded-xl glass-panel border border-[var(--border-highlight)] shadow-2xl z-50 text-xs">
              <button onClick={() => { onNewTab('blank'); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between"><span>New Tab</span><span className="text-[10px] text-[var(--text-muted)] font-mono">Ctrl+N</span></button>
              <button onClick={() => { onOpenFile(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between"><span>Open File...</span><span className="text-[10px] text-[var(--text-muted)] font-mono">Ctrl+O</span></button>
              <button onClick={() => { onSaveFile(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between"><span>Save</span><span className="text-[10px] text-[var(--text-muted)] font-mono">Ctrl+S</span></button>
              <button onClick={() => { onSaveFileAs(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between"><span>Save As...</span><span className="text-[10px] text-[var(--text-muted)] font-mono">Ctrl+Shift+S</span></button>
            </div>
          )}
        </div>
        <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')} className="px-2.5 py-0.5 rounded hover:bg-white/10 hover:text-[var(--text-primary)] transition font-medium">Edit</button>
          {activeMenu === 'edit' && (
            <div className="absolute left-0 mt-1 w-48 py-1 rounded-xl glass-panel border border-[var(--border-highlight)] shadow-2xl z-50 text-xs">
              <button onClick={() => { if (activeNote) { const timeStr = `\n[${new Date().toLocaleString()}]\n`; onUpdateNote(activeNote.id, { content: activeNote.content + timeStr }); } setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between"><span>Time/Date</span><span className="text-[10px] text-[var(--text-muted)] font-mono">F5</span></button>
            </div>
          )}
        </div>
        <div className="relative" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')} className="px-2.5 py-0.5 rounded hover:bg-white/10 hover:text-[var(--text-primary)] transition font-medium">View</button>
          {activeMenu === 'view' && (
            <div className="absolute left-0 mt-1 w-48 py-1 rounded-xl glass-panel border border-[var(--border-highlight)] shadow-2xl z-50 text-xs">
              <button onClick={() => { onToggleSidebar(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between"><span>Toggle Navigation (Ctrl+B)</span></button>
              <button onClick={() => { onOpenFocusMode(); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 hover:bg-white/10 flex justify-between"><span>Focus Mode</span></button>
            </div>
          )}
        </div>
      </div>

      <div className="h-9 px-4 flex items-center gap-1 overflow-x-auto border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        {/* Heading Dropdown */}
        <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] px-2 py-1 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)]">
          <select
            onChange={(e) => applyHeading(e.target.value)}
            className="bg-transparent outline-none cursor-pointer text-xs"
          >
            <option value="normal" className="bg-[var(--bg-secondary)]">Normal</option>
            <option value="1" className="bg-[var(--bg-secondary)]">H1</option>
            <option value="2" className="bg-[var(--bg-secondary)]">H2</option>
            <option value="3" className="bg-[var(--bg-secondary)]">H3</option>
          </select>
        </div>

        <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

        {/* Formatting Buttons */}
        <button
          onClick={() => applyInline('**')}
          className="p-1.5 rounded hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs"
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => applyInline('*')}
          className="p-1.5 rounded hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] italic text-xs"
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => applyInline('~~')}
          className="p-1.5 rounded hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs"
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-[var(--border-color)] mx-1" />

        <button
          onClick={() => {
            if (activeNote) onUpdateNote(activeNote.id, { content: `${activeNote.content}\n- ` });
          }}
          className="p-1.5 rounded hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            if (activeNote) onUpdateNote(activeNote.id, { content: `${activeNote.content}\n[Link](https://)` });
          }}
          className="p-1.5 rounded hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="Insert Link"
        >
          <Link className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            if (activeNote)
              onUpdateNote(activeNote.id, {
                content: `${activeNote.content}\n| Col 1 | Col 2 |\n| :--- | :--- |\n| Data | Data |\n`,
              });
          }}
          className="p-1.5 rounded hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="Insert Table"
        >
          <Table className="w-3.5 h-3.5 text-amber-400" />
        </button>

        <button
          onClick={() => {
            if (activeNote) onUpdateNote(activeNote.id, { content: '' });
          }}
          className="p-1.5 rounded hover:bg-white/10 text-[var(--text-secondary)] hover:text-rose-400"
          title="Clear Text"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={activeNote?.fileType || 'txt'}
            onChange={(e) => {
              if (activeNote) onUpdateNote(activeNote.id, { fileType: e.target.value as any });
            }}
            className="text-[11px] px-2 py-0.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--accent)] font-mono border border-[var(--border-color)] outline-none cursor-pointer hover:border-[var(--accent)] transition"
            title="Choose file format when saving"
          >
            <option value="txt" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Text (.txt)</option>
            <option value="md" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Markdown (.md)</option>
            <option value="html" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">HTML (.html)</option>
            <option value="json" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">JSON (.json)</option>
            <option value="csv" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">CSV (.csv)</option>
          </select>
        </div>
      </div>
    </header>
  );
};
