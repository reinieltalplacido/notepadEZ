import { Note, Folder, Tag, AppSettings } from '../types/note';

const NOTES_KEY = 'notepadEZ_notes_v3';
const FOLDERS_KEY = 'notepadEZ_folders_v2';
const TAGS_KEY = 'notepadEZ_tags_v2';
const SETTINGS_KEY = 'notepadEZ_settings_v1';

export const DEFAULT_FOLDERS: Folder[] = [];

export const DEFAULT_TAGS: Tag[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'minimal-light',
  font: 'sans',
  fontSize: 16,
  autoSaveIntervalMs: 1000,
  wordGoal: 300,
  soundEnabled: false,
  soundVolume: 0.3,
  activeSound: 'none',
  editorWidth: 'full',
};

export const SAMPLE_NOTES: Note[] = [
  {
    id: 'note-welcome',
    title: 'Welcome to NotepadEZ',
    content: `<h1>Welcome to NotepadEZ! 👋</h1>
<p>Your supercharged personal workspace built for speed, clean aesthetics, and distraction-free writing.</p>

<h2>🚀 Quick Start Tutorial</h2>
<ul>
  <li><b>Bold Text:</b> Highlight text and press <code>Ctrl+B</code> or click the <b>B</b> icon on the toolbar.</li>
  <li><b>Italic Text:</b> Highlight text and press <code>Ctrl+I</code> or click the <i>I</i> icon.</li>
  <li><b>Create New Note:</b> Click the <b>+ New</b> button in the tab bar or sidebar.</li>
  <li><b>Command Palette:</b> Press <code>Ctrl+K</code> to search notes or trigger actions instantly.</li>
  <li><b>Find & Replace:</b> Press <code>Ctrl+F</code> to search text inside your note.</li>
  <li><b>Full Screen Mode:</b> Click the expand icon or press <code>F11</code> for full screen focus. Press <code>Esc</code> to exit.</li>
</ul>

<hr />

<h2>✨ Key Features Included</h2>
<div class="task-item"><input type="checkbox" checked disabled /> <span>WYSIWYG Rich Text Editor</span></div>
<div class="task-item"><input type="checkbox" checked disabled /> <span>Windows 11 Tabbed Interface & Custom Themes</span></div>
<div class="task-item"><input type="checkbox" checked disabled /> <span>Real-time Statistics (Word & Character Counter)</span></div>
<div class="task-item"><input type="checkbox" checked disabled /> <span>File Attachments & Multi-Format Exporting</span></div>

<p><br></p>
<p><i>Start writing by editing this note or creating a new one above!</i></p>`,
    folderId: undefined,
    tags: [],
    isPinned: true,
    isFavorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    wordTargetGoal: 300,
  }
];

export function loadNotesFromStorage(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) {
      saveNotesToStorage(SAMPLE_NOTES);
      return SAMPLE_NOTES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load notes from storage:', e);
    return SAMPLE_NOTES;
  }
}

export function saveNotesToStorage(notes: Note[]): void {
  try {
    const cleanNotes = notes.map((n) => ({
      id: n.id,
      title: typeof n.title === 'string' ? n.title : String(n.title || ''),
      content: typeof n.content === 'string' ? n.content : String(n.content || ''),
      folderId: n.folderId,
      tags: Array.isArray(n.tags) ? n.tags.filter((t) => typeof t === 'string') : [],
      isPinned: Boolean(n.isPinned),
      isFavorite: Boolean(n.isFavorite),
      isArchived: Boolean(n.isArchived),
      isTrash: Boolean(n.isTrash),
      createdAt: typeof n.createdAt === 'number' ? n.createdAt : Date.now(),
      updatedAt: typeof n.updatedAt === 'number' ? n.updatedAt : Date.now(),
      wordTargetGoal: n.wordTargetGoal,
      fileType: n.fileType,
      filePath: n.filePath,
      revisions: n.revisions,
      attachments: n.attachments,
      template: n.template,
    }));
    localStorage.setItem(NOTES_KEY, JSON.stringify(cleanNotes));
  } catch (e) {
    console.error('Failed to save notes to storage:', e);
  }
}

export function loadFoldersFromStorage(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (!raw) {
      saveFoldersToStorage(DEFAULT_FOLDERS);
      return DEFAULT_FOLDERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_FOLDERS;
  }
}

export function saveFoldersToStorage(folders: Folder[]): void {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch (e) {
    console.error('Failed to save folders:', e);
  }
}

export function loadTagsFromStorage(): Tag[] {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    if (!raw) {
      saveTagsToStorage(DEFAULT_TAGS);
      return DEFAULT_TAGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_TAGS;
  }
}

export function saveTagsToStorage(tags: Tag[]): void {
  try {
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  } catch (e) {
    console.error('Failed to save tags:', e);
  }
}

export function loadSettingsFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
