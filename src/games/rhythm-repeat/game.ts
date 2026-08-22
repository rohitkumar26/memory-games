import type { GameModule, EngineAPI } from '../../core/types';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

interface InstrumentPad {
  id: number;
  name: string;
  emoji: string;
  color: string;
  activeColor: string;
  freq: number;
}

interface InstrumentTheme {
  id: string;
  name: string;
  icon: string;
  pads: InstrumentPad[];
}

const INSTRUMENT_THEMES: InstrumentTheme[] = [
  {
    id: 'drums',
    name: 'Jungle Drums',
    icon: '🥁',
    pads: [
      { id: 0, name: 'Bongo', emoji: '🪘', color: 'bg-amber-500 border-amber-600', activeColor: 'bg-amber-300 ring-8 ring-amber-200', freq: 180 },
      { id: 1, name: 'Snare', emoji: '🥁', color: 'bg-rose-500 border-rose-600', activeColor: 'bg-rose-300 ring-8 ring-rose-200', freq: 280 },
      { id: 2, name: 'Maracas', emoji: '🪇', color: 'bg-emerald-500 border-emerald-600', activeColor: 'bg-emerald-300 ring-8 ring-emerald-200', freq: 440 },
      { id: 3, name: 'Cymbal', emoji: '🔔', color: 'bg-sky-500 border-sky-600', activeColor: 'bg-sky-300 ring-8 ring-sky-200', freq: 620 }
    ]
  },
  {
    id: 'piano',
    name: 'Magic Piano',
    icon: '🎹',
    pads: [
      { id: 0, name: 'Do (C4)', emoji: '🎵', color: 'bg-red-500 border-red-600', activeColor: 'bg-red-300 ring-8 ring-red-200', freq: 261.63 },
      { id: 1, name: 'Mi (E4)', emoji: '🎶', color: 'bg-yellow-500 border-yellow-600', activeColor: 'bg-yellow-300 ring-8 ring-yellow-200', freq: 329.63 },
      { id: 2, name: 'Sol (G4)', emoji: '🎼', color: 'bg-green-500 border-green-600', activeColor: 'bg-green-300 ring-8 ring-green-200', freq: 392.00 },
      { id: 3, name: 'High Do (C5)', emoji: '✨', color: 'bg-purple-500 border-purple-600', activeColor: 'bg-purple-300 ring-8 ring-purple-200', freq: 523.25 }
    ]
  },
  {
    id: 'space',
    name: 'Space Synth',
    icon: '🛸',
    pads: [
      { id: 0, name: 'Laser', emoji: '⚡', color: 'bg-cyan-500 border-cyan-600', activeColor: 'bg-cyan-300 ring-8 ring-cyan-200', freq: 350 },
      { id: 1, name: 'Orbit', emoji: '🪐', color: 'bg-indigo-500 border-indigo-600', activeColor: 'bg-indigo-300 ring-8 ring-indigo-200', freq: 490 },
      { id: 2, name: 'Warp', emoji: '🌌', color: 'bg-violet-500 border-violet-600', activeColor: 'bg-violet-300 ring-8 ring-violet-200', freq: 587 },
      { id: 3, name: 'Pulsar', emoji: '🌟', color: 'bg-pink-500 border-pink-600', activeColor: 'bg-pink-300 ring-8 ring-pink-200', freq: 784 }
    ]
  },
  {
    id: 'animals',
    name: 'Animal Choir',
    icon: '🐱',
    pads: [
      { id: 0, name: 'Cat', emoji: '🐱', color: 'bg-orange-500 border-orange-600', activeColor: 'bg-orange-300 ring-8 ring-orange-200', freq: 400 },
      { id: 1, name: 'Dog', emoji: '🐶', color: 'bg-blue-500 border-blue-600', activeColor: 'bg-blue-300 ring-8 ring-blue-200', freq: 300 },
      { id: 2, name: 'Bird', emoji: '🐦', color: 'bg-teal-500 border-teal-600', activeColor: 'bg-teal-300 ring-8 ring-teal-200', freq: 650 },
      { id: 3, name: 'Frog', emoji: '🐸', color: 'bg-lime-500 border-lime-600', activeColor: 'bg-lime-300 ring-8 ring-lime-200', freq: 220 }
    ]
  }
];

