import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PATCH_NOTES, PatchRelease } from '../data/patchNotes';
import { checkForAppUpdates, UpdateInfo } from '../utils/updateChecker';
import { X, Sparkles, Tag, CheckCircle2, Wrench, Bug, Download, ArrowUpCircle } from 'lucide-react';

interface PatchNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatchNotesModal: React.FC<PatchNotesModalProps> = ({ isOpen, onClose }) => {
  const [selectedVersion, setSelectedVersion] = useState<string>(PATCH_NOTES[0]?.version || '1.0.0');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsCheckingUpdate(true);
      checkForAppUpdates().then((info) => {
        setUpdateInfo(info);
        setIsCheckingUpdate(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRelease: PatchRelease =
    PATCH_NOTES.find((release) => release.version === selectedVersion) || PATCH_NOTES[0];

  const getBadgeStyle = (type: 'feature' | 'improvement' | 'fix') => {
    switch (type) {
      case 'feature':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />,
          label: 'Feature',
        };
      case 'improvement':
        return {
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          icon: <Wrench className="w-3 h-3 text-indigo-400 shrink-0" />,
          label: 'Improved',
        };
      case 'fix':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: <Bug className="w-3 h-3 text-amber-400 shrink-0" />,
          label: 'Fix',
        };
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="animate-modal-enter relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl glass-panel border border-[var(--border-highlight)] shadow-2xl overflow-hidden text-xs text-[var(--text-primary)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                What's New in notepadEZ
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--accent)] text-white font-medium">
                  v{currentRelease.version}
                </span>
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">Release history and recent updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden divide-x divide-[var(--border-color)]">
          {/* Version Selector Sidebar */}
          <div className="w-44 p-3 space-y-1.5 bg-[var(--bg-primary)] overflow-y-auto shrink-0">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Releases
            </div>
            {PATCH_NOTES.map((release) => {
              const isSelected = release.version === selectedVersion;
              return (
                <button
                  key={release.version}
                  onClick={() => setSelectedVersion(release.version)}
                  className={`w-full p-2.5 rounded-xl text-left transition border flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md shadow-[var(--accent-glow)]'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--border-highlight)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">v{release.version}</span>
                    {release.isLatest && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[var(--accent)]/20 text-[var(--accent)]'
                        }`}
                      >
                        Latest
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                    {release.date}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Release Detail Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[var(--bg-secondary)]">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{currentRelease.title}</h3>
                  <span className="text-[11px] text-[var(--text-muted)]">Released {currentRelease.date}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">
                  <Tag className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>{currentRelease.changes.length} Changes</span>
                </div>
              </div>
            </div>

            {/* Changes List */}
            <div className="space-y-3">
              {currentRelease.changes.map((item, idx) => {
                const badge = getBadgeStyle(item.type);
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--border-highlight)] transition space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold border ${badge.bg}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                      <h4 className="font-semibold text-xs text-[var(--text-primary)]">{item.title}</h4>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed pl-1">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-primary)] flex items-center justify-between">
          {updateInfo?.updateAvailable ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ArrowUpCircle className="w-4 h-4 animate-bounce shrink-0" />
              <span>Update Available: v{updateInfo.latestVersion}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isCheckingUpdate ? 'Checking for updates...' : 'notepadEZ is up to date'}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {updateInfo?.updateAvailable && updateInfo.downloadUrl && (
              <a
                href={updateInfo.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Update Now</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition shadow-md shadow-[var(--accent-glow)]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
