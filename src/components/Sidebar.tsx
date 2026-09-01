import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Folder, Tag, NoteFilter, Note } from '../types/note';
import {
  FileText,
  Star,
  Pin,
  Trash2,
  Folder as FolderIcon,
  Plus,
  Tag as TagIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  TagPlus,
  Lightbulb,
  Briefcase,
  User,
  BookOpen,
  X
} from 'lucide-react';

import { ConfirmModal } from './ConfirmModal';

interface SidebarProps {
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  filter: NoteFilter;
  setFilter: React.Dispatch<React.SetStateAction<NoteFilter>>;
  onAddFolder: (name: string, color?: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onAddTag: (name: string, color?: string) => void;
  onDeleteTag: (tagId: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  folders,
  tags,
  filter,
  setFilter,
  onAddFolder,
  onDeleteFolder,
  onAddTag,
  onDeleteTag,
  collapsed,
  setCollapsed,
}) => {
  const [isFoldersOpen, setIsFoldersOpen] = useState(true);
  const [isTagsOpen, setIsTagsOpen] = useState(true);

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');

  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#8b5cf6');

  // Confirmation Modals State
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<Folder | null>(null);
  const [deleteTagTarget, setDeleteTagTarget] = useState<Tag | null>(null);

  const activeNotesCount = notes.filter((n) => !n.isTrash).length;
  const favoritesCount = notes.filter((n) => n.isFavorite && !n.isTrash).length;
  const pinnedCount = notes.filter((n) => n.isPinned && !n.isTrash).length;
  const trashCount = notes.filter((n) => n.isTrash).length;

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim(), newFolderColor);
      setNewFolderName('');
      setShowFolderModal(false);
    }
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim()) {
      onAddTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setShowTagModal(false);
    }
  };

  const renderFolderIcon = (iconName?: string, color?: string) => {
    const props = { className: "w-3.5 h-3.5 shrink-0", style: { color: color || '#3b82f6' } };
    switch (iconName) {
      case 'lightbulb': return <Lightbulb {...props} />;
      case 'briefcase': return <Briefcase {...props} />;
      case 'user': return <User {...props} />;
      case 'book': return <BookOpen {...props} />;
      default: return <FolderIcon {...props} />;
    }
  };

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444'];

  return (
    <aside
      className={`h-[calc(100vh-4rem)] border-r border-[var(--border-color)] bg-[var(--bg-secondary)] flex flex-col justify-between transition-all duration-300 relative z-20 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Navigation Section */}
        <div className="space-y-1">
          <button
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                onlyTrash: false,
                onlyFavorites: false,
                onlyPinned: false,
                folderId: null,
                tagId: null,
              }))
            }
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
              !filter.onlyTrash && !filter.onlyFavorites && !filter.onlyPinned && !filter.folderId && !filter.tagId
                ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-glow)]'
                : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
            }`}
            title="All Notes"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4" />
              {!collapsed && <span>All Notes</span>}
            </div>
            {!collapsed && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-black/20 font-mono">
                {activeNotesCount}
              </span>
            )}
          </button>

          <button
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                onlyTrash: false,
                onlyFavorites: true,
                onlyPinned: false,
                folderId: null,
                tagId: null,
              }))
            }
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
              filter.onlyFavorites
                ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-glow)]'
                : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
            }`}
            title="Favorites"
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              {!collapsed && <span>Favorites</span>}
            </div>
            {!collapsed && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-black/20 font-mono">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                onlyTrash: false,
                onlyFavorites: false,
                onlyPinned: true,
                folderId: null,
                tagId: null,
              }))
            }
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
              filter.onlyPinned
                ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent-glow)]'
                : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
            }`}
            title="Pinned Notes"
          >
            <div className="flex items-center gap-2.5">
              <Pin className="w-4 h-4 text-cyan-400" />
              {!collapsed && <span>Pinned</span>}
            </div>
            {!collapsed && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-black/20 font-mono">
                {pinnedCount}
              </span>
            )}
          </button>

          <button
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                onlyTrash: true,
                onlyFavorites: false,
                onlyPinned: false,
                folderId: null,
                tagId: null,
              }))
            }
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
              filter.onlyTrash
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
            }`}
            title="Trash"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4 text-rose-400" />
              {!collapsed && <span>Trash</span>}
            </div>
            {!collapsed && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-black/20 font-mono">
                {trashCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Folders Section */}
        {!collapsed && (
          <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
            <div
              onClick={() => setIsFoldersOpen(!isFoldersOpen)}
              className="flex items-center justify-between px-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
            >
              <div className="flex items-center gap-1.5">
                {/* Animated chevron — rotates 90° when open */}
                <ChevronRight
                  className="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{ transform: isFoldersOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                />
                <span>FOLDERS</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFolderModal(true);
                }}
                className="p-1 rounded hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Create New Folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Smooth grid-rows collapse — iOS spring feel */}
            <div
              className="grid transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                gridTemplateRows: isFoldersOpen ? '1fr' : '0fr',
                opacity: isFoldersOpen ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <div className="space-y-0.5 pb-1">
                  {folders.map((folder) => {
                    const count = notes.filter((n) => n.folderId === folder.id && !n.isTrash).length;
                    const isSelected = filter.folderId === folder.id;
                    return (
                      <div key={folder.id} className="group relative flex items-center">
                        <button
                          onClick={() =>
                            setFilter((prev) => ({
                              ...prev,
                              onlyTrash: false,
                              folderId: isSelected ? null : folder.id,
                            }))
                          }
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                            isSelected
                              ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-semibold border border-[var(--accent)]/30'
                              : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {renderFolderIcon(folder.icon, folder.color)}
                            <span className="truncate">{folder.name}</span>
                          </div>
                          <span className="text-[10px] opacity-60 font-mono group-hover:hidden">{count}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteFolderTarget(folder);
                          }}
                          className="absolute right-2 p-1 rounded hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-400 hidden group-hover:flex transition"
                          title="Delete Folder"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Tags Section */}
        {!collapsed && (
          <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
            <div
              onClick={() => setIsTagsOpen(!isTagsOpen)}
              className="flex items-center justify-between px-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
            >
              <div className="flex items-center gap-1.5">
                {/* Animated chevron */}
                <ChevronRight
                  className="w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{ transform: isTagsOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                />
                <span>TAGS</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTagModal(true);
                }}
                className="p-1 rounded hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Create New Tag"
              >
                <TagPlus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Smooth grid-rows collapse — iOS spring feel */}
            <div
              className="grid transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                gridTemplateRows: isTagsOpen ? '1fr' : '0fr',
                opacity: isTagsOpen ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <div className="flex flex-wrap gap-1.5 px-1 pb-1">
                  {tags.map((tag) => {
                    const isSelected = filter.tagId === tag.id;
                    return (
                      <div
                        key={tag.id}
                        className={`group flex items-center rounded-lg text-[11px] font-medium transition-colors border ${
                          isSelected
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--border-highlight)]'
                        }`}
                      >
                        <button
                          onClick={() =>
                            setFilter((prev) => ({
                              ...prev,
                              onlyTrash: false,
                              tagId: isSelected ? null : tag.id,
                            }))
                          }
                          className="px-2 py-1 flex items-center gap-1"
                        >
                          <TagIcon className="w-3 h-3 text-[var(--accent)]" />
                          <span>{tag.name}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTagTarget(tag);
                          }}
                          className="pr-1.5 pl-0 text-[var(--text-muted)] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                          title="Delete Tag"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Collapse Toggle Button */}
      <div className="p-3 border-t border-[var(--border-color)] flex justify-end">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--border-highlight)] transition w-full flex items-center justify-center"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Confirmation Modal for Folder Deletion */}
      <ConfirmModal
        isOpen={!!deleteFolderTarget}
        title="Delete Folder"
        message={`Are you sure you want to delete the folder "${deleteFolderTarget?.name}"? Notes inside will not be deleted.`}
        confirmText="Delete Folder"
        onConfirm={() => {
          if (deleteFolderTarget) onDeleteFolder(deleteFolderTarget.id);
        }}
        onCancel={() => setDeleteFolderTarget(null)}
      />

      {/* Confirmation Modal for Tag Deletion */}
      <ConfirmModal
        isOpen={!!deleteTagTarget}
        title="Delete Tag"
        message={`Are you sure you want to delete the tag "#${deleteTagTarget?.name}"?`}
        confirmText="Delete Tag"
        onConfirm={() => {
          if (deleteTagTarget) onDeleteTag(deleteTagTarget.id);
        }}
        onCancel={() => setDeleteTagTarget(null)}
      />

      {/* Modal Create Folder (Rendered at Body Portal for Fullscreen Backdrop) */}
      {showFolderModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <form onSubmit={handleCreateFolder} className="animate-modal-enter w-full max-w-xs p-5 rounded-2xl glass-panel border border-[var(--border-highlight)] shadow-2xl space-y-4 text-[var(--text-primary)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Folder</h3>
              <input
                type="text"
                placeholder="Folder Name (e.g. Work)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] text-xs text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--accent)] outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setNewFolderColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${newFolderColor === c ? 'scale-125 ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs rounded-xl bg-[var(--accent)] text-white font-medium shadow-md shadow-[var(--accent-glow)]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* Modal Create Tag (Rendered at Body Portal for Fullscreen Backdrop) */}
      {showTagModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <form onSubmit={handleCreateTag} className="animate-modal-enter w-full max-w-xs p-5 rounded-2xl glass-panel border border-[var(--border-highlight)] shadow-2xl space-y-4 text-[var(--text-primary)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Tag</h3>
              <input
                type="text"
                placeholder="Tag Name (e.g. urgent)"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] text-xs text-[var(--text-primary)] border border-[var(--border-color)] focus:border-[var(--accent)] outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs rounded-xl bg-[var(--accent)] text-white font-medium shadow-md shadow-[var(--accent-glow)]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}
    </aside>
  );
};
