import type { GameModule, EngineAPI } from '../../core/types';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

const DIFFICULTY_CONFIG = [
  { digits: 3, speedMs: 900, label: 'Easy (3 Digits)' },
  { digits: 4, speedMs: 800, label: 'Medium (4 Digits)' },
  { digits: 5, speedMs: 700, label: 'Hard (5 Digits)' },
  { digits: 6, speedMs: 600, label: 'Expert (6 Digits)' },
  { digits: 7, speedMs: 500, label: 'Master (7 Digits)' },
];

const TOTAL_ROUNDS = 5;

export default {
  id: 'number-sequence',
  name: 'Number Sequence',

  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  currentLevel: 1,
  currentMode: 'forward' as 'forward' | 'reverse',
  currentRound: 1,
  isPlaying: false,
  timer: null as Timer | null,
  score: null as Score | null,
  sequence: [] as number[],
  expectedSequence: [] as number[],
  userInput: [] as number[],
  isComputerTurn: false,
  currentModal: null as HTMLElement | null,

  init(api: EngineAPI): void {
    this.api = api;
    this.container = api.getContainer();
    this.buildMenu();
  },

  start(): void {
    this.isPlaying = true;
    this.currentRound = 1;
    this.startGame(this.currentLevel, this.currentMode);
  },

  pause(): void {
    this.timer?.pause();
  },

  resume(): void {
    this.timer?.resume();
  },

  destroy(): void {
    this.isPlaying = false;
    this.isComputerTurn = false;
    this.timer?.pause();
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
    this.sequence = [];
    this.userInput = [];
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
      'bg-gradient-to-r', 'from-blue-500', 'via-indigo-500', 'to-cyan-500',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🔢 Number Sequence!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Watch numbers flash on screen, remember the digits, and type them back!';
    menu.appendChild(subtitle);

    // Mode Selector
    const modeSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const modeLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    modeLabel.textContent = 'Game Mode';
    modeSection.appendChild(modeLabel);

    const modeRow = this.api.createElement('div', ['flex', 'gap-3', 'justify-center']);

    const forwardBtn = this.api.createElement('button', [
      'px-5', 'py-2.5', 'rounded-2xl', 'font-bold', 'text-sm', 'transition-all',
      'border-3', 'cursor-pointer'
    ]);
    forwardBtn.textContent = '➡️ Forward Order';
    if (this.currentMode === 'forward') {
      forwardBtn.classList.add('bg-blue-500', 'text-white', 'border-blue-600', 'scale-105', 'shadow-lg');
    } else {
      forwardBtn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-blue-400');
    }
    this.api.onTap(forwardBtn, () => {
      this.currentMode = 'forward';
      this.api?.playSound('click');
      this.buildMenu();
    });
    modeRow.appendChild(forwardBtn);

    const reverseBtn = this.api.createElement('button', [
      'px-5', 'py-2.5', 'rounded-2xl', 'font-bold', 'text-sm', 'transition-all',
      'border-3', 'cursor-pointer'
    ]);
    reverseBtn.textContent = '⬅️ Reverse Order (Brain Buster)';
    if (this.currentMode === 'reverse') {
      reverseBtn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-700', 'scale-105', 'shadow-lg');
    } else {
      reverseBtn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-indigo-400');
    }
    this.api.onTap(reverseBtn, () => {
      this.currentMode = 'reverse';
      this.api?.playSound('click');
      this.buildMenu();
    });
    modeRow.appendChild(reverseBtn);

    modeSection.appendChild(modeRow);
    menu.appendChild(modeSection);

    // Difficulty selector
    const diffSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const diffLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    diffLabel.textContent = 'Difficulty (Digit Count)';
    diffSection.appendChild(diffLabel);

    const diffRow = this.api.createElement('div', ['flex', 'gap-2', 'flex-wrap', 'justify-center']);
    DIFFICULTY_CONFIG.forEach((config, idx) => {
      const level = idx + 1;
      const btn = this.api.createElement('button', [
        'w-12', 'h-12', 'rounded-xl', 'font-black', 'text-lg', 'transition-all',
        'border-3', 'cursor-pointer', 'flex', 'items-center', 'justify-center'
      ]);
      btn.textContent = String(level);
      btn.title = config.label;

      if (level === this.currentLevel) {
        btn.classList.add('bg-blue-500', 'text-white', 'border-blue-600', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200', 'hover:border-blue-400');
      }

      this.api.onTap(btn, () => {
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
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-blue-500', 'to-indigo-600',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🎮 Start Digits!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.currentRound = 1;
      this.startGame(this.currentLevel, this.currentMode);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(level: number, mode: 'forward' | 'reverse'): void {
    if (!this.api || !this.container) return;

    this.container.innerHTML = '';
    this.isComputerTurn = false;

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
    if (this.currentRound > 1) {
      this.score.add((this.currentRound - 1) * 100);
    }
    header.appendChild(this.score.element);

    this.timer = new Timer(this.api);
    header.appendChild(this.timer.element);

    this.container.appendChild(header);

    const mainView = this.api.createElement('div', [
      'w-full', 'max-w-md', 'mx-auto', 'px-4', 'flex', 'flex-col', 'gap-4'
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
    this.isComputerTurn = true;
    this.userInput = [];
    this.sequence = [];

    // Generate random digits (1-9)
    for (let i = 0; i < config.digits; i++) {
      this.sequence.push(Math.floor(Math.random() * 9) + 1);
    }

    this.expectedSequence = this.currentMode === 'reverse'
      ? [...this.sequence].reverse()
      : [...this.sequence];

    mainView.innerHTML = '';

    // Status Banner
    const statusWrapper = this.api.createElement('div', ['flex', 'items-center', 'justify-between', 'px-2']);
    const roundBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-blue-100', 'text-blue-800', 'rounded-full', 'font-bold', 'text-sm'
    ]);
    roundBadge.textContent = `Round ${this.currentRound} of ${TOTAL_ROUNDS} 🎯`;
    statusWrapper.appendChild(roundBadge);

    const modeBadge = this.api.createElement('span', [
      'px-3', 'py-1', 'bg-indigo-100', 'text-indigo-800', 'rounded-full', 'font-black', 'text-xs'
    ]);
    modeBadge.textContent = this.currentMode === 'reverse' ? '⬅️ REVERSE ORDER' : '➡️ FORWARD ORDER';
    statusWrapper.appendChild(modeBadge);
    mainView.appendChild(statusWrapper);

    // Number Flash Display Screen
    const screenCard = this.api.createElement('div', [
      'bg-gradient-to-br', 'from-blue-600', 'to-indigo-700', 'rounded-3xl', 'p-6',
      'shadow-2xl', 'border-4', 'border-white', 'min-h-[160px]', 'flex',
      'flex-col', 'items-center', 'justify-center', 'text-center', 'relative'
    ]);

    const bigNumberEl = this.api.createElement('div', [
      'text-7xl', 'sm:text-8xl', 'font-black', 'text-white', 'tracking-wider', 'transition-all', 'duration-200'
    ]);
    bigNumberEl.textContent = '👀 Ready...';
    screenCard.appendChild(bigNumberEl);

    // User Typed Digits Display Tray
    const userSlotsContainer = this.api.createElement('div', [
      'flex', 'gap-2', 'mt-3', 'justify-center'
    ]);
    const slotElements: HTMLElement[] = [];

    for (let s = 0; s < config.digits; s++) {
      const slot = this.api.createElement('div', [
        'w-8', 'h-8', 'rounded-lg', 'bg-white/20', 'border-2', 'border-white/40',
        'flex', 'items-center', 'justify-center', 'text-white', 'font-black', 'text-base'
      ]);
      slot.textContent = '_';
      slotElements.push(slot);
      userSlotsContainer.appendChild(slot);
    }
    screenCard.appendChild(userSlotsContainer);
    mainView.appendChild(screenCard);

    // Keypad Container
    const keypad = this.api.createElement('div', [
      'grid', 'grid-cols-3', 'gap-3', 'p-3', 'bg-white/80', 'backdrop-blur',
      'rounded-3xl', 'shadow-xl', 'border-4', 'border-white', 'opacity-40', 'pointer-events-none'
    ]);

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    digits.forEach(d => {
      const keyBtn = this.api!.createElement('button', [
        'h-16', 'bg-gradient-to-b', 'from-gray-50', 'to-gray-100', 'rounded-2xl',
        'shadow-md', 'border-3', 'border-gray-200', 'text-3xl', 'font-black',
        'text-gray-700', 'flex', 'items-center', 'justify-center', 'transition-all',
        'duration-150', 'hover:bg-blue-50', 'active:scale-90', 'cursor-pointer'
      ]);
      keyBtn.textContent = String(d);

      this.api!.onTap(keyBtn, () => {
        this.handleKeypadInput(d, slotElements, bigNumberEl, mainView);
      });

      keypad.appendChild(keyBtn);
    });

    mainView.appendChild(keypad);

    // Flash numbers sequence
    await this.api.delay(1000);

    for (let i = 0; i < this.sequence.length; i++) {
      const num = this.sequence[i];
      bigNumberEl.textContent = String(num);
      this.api.playSound('click');
      await this.api.pop(bigNumberEl);
      await this.api.delay(config.speedMs * 0.7);

      bigNumberEl.textContent = ' ';
      await this.api.delay(config.speedMs * 0.3);
    }

    // Hand over to player
    this.isComputerTurn = false;
    bigNumberEl.textContent = this.currentMode === 'reverse' ? 'Type in REVERSE!' : 'Type the numbers!';
    bigNumberEl.className = 'text-2xl sm:text-3xl font-black text-amber-300 tracking-wide animate-pulse';

    keypad.classList.remove('opacity-40', 'pointer-events-none');
  },

  async handleKeypadInput(
    digit: number,
    slots: HTMLElement[],
    promptEl: HTMLElement,
    mainView: HTMLElement
  ): Promise<void> {
    if (!this.api || this.isComputerTurn) return;

    this.api.playSound('click');
    const inputIdx = this.userInput.length;
    this.userInput.push(digit);

    // Update slot
    if (slots[inputIdx]) {
      slots[inputIdx].textContent = String(digit);
      slots[inputIdx].className = 'w-8 h-8 rounded-lg bg-white text-blue-900 font-black text-base flex items-center justify-center animate-pop';
    }

    // Check partial match
    if (digit !== this.expectedSequence[inputIdx]) {
      // WRONG DIGIT
      this.isComputerTurn = true;
      this.api.playSound('error');
      if (this.container) await this.api.shake(this.container);

      promptEl.textContent = '❌ Oops! Try again';
      promptEl.className = 'text-2xl font-black text-rose-300';

      await this.api.delay(1000);
      this.startRound(mainView);
      return;
    }

    // Check if whole sequence complete
    if (this.userInput.length === this.expectedSequence.length) {
      // CORRECT SEQUENCE!
      this.isComputerTurn = true;
      this.api.playSound('match');
      this.score?.addMove();
      this.score?.addMatch(50);

      promptEl.textContent = '⭐ Perfect Recall!';
      promptEl.className = 'text-2xl font-black text-emerald-300 animate-pop';

      await this.api.delay(800);

      if (this.currentRound >= TOTAL_ROUNDS) {
        await this.handleWin();
      } else {
        this.currentRound++;
        this.startRound(mainView);
      }
    }
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;

    const bestScore = this.api.load<number>('numbers_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('numbers_best', finalScore);
    }

    this.api.playSound('win');
    this.api.showConfetti();

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
    icon.textContent = '🧠';
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-blue-600', 'mb-2']);
    title.textContent = 'Memory Champion!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-blue-50 rounded-xl">
        <span class="text-blue-800">⭐ Score</span>
        <span class="font-black text-blue-700">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-blue-50 rounded-xl">
        <span class="text-blue-800">🎯 Correct Rounds</span>
        <span class="font-black text-blue-700">${TOTAL_ROUNDS}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-blue-50 rounded-xl">
        <span class="text-blue-800">⏱️ Time</span>
        <span class="font-black text-blue-700">${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}</span>
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
        this.startGame(nextLevelNum, this.currentMode);
      });
      btnCol.appendChild(nextBtn);
    }

    const btnRow = this.api.createElement('div', ['flex', 'gap-3', 'justify-center']);

    const replayBtn = this.api.createElement('button', [
      'flex-1', 'py-3', 'bg-blue-600', 'text-white', 'font-bold', 'rounded-2xl',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer'
    ]);
    replayBtn.textContent = '🔄 Replay';
    this.api.onTap(replayBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
      this.currentModal = null;
      this.currentRound = 1;
      this.startGame(this.currentLevel, this.currentMode);
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
        mode: this.currentMode,
        round: this.currentRound
      }
    };
  },

  deserialize(state: any): void {
    if (state.data) {
      this.currentLevel = state.data.level || 1;
      this.currentMode = state.data.mode || 'forward';
      this.currentRound = state.data.round || 1;
    }
  }
} as GameModule;
