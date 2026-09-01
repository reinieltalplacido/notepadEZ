// Web Audio API Ambient Generator for Offline Focus Sounds

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentType: string = 'none';

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  public playSound(type: 'rain' | 'whitenoise' | 'waves' | 'cafe', volume: number = 0.3) {
    this.stopSound();
    this.init();

    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.currentType = type;
    this.isPlaying = true;

    // Create 5-second buffer of white/pink noise
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'rain' || type === 'cafe') {
        // Pink noise approximation for rain/cafe atmosphere
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      } else {
        // Plain white noise
        output[i] = white * 0.15;
      }
    }

    const whiteNoiseSource = this.ctx.createBufferSource();
    whiteNoiseSource.buffer = buffer;
    whiteNoiseSource.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();

    if (type === 'rain') {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(1000, this.ctx.currentTime);
    } else if (type === 'waves') {
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.setValueAtTime(400, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(1.0, this.ctx.currentTime);
      
      // LFO modulation for ocean wave swells
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.15; // wave cycle every ~6.6 seconds
      lfoGain.gain.value = 250;
      lfo.connect(lfoGain);
      lfoGain.connect(this.filterNode.frequency);
      lfo.start();
    } else if (type === 'cafe') {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(600, this.ctx.currentTime);
    } else {
      // whitenoise
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(3000, this.ctx.currentTime);
    }

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(Math.min(Math.max(volume, 0), 1), this.ctx.currentTime);

    whiteNoiseSource.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    whiteNoiseSource.start();
    this.noiseNode = whiteNoiseSource;
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.min(Math.max(volume, 0), 1), this.ctx.currentTime);
    }
  }

  public stopSound() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
        this.noiseNode.disconnect();
      } catch {
        // Ignore disconnect errors if already stopped
      }
      this.noiseNode = null;
    }
    this.isPlaying = false;
    this.currentType = 'none';
  }

  public getStatus() {
    return { isPlaying: this.isPlaying, type: this.currentType };
  }
}

export const ambientEngine = new AmbientAudioEngine();