const DIFFICULTY_CONFIG = [
  { startLen: 3, targetRounds: 4, speedMs: 700, label: 'Easy (3 Beats)' },
  { startLen: 4, targetRounds: 5, speedMs: 600, label: 'Medium (4 Beats)' },
  { startLen: 5, targetRounds: 5, speedMs: 500, label: 'Hard (5 Beats)' },
  { startLen: 6, targetRounds: 6, speedMs: 450, label: 'Expert (Fast Rhythm)' },
  { startLen: 7, targetRounds: 6, speedMs: 400, label: 'Master (Speed Maestro)' },
];

export default {
  id: 'rhythm-repeat',
  name: 'Rhythm Repeat',

  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  currentLevel: 1,
  currentThemeIdx: 0,
  currentRound: 1,
  isPlaying: false,
  timer: null as Timer | null,
  score: null as Score | null,
  sequence: [] as number[],
  playerStepIdx: 0,
  isListening: false,
  padElements: [] as HTMLElement[],
  currentModal: null as HTMLElement | null,
  audioCtx: null as AudioContext | null,

  init(api: EngineAPI): void {
    this.api = api;
    this.container = api.getContainer();
    this.buildMenu();
  },

  start(): void {
    this.isPlaying = true;
    this.currentRound = 1;
    this.startGame(this.currentLevel, this.currentThemeIdx);
  },

  pause(): void {
    this.timer?.pause();
  },

  resume(): void {
    this.timer?.resume();
  },

  destroy(): void {
    this.isPlaying = false;
    this.isListening = false;
    this.timer?.pause();
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.sequence = [];
    this.padElements = [];
    this.api = null;
    this.container = null;
  },

  getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },

  playTone(freq: number, durationMs: number = 300): void {
    if (this.api?.isMuted()) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio context fallback
    }
  },

  buildMenu(): void {
    if (!this.api || !this.container) return;
    this.container.innerHTML = '';

    const menu = this.api.createElement('div', [
      'flex', 'flex-col', 'items-center', 'justify-center', 'min-h-[70vh]', 'gap-6', 'p-4'
    ]);

    const title = this.api.createElement('h1', [
      'text-4xl', 'sm:text-6xl', 'font-black', 'text-transparent', 'bg-clip-text',
      'bg-gradient-to-r', 'from-amber-500', 'via-rose-500', 'to-purple-600',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🎵 Rhythm Repeat!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Listen to the musical beat and tap the drum pads in the exact same rhythm!';
    menu.appendChild(subtitle);

    // Instrument selector
    const themeSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const themeLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    themeLabel.textContent = 'Choose Instrument';
    themeSection.appendChild(themeLabel);

    const themeRow = this.api.createElement('div', ['flex', 'gap-3', 'flex-wrap', 'justify-center']);
    INSTRUMENT_THEMES.forEach((inst, idx) => {
      const btn = this.api!.createElement('button', [
        'px-4', 'py-2', 'rounded-2xl', 'font-bold', 'text-sm', 'transition-all',
        'border-3', 'cursor-pointer', 'flex', 'items-center', 'gap-1.5'
      ]);
      btn.innerHTML = `<span>${inst.icon}</span> <span>${inst.name}</span>`;

      if (idx === this.currentThemeIdx) {
        btn.classList.add('bg-purple-600', 'text-white', 'border-purple-700', 'scale-105', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-purple-400');
      }

      this.api!.onTap(btn, () => {
        this.currentThemeIdx = idx;
        this.api?.playSound('click');
        this.buildMenu();
      });
      themeRow.appendChild(btn);
    });
    themeSection.appendChild(themeRow);
    menu.appendChild(themeSection);

    // Difficulty selector
    const diffSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const diffLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    diffLabel.textContent = 'Difficulty';
    diffSection.appendChild(diffLabel);

    const diffRow = this.api.createElement('div', ['flex', 'gap-2', 'flex-wrap', 'justify-center']);
    DIFFICULTY_CONFIG.forEach((config, idx) => {
      const level = idx + 1;
      const btn = this.api!.createElement('button', [
        'w-12', 'h-12', 'rounded-xl', 'font-black', 'text-lg', 'transition-all',
        'border-3', 'cursor-pointer', 'flex', 'items-center', 'justify-center'
      ]);
      btn.textContent = String(level);
      btn.title = config.label;

      if (level === this.currentLevel) {
        btn.classList.add('bg-rose-500', 'text-white', 'border-rose-600', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200', 'hover:border-rose-400');
      }

      this.api!.onTap(btn, () => {
        this.currentLevel = level;
        this.api?.playSound('click');
        this.buildMenu();
      });
      diffRow.appendChild(btn);
    });
    diffSection.appendChild(diffRow);
    menu.appendChild(diffSection);

    // Play Button
    const startBtn = this.api.createElement('button', [
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-amber-500', 'via-rose-500', 'to-purple-600',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🎶 Start Jamming!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.currentRound = 1;
      this.startGame(this.currentLevel, this.currentThemeIdx);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(level: number, themeIdx?: number): void {
    if (!this.api || !this.container) return;

    this.currentLevel = level || 1;
    this.currentThemeIdx = (typeof themeIdx === 'number' && INSTRUMENT_THEMES[themeIdx]) ? themeIdx : (this.currentThemeIdx || 0);

    this.container.innerHTML = '';
    this.isListening = false;

    // Header
    const header = this.api.createElement('div', [
      'flex', 'items-center', 'justify-between', 'w-full', 'max-w-lg', 'mx-auto', 'px-4', 'py-3'
    ]);

    const backBtn = this.api.createElement('button', [
      'px-4', 'py-2', 'bg-white/80', 'backdrop-blur', 'rounded-xl',
      'text-gray-600', 'font-bold', 'hover:bg-white', 'transition', 'cursor-pointer'
    ]);
    backBtn.textContent = '← Menu';
    this.api.onTap(backBtn, () => {
      this.api?.playSound('click');
      this.buildMenu();
    });
    header.appendChild(backBtn);

    this.score = new Score(this.api);
    header.appendChild(this.score.element);

    this.timer = new Timer(this.api);
    header.appendChild(this.timer.element);

    this.container.appendChild(header);

    const mainView = this.api.createElement('div', [
      'w-full', 'max-w-lg', 'mx-auto', 'px-4', 'flex', 'flex-col', 'gap-6', 'items-center'
    ]);
    this.container.appendChild(mainView);

    this.startRound(mainView);
  },

  async startRound(mainView: HTMLElement): Promise<void> {
    if (!this.api) return;

    if (!this.isPlaying && this.timer) {
      this.isPlaying = true;
      this.timer.start();
    }

    const config = DIFFICULTY_CONFIG[this.currentLevel - 1] || DIFFICULTY_CONFIG[0];
    const instrument = INSTRUMENT_THEMES[this.currentThemeIdx] || INSTRUMENT_THEMES[0];
    const seqLength = config.startLen + (this.currentRound - 1);

    // Generate random rhythm sequence of pad IDs (0 to 3)
    this.sequence = [];
    for (let i = 0; i < seqLength; i++) {
      this.sequence.push(Math.floor(Math.random() * 4));
    }

    this.playerStepIdx = 0;
    this.isListening = false;
    this.padElements = [];
    mainView.innerHTML = '';

    // Status Banner
    const statusWrapper = this.api.createElement('div', ['flex', 'items-center', 'justify-between', 'w-full', 'px-2']);
    const roundBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-purple-100', 'text-purple-800', 'rounded-full', 'font-bold', 'text-sm'
    ]);
    roundBadge.textContent = `Round ${this.currentRound} of ${config.targetRounds} 🎯`;
    statusWrapper.appendChild(roundBadge);

    const promptBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-amber-100', 'text-amber-800', 'rounded-full', 'font-extrabold', 'text-sm', 'animate-pulse'
    ]);
    promptBadge.textContent = `👂 Listen to the Beat...`;
    statusWrapper.appendChild(promptBadge);
    mainView.appendChild(statusWrapper);

    // 4 Drum / Musical Pads Grid (2x2)
    const padsCard = this.api.createElement('div', [
      'bg-white/95', 'backdrop-blur', 'rounded-3xl', 'p-6', 'shadow-2xl',
      'border-4', 'border-purple-200', 'w-full', 'max-w-[420px]', 'aspect-square',
      'flex', 'flex-col', 'items-center', 'justify-center'
    ]);

    const grid = this.api.createElement('div', ['grid', 'grid-cols-2', 'gap-4', 'w-full', 'h-full']);

    instrument.pads.forEach((pad) => {
      const padBtn = this.api!.createElement('button', [
        'aspect-square', 'rounded-3xl', 'border-4', ...pad.color.split(' '),
        'flex', 'flex-col', 'items-center', 'justify-center', 'gap-1',
        'text-white', 'shadow-lg', 'transition-all', 'duration-150',
        'cursor-pointer', 'select-none', 'active:scale-95'
      ]);

      padBtn.innerHTML = `
        <span class="text-4xl sm:text-5xl pointer-events-none">${pad.emoji}</span>
        <span class="text-xs sm:text-sm font-black tracking-wide pointer-events-none drop-shadow">${pad.name}</span>
      `;

      this.api!.onTap(padBtn, () => {
        this.handlePadTap(pad.id, promptBadge, mainView);
      });

      this.padElements[pad.id] = padBtn;
      grid.appendChild(padBtn);
    });

    padsCard.appendChild(grid);
    mainView.appendChild(padsCard);

    // Playback demonstration beat sequence
    await this.api.delay(600);

    for (let i = 0; i < this.sequence.length; i++) {
      const padId = this.sequence[i];
      await this.highlightPad(padId, config.speedMs * 0.7);
      await this.api.delay(config.speedMs * 0.3);
    }

    // Handover turn to player
    this.isListening = true;
    promptBadge.className = 'px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-sm animate-bounce-slow';
    promptBadge.textContent = `👉 Your Turn! Jam it! (${this.sequence.length} beats)`;
    this.api.playSound('pop');
  },

  async highlightPad(padId: number, durationMs: number): Promise<void> {
    const pad = INSTRUMENT_THEMES[this.currentThemeIdx]?.pads[padId] || INSTRUMENT_THEMES[0].pads[padId];
    const padEl = this.padElements[padId];
    if (!padEl || !this.api) return;

    this.playTone(pad.freq, durationMs);
    padEl.className += ` ${pad.activeColor} scale-105 shadow-2xl`;

    await this.api.pop(padEl);
    await this.api.delay(durationMs);

    padEl.className = `aspect-square rounded-3xl border-4 ${pad.color} flex flex-col items-center justify-center gap-1 text-white shadow-lg transition-all duration-150 cursor-pointer select-none active:scale-95`;
  },

  async handlePadTap(padId: number, promptBadge: HTMLElement, mainView: HTMLElement): Promise<void> {
    if (!this.isListening || !this.api) return;

    const instrument = INSTRUMENT_THEMES[this.currentThemeIdx] || INSTRUMENT_THEMES[0];
    const pad = instrument.pads[padId];
    const config = DIFFICULTY_CONFIG[this.currentLevel - 1] || DIFFICULTY_CONFIG[0];
    const expectedPadId = this.sequence[this.playerStepIdx];

    this.score?.addMove();

    // Play instant tone feedback
    this.playTone(pad.freq, 250);

    if (padId === expectedPadId) {
      // CORRECT BEAT
      this.playerStepIdx++;
      this.score?.addMatch(20);

      const padEl = this.padElements[padId];
      if (padEl) await this.api.pop(padEl);

      if (this.playerStepIdx === this.sequence.length) {
        // ENTIRE RHYTHM COMPLETED!
        this.isListening = false;
        this.api.playSound('match');

        promptBadge.className = 'px-4 py-1.5 bg-emerald-500 text-white rounded-full font-black text-sm';
        promptBadge.textContent = '⭐ Rhythm Matched! Awesome!';

        await this.api.delay(700);

        if (this.currentRound >= config.targetRounds) {
          await this.handleWin();
        } else {
          this.currentRound++;
          this.startRound(mainView);
        }
      }
    } else {
      // MISTAKE
      this.isListening = false;
      this.api.playSound('error');

      const padEl = this.padElements[padId];
      if (padEl) await this.api.shake(padEl);
      if (this.container) await this.api.shake(this.container);

      promptBadge.className = 'px-4 py-1.5 bg-rose-100 text-rose-800 rounded-full font-black text-sm';
      promptBadge.textContent = '❌ Oops! Try listening again...';

      await this.api.delay(900);
      this.startRound(mainView);
    }
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;
    const instrument = INSTRUMENT_THEMES[this.currentThemeIdx] || INSTRUMENT_THEMES[0];

    const bestScore = this.api.load<number>('rhythm_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('rhythm_best', finalScore);
    }

    this.api.playSound('win');
    this.api.showConfetti();

    if (typeof window !== 'undefined' && (window as any).SCORMBridge) {
      try {
        const scorm = (window as any).SCORMBridge.getInstance();
        scorm?.reportCompletion(finalScore || 100);
      } catch (e) {}
    }

    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }

    const overlay = this.api.createElement('div', [
      'fixed', 'inset-0', 'bg-black/40', 'backdrop-blur-sm',
      'flex', 'items-center', 'justify-center', 'z-40', 'p-4'
    ]);
    this.currentModal = overlay;

    const modal = this.api.createElement('div', [
      'bg-white', 'rounded-3xl', 'p-8', 'max-w-sm', 'w-full', 'text-center',
      'shadow-2xl', 'animate-pop'
    ]);

    const icon = this.api.createElement('div', ['text-6xl', 'mb-4', 'animate-bounce-slow']);
    icon.textContent = instrument.icon;
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-purple-600', 'mb-2']);
    title.textContent = 'Rhythm Maestro!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-purple-50 rounded-xl">
        <span class="text-purple-800">⭐ Score</span>
        <span class="font-black text-purple-700">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-purple-50 rounded-xl">
        <span class="text-purple-800">🔄 Total Taps</span>
        <span class="font-black text-purple-700">${moves}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-purple-50 rounded-xl">
        <span class="text-purple-800">⏱️ Time</span>
        <span class="font-black text-purple-700">${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}</span>
      </div>
    `;
    modal.appendChild(stats);

    const btnCol = this.api.createElement('div', ['flex', 'flex-col', 'gap-3']);

    if (this.currentLevel < 5) {
      const nextLevelNum = this.currentLevel + 1;
      const nextBtn = this.api.createElement('button', [
        'w-full', 'py-3.5', 'bg-gradient-to-r', 'from-emerald-500', 'to-teal-500',
        'text-white', 'font-black', 'text-base', 'rounded-2xl', 'shadow-lg',
        'hover:scale-105', 'active:scale-95', 'transition-all', 'cursor-pointer',
        'flex', 'items-center', 'justify-center', 'gap-2'
      ]);
      nextBtn.innerHTML = `<span>🚀 Next Level ${nextLevelNum}</span> <span>→</span>`;
      this.api.onTap(nextBtn, () => {
        this.api?.playSound('click');
        overlay.remove();
        this.currentModal = null;
        this.currentRound = 1;
        this.startGame(nextLevelNum, this.currentThemeIdx);
      });
      btnCol.appendChild(nextBtn);
    }

    const btnRow = this.api.createElement('div', ['flex', 'gap-3', 'justify-center']);

    const replayBtn = this.api.createElement('button', [
      'flex-1', 'py-3', 'bg-purple-600', 'text-white', 'font-bold', 'rounded-2xl',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer'
    ]);
    replayBtn.textContent = '🔄 Replay';
    this.api.onTap(replayBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
      this.currentModal = null;
      this.currentRound = 1;
      this.startGame(this.currentLevel, this.currentThemeIdx);
    });
    btnRow.appendChild(replayBtn);

    const menuBtn = this.api.createElement('button', [
      'flex-1', 'py-3', 'bg-gray-100', 'text-gray-600', 'font-bold', 'rounded-2xl',
      'hover:bg-gray-200', 'transition', 'cursor-pointer'
    ]);
    menuBtn.textContent = '🏠 Menu';
    this.api.onTap(menuBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
      this.currentModal = null;
      this.buildMenu();
    });
    btnRow.appendChild(menuBtn);

    btnCol.appendChild(btnRow);
    modal.appendChild(btnCol);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  },

  serialize() {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      data: {
        level: this.currentLevel,
        themeIdx: this.currentThemeIdx,
        round: this.currentRound
      }
    };
  },

  deserialize(state: any): void {
    if (state.data) {
      this.currentLevel = state.data.level || 1;
      this.currentThemeIdx = state.data.themeIdx || 0;
      this.currentRound = state.data.round || 1;
    }
  }
} as GameModule;
