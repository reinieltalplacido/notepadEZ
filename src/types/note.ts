export type ThemeMode = 'cyber-dark' | 'neon-matrix' | 'sunset-glow' | 'minimal-light' | 'nordic-frost' | 'transparent';

export type FontChoice = 'sans' | 'serif' | 'mono' | 'dyslexic' | 'geist';

export type ViewMode = 'edit' | 'split' | 'preview';

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface NoteRevision {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  charCount: number;
}

export type FileExtension = 'txt' | 'md' | 'html' | 'json' | 'csv';

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isArchived?: boolean;
  isTrash?: boolean;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  wordTargetGoal?: number;
  revisions?: NoteRevision[];
  fileType?: FileExtension;
}

export interface NoteFilter {
  searchQuery: string;
  folderId: string | null;
  tagId: string | null;
  onlyPinned: boolean;
  onlyFavorites: boolean;
  onlyTrash: boolean;
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

export interface AppSettings {
  theme: ThemeMode;
  font: FontChoice;
  fontSize: number; // in px
  autoSaveIntervalMs: number;
  wordGoal: number;
  soundEnabled: boolean;
  soundVolume: number;
  activeSound: 'none' | 'rain' | 'whitenoise' | 'waves' | 'cafe';
}

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      openFileDialog: () => Promise<{ filePath: string; filename: string; content: string } | null>;
      saveFileDialog: (data: { content: string; defaultName?: string; filePath?: string }) => Promise<{ filePath: string; filename: string } | null>;
    };
  }
}
