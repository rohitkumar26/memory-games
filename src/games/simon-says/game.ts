import type { GameModule, EngineAPI } from '../../core/types';
import { Score } from '../memory-match/components/Score';

interface PadConfig {
  id: number;
  name: string;
  emoji: string;
  sound: 'simon-green' | 'simon-red' | 'simon-yellow' | 'simon-blue';
  baseClass: string;
  activeClass: string;
}

const PADS: PadConfig[] = [
  {
    id: 0,
    name: 'Green',
    emoji: '🌿',
    sound: 'simon-green',
    baseClass: 'bg-emerald-400 border-emerald-500 text-emerald-900',
    activeClass: 'bg-emerald-200 ring-8 ring-emerald-300 scale-105 brightness-125'
  },
  {
    id: 1,
    name: 'Red',
    emoji: '🍎',
    sound: 'simon-red',
    baseClass: 'bg-rose-500 border-rose-600 text-rose-950',
    activeClass: 'bg-rose-200 ring-8 ring-rose-300 scale-105 brightness-125'
  },
  {
    id: 2,
    name: 'Yellow',
    emoji: '⭐',
    sound: 'simon-yellow',
    baseClass: 'bg-amber-400 border-amber-500 text-amber-950',
    activeClass: 'bg-amber-100 ring-8 ring-amber-300 scale-105 brightness-125'
  },
  {
    id: 3,
    name: 'Blue',
    emoji: '🌊',
    sound: 'simon-blue',
    baseClass: 'bg-sky-400 border-sky-500 text-sky-950',
    activeClass: 'bg-sky-200 ring-8 ring-sky-300 scale-105 brightness-125'
  }
];

const DIFFICULTY_CONFIG = [
  { target: 5, speed: 600, label: 'Easy (5 Steps)' },
  { target: 7, speed: 500, label: 'Medium (7 Steps)' },
  { target: 10, speed: 420, label: 'Hard (10 Steps)' },
  { target: 12, speed: 360, label: 'Expert (12 Steps)' },
  { target: 15, speed: 300, label: 'Master (15 Steps)' },
];

