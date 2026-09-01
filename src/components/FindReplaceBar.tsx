import React, { useState, useEffect, useRef } from 'react';
import { Search, Replace, ChevronUp, ChevronDown, X, CaseSensitive, CheckCheck } from 'lucide-react';

interface FindReplaceBarProps {
  isOpen: boolean;
  initialReplaceMode?: boolean;
  onClose: () => void;
  onSearch: (query: string, matchCase: boolean) => void;
  onNavigateMatch: (direction: 'next' | 'prev') => void;
  onReplaceCurrent: (replaceText: string) => void;
  onReplaceAll: (replaceText: string) => void;
  matchIndex: number;
  totalMatches: number;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  isOpen,
  initialReplaceMode = false,
  onClose,
  onSearch,
  onNavigateMatch,
  onReplaceCurrent,
  onReplaceAll,
  matchIndex,
  totalMatches,
}) => {
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isReplaceMode, setIsReplaceMode] = useState(initialReplaceMode);
  const [matchCase, setMatchCase] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsReplaceMode(initialReplaceMode);
  }, [initialReplaceMode]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    onSearch(query, matchCase);
  }, [query, matchCase, onSearch]);

  if (!isOpen) return null;

  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onNavigateMatch(e.shiftKey ? 'prev' : 'next');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleKeyDownReplace = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onReplaceCurrent(replaceText);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="absolute top-3 right-6 z-30 flex flex-col gap-2 p-2.5 rounded-xl glass-panel border border-[var(--border-highlight)] shadow-2xl bg-[var(--bg-secondary)]/95 backdrop-blur-md text-xs text-[var(--text-primary)] w-80 sm:w-96 transition-all duration-200 animate-in fade-in slide-in-from-top-2">
      {/* Search Input Row */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 flex items-center bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] px-2 focus-within:border-[var(--accent)] transition">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mr-1.5" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownSearch}
            placeholder="Find text..."
            className="w-full bg-transparent py-1.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          {query && (
            <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0 pl-1">
              {totalMatches > 0 ? `${matchIndex + 1} of ${totalMatches}` : 'No matches'}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <button
          onClick={() => setMatchCase(!matchCase)}
          className={`p-1.5 rounded-lg border transition ${
            matchCase
              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
          }`}
          title="Match Case (Aa)"
        >
          <CaseSensitive className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
          <button
            onClick={() => onNavigateMatch('prev')}
            disabled={totalMatches === 0}
            className="p-1.5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition rounded-l-lg"
            title="Previous Match (Shift+Enter)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-[var(--border-color)]" />
          <button
            onClick={() => onNavigateMatch('next')}
            disabled={totalMatches === 0}
            className="p-1.5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition rounded-r-lg"
            title="Next Match (Enter)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => setIsReplaceMode(!isReplaceMode)}
          className={`p-1.5 rounded-lg border transition ${
            isReplaceMode
              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
          }`}
          title="Toggle Replace Mode (Ctrl+H)"
        >
          <Replace className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-rose-400 transition"
          title="Close (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Replace Input Row */}
      {isReplaceMode && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-[var(--border-color)]">
          <div className="relative flex-1 flex items-center bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] px-2 focus-within:border-[var(--accent)] transition">
            <Replace className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mr-1.5" />
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={handleKeyDownReplace}
              placeholder="Replace with..."
              className="w-full bg-transparent py-1.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>

          <button
            onClick={() => onReplaceCurrent(replaceText)}
            disabled={totalMatches === 0}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] disabled:opacity-30 transition font-medium text-[11px] shrink-0"
            title="Replace current match"
          >
            Replace
          </button>

          <button
            onClick={() => onReplaceAll(replaceText)}
            disabled={totalMatches === 0}
            className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] disabled:opacity-30 transition font-medium text-[11px] flex items-center gap-1 shrink-0"
            title="Replace all matches"
          >
            <CheckCheck className="w-3 h-3" />
            All
          </button>
        </div>
      )}
    </div>
  );
};
