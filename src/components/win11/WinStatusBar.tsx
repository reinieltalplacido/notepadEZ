import React from 'react';

interface WinStatusBarProps {
  content: string;
  cursorLine?: number;
  cursorCol?: number;
  zoomPercent?: number;
  encoding?: string;
  lineEnding?: string;
  fileType?: string;
  onFileTypeChange?: (type: string) => void;
}

export const WinStatusBar: React.FC<WinStatusBarProps> = ({
  content,
  cursorLine = 1,
  cursorCol = 1,
  zoomPercent = 100,
  encoding = 'UTF-8',
  lineEnding = 'Windows (CRLF)',
  fileType = 'txt',
  onFileTypeChange,
}) => {
  const chars = content ? content.length : 0;

  return (
    <footer className="h-7 px-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-sans select-none shrink-0 z-30">
      {/* Left: Line & Column, Characters, Auto-Save status */}
      <div className="flex items-center gap-5">
        <span className="font-mono text-[var(--text-primary)]">
          Ln {cursorLine}, Col {cursorCol}
        </span>
        <span className="font-mono text-[var(--text-primary)]">
          {chars} characters
        </span>
        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Auto-saved
        </span>
      </div>

      {/* Right: Format, Zoom, Line Ending, Encoding */}
      <div className="flex items-center gap-6 text-[var(--text-muted)] font-mono">
        <select
          value={fileType}
          onChange={(e) => onFileTypeChange && onFileTypeChange(e.target.value)}
          className="hidden sm:inline bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-[11px] outline-none cursor-pointer"
        >
          <option value="txt" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Plain text (.txt)</option>
          <option value="md" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">Markdown (.md)</option>
          <option value="html" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">HTML (.html)</option>
          <option value="json" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">JSON (.json)</option>
          <option value="csv" className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">CSV (.csv)</option>
        </select>
        <span>{zoomPercent}%</span>
        <span className="hidden md:inline">{lineEnding}</span>
        <span>{encoding}</span>
      </div>
    </footer>
  );
};
