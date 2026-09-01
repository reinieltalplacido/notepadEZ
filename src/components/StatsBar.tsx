import React from 'react';
import { calculateNoteStats } from '../utils/markdown';
import { Clock, FileText } from 'lucide-react';

interface StatsBarProps {
  content: string;
  wordTargetGoal?: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ content }) => {
  const stats = calculateNoteStats(content);

  return (
    <div className="h-9 px-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between text-[11px] text-[var(--text-secondary)] select-none">
      {/* Basic Metrics */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 font-mono">
          <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
          <strong className="text-[var(--text-primary)]">{stats.words}</strong> words
        </span>
        <span className="font-mono">
          <strong className="text-[var(--text-primary)]">{stats.chars}</strong> chars
        </span>
        <span className="hidden sm:inline font-mono">
          <strong className="text-[var(--text-primary)]">{stats.lines}</strong> lines
        </span>
        <span className="hidden md:flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          {stats.readingTimeMinutes} min read
        </span>
      </div>

    </div>
  );
};
