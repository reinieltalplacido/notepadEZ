import React from 'react';
import { createPortal } from 'react-dom';
import { TemplateType } from '../types/note';
import { NOTE_TEMPLATES } from '../utils/templates';
import {
  FileText,
  CheckSquare,
  Users,
  FolderGit2,
  GraduationCap,
  BookOpen,
  X,
  Sparkles,
  Plus,
} from 'lucide-react';

interface TemplateSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateType: TemplateType) => void;
}

export const TemplateSelectModal: React.FC<TemplateSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'CheckSquare':
        return <CheckSquare className="w-6 h-6 text-emerald-400 shrink-0" />;
      case 'Users':
        return <Users className="w-6 h-6 text-indigo-400 shrink-0" />;
      case 'FolderGit2':
        return <FolderGit2 className="w-6 h-6 text-purple-400 shrink-0" />;
      case 'GraduationCap':
        return <GraduationCap className="w-6 h-6 text-amber-400 shrink-0" />;
      case 'BookOpen':
        return <BookOpen className="w-6 h-6 text-pink-400 shrink-0" />;
      default:
        return <FileText className="w-6 h-6 text-[var(--accent)] shrink-0" />;
    }
  };

  const getTemplateDescription = (type: TemplateType) => {
    switch (type) {
      case 'blank':
        return 'Start writing with a clean, empty canvas.';
      case 'todo':
        return 'Structured task list with priority categories & checkboxes.';
      case 'meeting':
        return 'Capture attendees, agendas, key decisions & action items.';
      case 'project':
        return 'Tech stack, milestones, architecture & dev notes.';
      case 'study':
        return 'Subject overview, core concepts & key takeaways.';
      case 'journal':
        return 'Daily reflections, mood tracker & achievements.';
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="animate-modal-enter relative w-full max-w-2xl p-6 rounded-2xl glass-panel border border-[var(--border-highlight)] shadow-2xl space-y-6 text-xs text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Create New Note</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Choose a template to get started or launch a blank note
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSelectTemplate('blank');
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition shadow-md shadow-[var(--accent-glow)] flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Blank Note</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Template Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NOTE_TEMPLATES.map((tmpl) => {
            const isBlank = tmpl.type === 'blank';
            return (
              <button
                key={tmpl.type}
                onClick={() => {
                  onSelectTemplate(tmpl.type);
                  onClose();
                }}
                className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between space-y-3 group ${
                  isBlank
                    ? 'bg-[var(--bg-tertiary)] border-[var(--accent)] hover:border-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent-glow)]'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--border-highlight)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] group-hover:scale-105 transition-transform">
                    {getTemplateIcon(tmpl.iconName)}
                  </div>
                  {isBlank && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold">
                      DEFAULT
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {tmpl.label}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {getTemplateDescription(tmpl.type)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};
