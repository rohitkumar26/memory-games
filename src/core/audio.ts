// ============================================
// AudioManager — Web Audio API, synthesized sounds
// No external MP3s needed. Zero asset overhead.
// ============================================

export class AudioManager {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private volume = 0.5;
  private isMuted = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.isMuted = localStorage.getItem('mg_audio_muted') === 'true';
      } catch {
        this.isMuted = false;
      }
    }
  }

  async unlock(): Promise<void> {
    if (this.unlocked && this.ctx && this.ctx.state === 'running') return;
    try {
      if (!this.ctx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          this.ctx = new AudioCtxClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.unlocked = true;
    } catch (e) {
      console.warn('Audio unlock failed:', e);
    }
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  getVolume(): number {
    return this.volume;
  }

  isAudioMuted(): boolean {
    return this.isMuted;
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mg_audio_muted', String(this.isMuted));
        window.dispatchEvent(new CustomEvent('audiomutestatuschange', { detail: { muted: this.isMuted } }));
      } catch (e) {
        console.warn('Could not save mute preference:', e);
      }
    }
    return this.isMuted;
  }

  playTone(freq: number, duration: number, type: OscillatorType = 'sine'): void {
    if (this.isMuted || !this.ctx || !this.unlocked) return;
    const now = this.ctx.currentTime;
    this.tone(freq, duration, type, now);
  }

  play(type: 'flip' | 'match' | 'win' | 'error' | 'click' | 'simon-red' | 'simon-green' | 'simon-blue' | 'simon-yellow'): void {
    if (this.isMuted || !this.ctx || !this.unlocked) return;

    const now = this.ctx.currentTime;

    switch (type) {
      case 'flip':
        this.tone(400, 0.08, 'sine', now);
        this.tone(600, 0.08, 'sine', now + 0.03);
        break;
      case 'match':
        this.tone(523, 0.15, 'sine', now);      // C5
        this.tone(659, 0.15, 'sine', now + 0.1); // E5
        this.tone(784, 0.2, 'sine', now + 0.2);  // G5
        break;
      case 'win':
        this.tone(523, 0.2, 'sine', now);
        this.tone(659, 0.2, 'sine', now + 0.15);
        this.tone(784, 0.2, 'sine', now + 0.3);
        this.tone(1047, 0.4, 'sine', now + 0.45);
        break;
      case 'error':
        this.tone(200, 0.15, 'triangle', now);
        this.tone(180, 0.15, 'triangle', now + 0.1);
        break;
      case 'click':
        this.tone(800, 0.05, 'sine', now);
        break;
      case 'simon-red':
        this.tone(261.63, 0.25, 'sine', now); // C4
        break;
      case 'simon-green':
        this.tone(329.63, 0.25, 'sine', now); // E4
        break;
      case 'simon-blue':
        this.tone(392.00, 0.25, 'sine', now); // G4
        break;
      case 'simon-yellow':
        this.tone(523.25, 0.25, 'sine', now); // C5
        break;
    }
  }

  private tone(freq: number, duration: number, type: OscillatorType, when: number): void {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, when);

      gain.gain.setValueAtTime(this.volume * 0.3, when);
      gain.gain.exponentialRampToValueAtTime(0.001, when + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(when);
      osc.stop(when + duration);
    } catch {
      // Audio context might be closed or errored
    }
  }
}

export const globalAudio = new AudioManager();

if (typeof window !== 'undefined') {
  (window as unknown as { globalAudio: AudioManager }).globalAudio = globalAudio;
}
