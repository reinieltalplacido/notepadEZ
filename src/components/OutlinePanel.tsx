import React, { useMemo } from 'react';
import { ListTree, X, Hash, ChevronRight } from 'lucide-react';

interface OutlineItem {
  id: string;
  level: number; // 1 to 6
  text: string;
  line: number;
}

interface OutlinePanelProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
  onSelectHeader: (line: number, text: string) => void;
}

export const OutlinePanel: React.FC<OutlinePanelProps> = ({
  isOpen,
  content,
  onClose,
  onSelectHeader,
}) => {
  const outlineItems = useMemo(() => {
    if (!content) return [];

    const lines = content.split('\n');
    const items: OutlineItem[] = [];

    lines.forEach((lineText, index) => {
      const htmlMatch = lineText.match(/<h([1-6])\b[^>]*>(.*?)<\/h\1>/i);
      const mdMatch = lineText.match(/^(#{1,6})\s+(.+)$/);

      let level = 0;
      let text = '';

      if (htmlMatch) {
        level = parseInt(htmlMatch[1], 10);
        text = htmlMatch[2].replace(/<[^>]+>/g, '').trim();
      } else if (mdMatch) {
        level = mdMatch[1].length;
        text = mdMatch[2].trim().replace(/[*_~`]/g, '');
      }

      if (text && level > 0) {
        items.push({
          id: `heading-${index}-${level}`,
          level,
          text,
          line: index + 1,
        });
      }
    });

    return items;
  }, [content]);

  if (!isOpen) return null;

  return (
    <div className="w-64 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col h-full overflow-hidden select-none shrink-0 transition-all">
      {/* Panel Header */}
      <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
          <ListTree className="w-4 h-4 text-[var(--accent)]" />
          <span>Table of Contents</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
          title="Close Outline"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Outline List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {outlineItems.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--text-muted)] space-y-2">
            <Hash className="w-8 h-8 mx-auto opacity-30 text-[var(--text-muted)]" />
            <p>No headings found in this document.</p>
            <p className="text-[10px] opacity-75">Use #, ##, ### in markdown to build an outline.</p>
          </div>
        ) : (
          outlineItems.map((item) => {
            const indentMap: Record<number, string> = {
              1: 'pl-2 font-semibold text-[var(--text-primary)]',
              2: 'pl-5 text-[var(--text-primary)]',
              3: 'pl-8 text-[var(--text-secondary)]',
              4: 'pl-11 text-[var(--text-muted)]',
              5: 'pl-14 text-[var(--text-muted)]',
              6: 'pl-16 text-[var(--text-muted)]',
            };

            return (
              <button
                key={item.id}
                onClick={() => onSelectHeader(item.line, item.text)}
                className={`w-full text-left py-1.5 px-2 rounded-lg text-xs hover:bg-[var(--accent)]/15 hover:text-[var(--accent)] transition flex items-center gap-1.5 truncate group ${
                  indentMap[item.level] || 'pl-2'
                }`}
              >
                <ChevronRight className="w-3 h-3 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition shrink-0" />
                <span className="truncate">{item.text}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-[var(--border-color)] text-[10px] text-[var(--text-muted)] text-center">
        {outlineItems.length} {outlineItems.length === 1 ? 'heading' : 'headings'} detected
      </div>
    </div>
  );
};
