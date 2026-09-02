import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from './hooks/useNotes';
import { ViewMode, ThemeMode, FontChoice } from './types/note';
import { Win11NotepadHeader } from './components/win11/Win11NotepadHeader';
import { WinStatusBar } from './components/win11/WinStatusBar';
import { WinSettingsModal } from './components/win11/WinSettingsModal';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { Editor } from './components/Editor';
import { FocusMode } from './components/FocusMode';
import { CommandPalette } from './components/CommandPalette';
import { AmbientPlayer } from './components/AmbientPlayer';
import { ShortcutsModal } from './components/ShortcutsModal';
import { Toast } from './components/Toast';

export function App() {
  const {
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
  } = useNotes();

  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNoteListOpen, setIsNoteListOpen] = useState(true);

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => {
      const next = !prev;
      setIsSidebarOpen(!next);
      return next;
    });
  };
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Cursor Line & Col tracking
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  // Apply theme — also makes body transparent for the acrylic theme
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme || 'minimal-light');
    // For transparent theme, body needs a transparent background so the OS shows through
    if (settings.theme === 'transparent') {
      document.body.style.background = 'transparent';
      root.style.background = 'transparent';
    } else {
      document.body.style.background = '';
      root.style.background = '';
    }
  }, [settings.theme]);

  // Apply selected font to the entire app
  useEffect(() => {
    const fontClassMap: Record<string, string> = {
      mono: 'font-mono',
      sans: 'font-sans',
      serif: 'font-serif',
      dyslexic: 'font-dyslexic',
      geist: 'font-geist',
    };
    const el = document.documentElement;
    // Remove previous font classes
    el.classList.remove('font-mono', 'font-sans', 'font-serif', 'font-dyslexic', 'font-geist');
    const cls = fontClassMap[settings.font];
    if (cls) el.classList.add(cls);
  }, [settings.font]);

  // Handle native open file dialog
  const handleOpenFile = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFileDialog();
      if (result) {
        const newNote = createNote();
        updateNote(newNote.id, { title: result.filename, content: result.content, filePath: result.filePath });
        showToast(`Opened ${result.filename}`, 'success');
      }
    }
  };

  // Handle save file dialog with selected fileType
  const handleSaveFile = async (forceSaveAs: boolean = false) => {
    if (!activeNote) return;
    const ext = activeNote.fileType || 'txt';
    const cleanTitle = (activeNote.title || 'Untitled').replace(/[\\/:*?"<>|]/g, '').trim();
    const defaultFilename = cleanTitle.endsWith(`.${ext}`) ? cleanTitle : `${cleanTitle}.${ext}`;

    const mimeMap: Record<string, string> = {
      txt: 'text/plain',
      md: 'text/markdown',
      html: 'text/html',
      json: 'application/json',
      csv: 'text/csv',
    };

    if (window.electronAPI) {
      const result = await window.electronAPI.saveFileDialog({
        content: activeNote.content,
        defaultName: defaultFilename,
        filePath: forceSaveAs ? undefined : activeNote.filePath,
      });
      if (result) {
        updateNote(activeNote.id, { title: result.filename, filePath: result.filePath });
        showToast(`Saved ${result.filename}`, 'success');
      }
    } else {
      // Browser fallback save with dynamic MIME type & extension
      const blob = new Blob([activeNote.content], { type: `${mimeMap[ext] || 'text/plain'};charset=utf-8;` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloaded as ${defaultFilename}`, 'success');
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P or Ctrl+K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'k' || (e.shiftKey && e.key.toLowerCase() === 'p'))) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Ctrl+Shift+B -> Toggle Note List
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsNoteListOpen((prev) => !prev);
      }
      // Ctrl+B -> Toggle Sidebar Navigation
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      }
      if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        toggleFullScreen();
      }
      if (e.key === 'Escape') {
        setIsFullScreen(false);
        setIsSidebarOpen(true);
        setIsFocusModeOpen(false);
        setIsCommandPaletteOpen(false);
        setIsAudioPlayerOpen(false);
        setIsShortcutsOpen(false);
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNote, activeNote]);

  return (
    <div className="h-screen w-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans overflow-hidden select-none">
      {/* Windows 11 Fluent Header & Tabs (Hidden in Full Screen) */}
      {!isFullScreen && (
        <Win11NotepadHeader
          notes={notes}
          openTabIds={openTabIds}
          activeNoteId={activeNoteId}
          onSelectTab={(id) => setActiveNoteId(id)}
          onCloseTab={(id) => closeTab(id)}
          onNewTab={(templateType) => createNoteFromTemplate(templateType || 'blank')}
          activeNote={activeNote}
          onUpdateNote={updateNote}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFile={handleOpenFile}
          onSaveFile={() => handleSaveFile(false)}
          onSaveFileAs={() => handleSaveFile(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onOpenFocusMode={() => setIsFocusModeOpen(true)}
          onDuplicateNote={duplicateNote}
          onTogglePin={togglePin}
        />
      )}

      {/* Main Workspace Layout (Sidebar + NoteList + Editor) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav (Toggleable & Hidden in Full Screen) */}
        {!isFullScreen && isSidebarOpen && (
          <Sidebar
            notes={notes}
            folders={folders}
            tags={tags}
            filter={filter}
            setFilter={setFilter}
            onAddFolder={addFolder}
            onDeleteFolder={deleteFolder}
            onAddTag={addTag}
            onDeleteTag={deleteTag}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            onUpdateNoteFolder={(noteId, folderId) => updateNote(noteId, { folderId })}
          />
        )}

        {/* Note List Cards (Hidden in Full Screen) */}
        {!isFullScreen && isSidebarOpen && isNoteListOpen && (
          <NoteList
            notes={filteredNotes}
            activeNoteId={activeNoteId}
            setActiveNoteId={setActiveNoteId}
            filter={filter}
            setFilter={setFilter}
            folders={folders}
            tags={tags}
            onCreateNote={createNote}
            onTogglePin={togglePin}
            onToggleFavorite={toggleFavorite}
            onDuplicateNote={duplicateNote}
            onDeleteNote={deleteNote}
            onRestoreNote={restoreNote}
            onPermanentDeleteNote={permanentDeleteNote}
            onUpdateNoteFolder={(noteId, folderId) => updateNote(noteId, { folderId })}
          />
        )}

        {/* Text Canvas Editor */}
        <Editor
          note={activeNote}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          folders={folders}
          tags={tags}
          onUpdateNote={updateNote}
          font={settings.font}
          onCreateSnapshot={createRevisionSnapshot}
          onRestoreRevision={restoreRevision}
          isFullScreen={isFullScreen}
          onToggleFullScreen={toggleFullScreen}
          editorWidth={settings.editorWidth}
          onAddAttachment={addAttachment}
          onRemoveAttachment={removeAttachment}
        />
      </div>

      {/* Windows 11 Bottom Status Bar (Hidden in Full Screen) */}
      {!isFullScreen && (
        <WinStatusBar
          content={activeNote ? activeNote.content : ''}
          cursorLine={cursorLine}
          cursorCol={cursorCol}
          zoomPercent={100}
          fileType={activeNote?.fileType || 'txt'}
          onFileTypeChange={(type) => activeNote && updateNote(activeNote.id, { fileType: type as any })}
        />
      )}

      {/* Overlays & Modals */}
      <WinSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      <FocusMode
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
        note={activeNote}
        onUpdateNote={updateNote}
        font={settings.font}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        notes={notes}
        onSelectNote={(id) => setActiveNoteId(id)}
        onCreateNote={createNote}
        setTheme={(theme: ThemeMode) => updateSettings({ theme })}
        setViewMode={setViewMode}
        onOpenFocusMode={() => setIsFocusModeOpen(true)}
        onOpenAudioPlayer={() => setIsAudioPlayerOpen(true)}
      />

      <AmbientPlayer
        isOpen={isAudioPlayerOpen}
        onClose={() => setIsAudioPlayerOpen(false)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;
