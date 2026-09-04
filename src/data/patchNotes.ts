export interface PatchNoteItem {
  type: 'feature' | 'improvement' | 'fix';
  title: string;
  description: string;
}

export interface PatchRelease {
  version: string;
  date: string;
  title: string;
  isLatest?: boolean;
  changes: PatchNoteItem[];
}

export const PATCH_NOTES: PatchRelease[] = [
  {
    version: '1.0.0',
    date: 'September 2026',
    title: 'Initial Supercharged Release',
    isLatest: true,
    changes: [
      {
        type: 'feature',
        title: 'Windows 11 Fluent UI Canvas',
        description: 'Modern rounded tab interface with glassmorphism blur and custom acrylic dark/light themes.',
      },
      {
        type: 'feature',
        title: 'One-Click PowerShell Installer (irm)',
        description: 'Added automated single-command installation support for Windows terminal.',
      },
      {
        type: 'feature',
        title: 'Pure Rich Text WYSIWYG & Auto-Markdown Conversion',
        description: 'Format content visually without markdown markup clutter, auto-converting pasted markdown directly.',
      },
      {
        type: 'feature',
        title: 'Multi-Format Native Export',
        description: 'Export notes directly to .txt, .md, .html, .csv, and .json.',
      },
      {
        type: 'improvement',
        title: 'Distraction-Free Edge-to-Edge Canvas',
        description: 'Toggle full screen mode via F11 with active tab and title persistence.',
      },
      {
        type: 'improvement',
        title: 'Clickable Web Links Modal',
        description: 'Win11 glass frosted link modal for effortless web link insertion and browser launching.',
      },
      {
        type: 'fix',
        title: 'Real-Time Auto Save Stability',
        description: 'Ensured state persistence across session resets without draft loss.',
      },
    ],
  },
];
