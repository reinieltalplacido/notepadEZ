import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, VolumeX, CloudRain, Wind, Waves, Coffee, X } from 'lucide-react';
import { ambientEngine } from '../utils/audio';

interface AmbientPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AmbientPlayer: React.FC<AmbientPlayerProps> = ({ isOpen, onClose }) => {
  const [activeSound, setActiveSound] = useState<'none' | 'rain' | 'whitenoise' | 'waves' | 'cafe'>('none');
  const [volume, setVolume] = useState<number>(0.3);

  if (!isOpen) return null;

  const handleSelectSound = (sound: 'rain' | 'whitenoise' | 'waves' | 'cafe') => {
    if (activeSound === sound) {
      ambientEngine.stopSound();
      setActiveSound('none');
    } else {
      ambientEngine.playSound(sound, volume);
      setActiveSound(sound);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    ambientEngine.setVolume(val);
  };

  const sounds = [
    { id: 'rain', name: 'Gentle Rain', icon: <CloudRain className="w-5 h-5" /> },
    { id: 'waves', name: 'Ocean Waves', icon: <Waves className="w-5 h-5" /> },
    { id: 'cafe', name: 'Coffee Shop', icon: <Coffee className="w-5 h-5" /> },
    { id: 'whitenoise', name: 'Deep Breeze', icon: <Wind className="w-5 h-5" /> },
  ] as const;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-[var(--text-primary)]">
      <div className="animate-modal-enter relative w-full max-w-sm p-6 rounded-2xl glass-panel border border-[var(--border-highlight)] shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-[var(--accent)] font-semibold text-lg">
            <Volume2 className="w-5 h-5" />
            <span>Ambient Focus Audio</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] mb-4">
          Synthesized offline focus audio designed for deep concentration without distractions.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {sounds.map((s) => {
            const isSelected = activeSound === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectSound(s.id)}
                className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg shadow-[var(--accent-glow)]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--border-highlight)]'
                }`}
              >
                {s.icon}
                <span className="text-xs font-medium">{s.name}</span>
              </button>
            );
          })}
        </div>

        {/* Volume Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[var(--accent)]" />}
              Volume
            </span>
            <span className="font-mono">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
