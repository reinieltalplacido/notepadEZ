import { Note, Folder, Tag, AppSettings } from '../types/note';

const NOTES_KEY = 'notepadEZ_notes_v1';
const FOLDERS_KEY = 'notepadEZ_folders_v1';
const TAGS_KEY = 'notepadEZ_tags_v1';
const SETTINGS_KEY = 'notepadEZ_settings_v1';

export const DEFAULT_FOLDERS: Folder[] = [
  { id: 'f-ideas', name: 'Ideas', color: '#f59e0b', icon: 'lightbulb' },
  { id: 'f-work', name: 'Work & Dev', color: '#3b82f6', icon: 'briefcase' },
  { id: 'f-personal', name: 'Personal', color: '#ec4899', icon: 'user' },
  { id: 'f-learn', name: 'Learning', color: '#10b981', icon: 'book' },
];

export const DEFAULT_TAGS: Tag[] = [
  { id: 't-urgent', name: 'urgent', color: '#ef4444' },
  { id: 't-feature', name: 'feature', color: '#8b5cf6' },
  { id: 't-project', name: 'project', color: '#06b6d4' },
  { id: 't-todo', name: 'todo', color: '#10b981' },
];

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
    title: 'Welcome to Notepad',
    content: `# Welcome to Notepad

Your personal **supercharged workspace** built for speed, clean aesthetics, and productivity.

### Key Features:
- **Windows 11 Tabbed Interface**: Work across multiple text files seamlessly.
- **Interactive Checklists**: 
  - [x] Create your first note
  - [x] Try switching themes in settings
  - [ ] Activate Zen Focus Mode for distraction-free writing
  - [ ] Press Ctrl+K to open the Command Palette

---

### Code Snippet Example
\`\`\`typescript
interface UserWorkspace {
  appName: string;
  isAwesome: boolean;
  features: string[];
}

const myApp: UserWorkspace = {
  appName: "Notepad",
  isAwesome: true,
  features: ["Multi-tab", "Focus Mode", "Export", "Offline First"]
};

console.log(\`Launching \${myApp.appName}...\`);
\`\`\`

> *"Simplicity is prerequisite for reliability."* — Edsger W. Dijkstra`,
    folderId: 'f-personal',
    tags: ['t-project', 't-todo'],
    isPinned: true,
    isFavorite: true,
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    wordTargetGoal: 300,
  },
  {
    id: 'note-cheat-sheet',
    title: 'Quick Markdown Syntax Cheatsheet',
    content: `# Quick Markdown Guide

Use these shortcuts to format your notes instantly:

## Headers
# Header 1
## Header 2
### Header 3

## Text Formatting
- **Bold text**: \`**bold**\`
- *Italic text*: \`*italic*\`
- ~~Strikethrough~~: \`~~strikethrough~~\`
- \`Inline code\`: \` \`code\` \`

## Lists
- Item A
- Item B
- Item C

- [x] Completed task
- [ ] Pending task

## Blockquote
> This is a blockquote. Great for key takeaways, quotes, or highlights!
`,
    folderId: 'f-learn',
    tags: ['t-feature'],
    isPinned: true,
    isFavorite: false,
    createdAt: Date.now() - 3600000 * 5,
    updatedAt: Date.now() - 3600000 * 5,
  },
  {
    id: 'note-ideas',
    title: 'App Expansion Ideas & Todos',
    content: `# Feature Wishlist

- [ ] Add cloud sync integration option
- [ ] Add customizable keyboard shortcuts
- [x] Build Windows 11 tabbed interface
`,
    folderId: 'f-ideas',
    tags: ['t-todo', 't-urgent'],
    isPinned: false,
    isFavorite: true,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 24,
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