export default {
  id: 'simon-says',
  name: 'Simon Says',

  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  sequence: [] as number[],
  userIndex: 0,
  isComputerTurn: false,
  isPlaying: false,
  currentLevel: 1,
  score: null as Score | null,
  padElements: [] as HTMLElement[],
  statusBadge: null as HTMLElement | null,
  currentModal: null as HTMLElement | null,

  init(api: EngineAPI): void {
    this.api = api;
    this.container = api.getContainer();
    this.buildMenu();
  },

  start(level?: number): void {
    this.isPlaying = true;
    if (typeof level === 'number') this.currentLevel = level;
    this.startGame(this.currentLevel);
  },

  pause(): void {
    this.isComputerTurn = true;
  },

  resume(): void {
    this.isComputerTurn = false;
  },

  destroy(): void {
    this.isPlaying = false;
    this.isComputerTurn = false;
    this.sequence = [];
    this.padElements = [];
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
    this.api = null;
    this.container = null;
  },

  buildMenu(): void {
    if (!this.api || !this.container) return;
    this.container.innerHTML = '';

    const menu = this.api.createElement('div', [
      'flex', 'flex-col', 'items-center', 'justify-center', 'min-h-[70vh]', 'gap-6', 'p-4'
    ]);

    const title = this.api.createElement('h1', [
      'text-4xl', 'sm:text-6xl', 'font-black', 'text-transparent', 'bg-clip-text',
      'bg-gradient-to-r', 'from-emerald-400', 'via-amber-400', 'to-sky-500',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🚦 Simon Says!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Watch the glowing lights, remember the melody, and tap in the same order!';
    menu.appendChild(subtitle);

    // Difficulty selector
    const diffSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const label = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    label.textContent = 'Difficulty Level';
    diffSection.appendChild(label);

    const row = this.api.createElement('div', ['flex', 'gap-2', 'flex-wrap', 'justify-center']);
    DIFFICULTY_CONFIG.forEach((config, idx) => {
      const level = idx + 1;
      const btn = this.api.createElement('button', [
        'w-12', 'h-12', 'rounded-xl', 'font-black', 'text-lg', 'transition-all',
        'border-3', 'cursor-pointer', 'flex', 'items-center', 'justify-center'
      ]);
      btn.textContent = String(level);
      btn.title = config.label;

      if (level === this.currentLevel) {
        btn.classList.add('bg-emerald-500', 'text-white', 'border-emerald-600', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200', 'hover:border-emerald-400');
      }

      this.api.onTap(btn, () => {
        this.currentLevel = level;
        this.api?.playSound('click');
        this.buildMenu();
      });
      row.appendChild(btn);
    });
    diffSection.appendChild(row);
    menu.appendChild(diffSection);

    // Play Button
    const startBtn = this.api.createElement('button', [
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-emerald-400', 'to-teal-500',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🎮 Start Simon!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.startGame(this.currentLevel);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(level: number, startRound: number = 1): void {
    if (!this.api || !this.container) return;

    this.currentLevel = level;
    const config = DIFFICULTY_CONFIG[level - 1] || DIFFICULTY_CONFIG[0];
    this.container.innerHTML = '';
    this.sequence = [];
    this.userIndex = 0;
    this.isComputerTurn = false;
    this.padElements = [];

    // Pre-populate sequence if resuming a later round
    if (startRound > 1) {
      for (let i = 0; i < startRound - 1; i++) {
        this.sequence.push(Math.floor(Math.random() * 4));
      }
    }

    // Header
    const header = this.api.createElement('div', [
      'flex', 'items-center', 'justify-between', 'w-full', 'max-w-md', 'mx-auto', 'px-4', 'py-3'
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
    if (startRound > 1) {
      this.score.add((startRound - 1) * 100);
    }
    header.appendChild(this.score.element);
    this.container.appendChild(header);

    // Status Banner
    const statusWrapper = this.api.createElement('div', ['text-center', 'my-3']);
    this.statusBadge = this.api.createElement('div', [
      'inline-block', 'px-6', 'py-2', 'rounded-full', 'font-bold', 'text-base',
      'bg-purple-100', 'text-purple-800', 'shadow-sm', 'transition-all'
    ]);
    this.statusBadge.textContent = `Round ${startRound} of ${config.target} 🎯`;
    statusWrapper.appendChild(this.statusBadge);
    this.container.appendChild(statusWrapper);

    // Simon Pads Board (2x2 circle layout)
    const board = this.api.createElement('div', [
      'grid', 'grid-cols-2', 'gap-4', 'w-72', 'h-72', 'sm:w-80', 'sm:h-80',
      'mx-auto', 'p-4', 'bg-gray-900/10', 'backdrop-blur', 'rounded-full',
      'shadow-2xl', 'border-4', 'border-white/60', 'items-center', 'justify-center'
    ]);

    PADS.forEach((pad, idx) => {
      const padEl = this.api.createElement('button', [
        'w-full', 'h-full', 'rounded-3xl', 'border-4', 'shadow-md',
        'flex', 'flex-col', 'items-center', 'justify-center',
        'text-3xl', 'transition-all', 'duration-150', 'cursor-pointer',
        'select-none', 'active:scale-95', ...pad.baseClass.split(' ')
      ]);
      padEl.innerHTML = `<span class="text-3xl">${pad.emoji}</span>`;
      padEl.setAttribute('aria-label', `${pad.name} button`);

      this.api.onTap(padEl, () => {
        if (this.isComputerTurn) return;
        this.handleUserTap(idx);
      });

      this.padElements.push(padEl);
      board.appendChild(padEl);
    });

    this.container.appendChild(board);

    // Next round trigger
    this.api.delay(600).then(() => {
      this.nextRound();
    });
  },

  async flashPad(padId: number, durationMs = 300): Promise<void> {
    if (!this.api || !this.padElements[padId]) return;
    const pad = PADS[padId];
    const el = this.padElements[padId];

    this.api.playSound(pad.sound);
    el.classList.add(...pad.activeClass.split(' '));
    await this.api.pop(el);
    await this.api.delay(durationMs);
    el.classList.remove(...pad.activeClass.split(' '));
  },

  async nextRound(): Promise<void> {
    if (!this.api) return;

    this.isComputerTurn = true;
    this.userIndex = 0;
    const config = DIFFICULTY_CONFIG[this.currentLevel - 1] || DIFFICULTY_CONFIG[0];

    // Add random step (0-3)
    const nextPad = Math.floor(Math.random() * 4);
    this.sequence.push(nextPad);

    if (this.statusBadge) {
      this.statusBadge.className = 'inline-block px-6 py-2 rounded-full font-bold text-base bg-amber-100 text-amber-800 shadow-sm transition-all animate-pop';
      this.statusBadge.textContent = `👀 Watch Sequence (Round ${this.sequence.length}/${config.target})`;
    }

    await this.api.delay(600);

    for (let i = 0; i < this.sequence.length; i++) {
      const padId = this.sequence[i];
      await this.flashPad(padId, config.speed * 0.7);
      await this.api.delay(config.speed * 0.3);
    }

    this.isComputerTurn = false;
    if (this.statusBadge) {
      this.statusBadge.className = 'inline-block px-6 py-2 rounded-full font-bold text-base bg-emerald-100 text-emerald-800 shadow-sm transition-all animate-pop';
      this.statusBadge.textContent = `👉 Your turn! Repeat the ${this.sequence.length} steps`;
    }
  },

  async handleUserTap(padId: number): Promise<void> {
    if (!this.api || this.isComputerTurn) return;

    await this.flashPad(padId, 200);

    const expected = this.sequence[this.userIndex];
    if (padId === expected) {
      // Correct tap!
      this.score?.addMove();
      this.userIndex++;

      if (this.userIndex === this.sequence.length) {
        // Completed this round
        this.isComputerTurn = true;
        this.score?.addMatch(50);
        this.api.playSound('match');

        const config = DIFFICULTY_CONFIG[this.currentLevel - 1] || DIFFICULTY_CONFIG[0];
        if (this.sequence.length >= config.target) {
          // Player won the whole game!
          await this.api.delay(400);
          await this.handleWin();
        } else {
          // Next round
          if (this.statusBadge) {
            this.statusBadge.className = 'inline-block px-6 py-2 rounded-full font-bold text-base bg-emerald-200 text-emerald-900 shadow-sm transition-all';
            this.statusBadge.textContent = `⭐ Awesome! Next step coming...`;
          }
          await this.api.delay(900);
          await this.nextRound();
        }
      }
    } else {
      // Wrong tap!
      this.isComputerTurn = true;
      this.api.playSound('error');
      if (this.container) {
        await this.api.shake(this.container);
      }
      await this.handleGameOver();
    }
  },

  async handleWin(): Promise<void> {
    if (!this.api) return;

    const finalScore = this.score?.getScore() || 0;
    const bestScore = this.api.load<number>('simon_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('simon_best', finalScore);
    }

    this.api.playSound('win');
    this.api.showConfetti();

    if (typeof window !== 'undefined' && (window as any).SCORMBridge) {
      try {
        const scorm = (window as any).SCORMBridge.getInstance();
        scorm?.reportCompletion(finalScore || 100);
      } catch (e) {}
    }

    this.showModal({
      icon: '🏆',
      title: 'Memory Master!',
      subtitle: `You completed all ${this.sequence.length} rounds of Simon Says!`,
      score: finalScore,
      onReplay: () => this.startGame(this.currentLevel),
      onMenu: () => this.buildMenu()
    });
  },

  async handleGameOver(): Promise<void> {
    if (!this.api) return;

    const finalScore = this.score?.getScore() || 0;
    const roundsCompleted = Math.max(0, this.sequence.length - 1);

    this.showModal({
      icon: '💡',
      title: 'Nice Try!',
      subtitle: `You made it through ${roundsCompleted} rounds! Practice makes perfect.`,
      score: finalScore,
      onReplay: () => this.startGame(this.currentLevel),
      onMenu: () => this.buildMenu()
    });
  },

  showModal(opts: {
    icon: string;
    title: string;
    subtitle: string;
    score: number;
    onReplay: () => void;
    onMenu: () => void;
  }): void {
    if (!this.api) return;

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

    const iconEl = this.api.createElement('div', ['text-6xl', 'mb-4', 'animate-bounce-slow']);
    iconEl.textContent = opts.icon;
    modal.appendChild(iconEl);

    const titleEl = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-gray-800', 'mb-2']);
    titleEl.textContent = opts.title;
    modal.appendChild(titleEl);

    const subEl = this.api.createElement('p', ['text-gray-500', 'text-sm', 'mb-6']);
    subEl.textContent = opts.subtitle;
    modal.appendChild(subEl);

    const scoreCard = this.api.createElement('div', [
      'flex', 'justify-between', 'px-4', 'py-3', 'bg-amber-50', 'rounded-2xl', 'mb-6', 'border', 'border-amber-100'
    ]);
    scoreCard.innerHTML = `
      <span class="text-amber-800 font-bold">⭐ Final Score</span>
      <span class="font-black text-amber-600 text-lg">${opts.score}</span>
    `;
    modal.appendChild(scoreCard);

    const btnCol = this.api.createElement('div', ['flex', 'flex-col', 'gap-3']);

    if (opts.title === 'Memory Master!' && this.currentLevel < 5) {
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
        this.startGame(nextLevelNum);
      });
      btnCol.appendChild(nextBtn);
    }

    const btnRow = this.api.createElement('div', ['flex', 'gap-3', 'justify-center']);

    const replayBtn = this.api.createElement('button', [
      'flex-1', 'py-3', 'bg-emerald-500', 'text-white', 'font-bold', 'rounded-2xl',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer'
    ]);
    replayBtn.textContent = '🔄 Replay';
    this.api.onTap(replayBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
      this.currentModal = null;
      opts.onReplay();
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
      opts.onMenu();
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
        round: Math.max(1, this.sequence?.length || 1),
        score: this.score?.getScore() || 0
      }
    };
  },

  deserialize(state: any): void {
    if (state.data) {
      this.currentLevel = state.data.level || 1;
      const targetRound = state.data.round || 1;
      if (targetRound > 1) {
        this.startGame(this.currentLevel, targetRound);
      }
    }
  }
} as GameModule;
