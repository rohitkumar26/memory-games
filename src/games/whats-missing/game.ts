import type { GameModule, EngineAPI } from '../../core/types';
import { shuffle } from '../../core/utils';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

const THEMES = {
  animals: ['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🦁','🐮','🐷','🐸','🐵','🦄','🦉'],
  snacks: ['🍎','🍌','🍕','🍩','🍦','🍉','🍇','🥕','🍔','🍓','🥑','🌽','🍰','🍪'],
  toys: ['🚀','🛸','🚗','🚂','🧸','🎨','⚽','🎸','👑','🎁','🚲','⛵','🎮','🪁'],
  nature: ['🦋','🐝','🐞','🍄','🌻','🌸','🌲','🌵','🌈','⭐','🍀','🍁','🌺','🌴']
};

const DIFFICULTY_CONFIG = [
  { itemCount: 3, previewSec: 4, optionsCount: 3, label: 'Easy (3 Items)' },
  { itemCount: 4, previewSec: 3.5, optionsCount: 4, label: 'Medium (4 Items)' },
  { itemCount: 5, previewSec: 3, optionsCount: 4, label: 'Hard (5 Items)' },
  { itemCount: 6, previewSec: 2.5, optionsCount: 5, label: 'Expert (6 Items)' },
  { itemCount: 8, previewSec: 2, optionsCount: 6, label: 'Master (8 Items)' },
];

const TOTAL_ROUNDS = 5;

export default {
  id: 'whats-missing',
  name: "What's Missing?",

  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  currentLevel: 1,
  currentTheme: 'animals' as keyof typeof THEMES,
  currentRound: 1,
  isPlaying: false,
  timer: null as Timer | null,
  score: null as Score | null,
  isLocked: false,
  currentModal: null as HTMLElement | null,
  previewTimerId: null as number | null,

  init(api: EngineAPI): void {
    this.api = api;
    this.container = api.getContainer();
    this.buildMenu();
  },

  start(level?: number, round?: number): void {
    this.isPlaying = true;
    if (typeof level === 'number') this.currentLevel = level;
    if (typeof round === 'number') this.currentRound = round;
    this.startGame(this.currentLevel, this.currentTheme);
  },

  pause(): void {
    this.timer?.pause();
  },

  resume(): void {
    this.timer?.resume();
  },

  destroy(): void {
    this.isPlaying = false;
    this.isLocked = false;
    this.timer?.pause();
    if (this.previewTimerId !== null) {
      window.clearTimeout(this.previewTimerId);
      this.previewTimerId = null;
    }
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
      'bg-gradient-to-r', 'from-violet-500', 'via-pink-500', 'to-amber-500',
      'animate-float', 'text-center'
    ]);
    title.textContent = "👁️ What's Missing?";
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = "Remember all the items on the magic tray, then spot which one mysteriously vanished!";
    menu.appendChild(subtitle);

    // Theme selector
    const themeSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const themeLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    themeLabel.textContent = 'Choose Theme';
    themeSection.appendChild(themeLabel);

    const themeRow = this.api.createElement('div', ['flex', 'gap-3', 'flex-wrap', 'justify-center']);
    (Object.keys(THEMES) as Array<keyof typeof THEMES>).forEach(theme => {
      const btn = this.api.createElement('button', [
        'px-4', 'py-2', 'rounded-2xl', 'font-bold', 'text-sm', 'transition-all',
        'border-3', 'cursor-pointer'
      ]);
      btn.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);

      if (theme === this.currentTheme) {
        btn.classList.add('bg-violet-500', 'text-white', 'border-violet-600', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-violet-400');
      }

      this.api.onTap(btn, () => {
        this.currentTheme = theme;
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
      const btn = this.api.createElement('button', [
        'w-12', 'h-12', 'rounded-xl', 'font-black', 'text-lg', 'transition-all',
        'border-3', 'cursor-pointer', 'flex', 'items-center', 'justify-center'
      ]);
      btn.textContent = String(level);
      btn.title = config.label;

      if (level === this.currentLevel) {
        btn.classList.add('bg-pink-500', 'text-white', 'border-pink-600', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200', 'hover:border-pink-400');
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
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-violet-500', 'to-pink-500',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🎮 Start Guessing!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.currentRound = 1;
      this.startGame(this.currentLevel, this.currentTheme);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(level: number, theme?: keyof typeof THEMES): void {
    if (!this.api || !this.container) return;

    this.currentLevel = level || 1;
    this.currentRound = 1;
    const safeTheme = (theme && THEMES[theme as keyof typeof THEMES]) ? (theme as keyof typeof THEMES) : (this.currentTheme && THEMES[this.currentTheme] ? this.currentTheme : 'animals');
    this.currentTheme = safeTheme;

    this.container.innerHTML = '';
    this.isLocked = false;

    // Header
    const header = this.api.createElement('div', [
      'flex', 'items-center', 'justify-between', 'w-full', 'max-w-2xl', 'mx-auto', 'px-4', 'py-3'
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

    // Main Game Viewport
    const mainView = this.api.createElement('div', [
      'w-full', 'max-w-2xl', 'mx-auto', 'px-4', 'flex', 'flex-col', 'gap-4'
    ]);
    mainView.id = 'whats-missing-view';
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
    const themeItems = shuffle([...THEMES[this.currentTheme]]);
    const trayItems = themeItems.slice(0, config.itemCount);
    const missingIdx = Math.floor(Math.random() * trayItems.length);
    const missingEmoji = trayItems[missingIdx];

    mainView.innerHTML = '';

    // Round Indicator & Countdown
    const statusWrapper = this.api.createElement('div', ['flex', 'items-center', 'justify-between', 'px-2']);
    const roundBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-purple-100', 'text-purple-800', 'rounded-full', 'font-bold', 'text-sm'
    ]);
    roundBadge.textContent = `Round ${this.currentRound} of ${TOTAL_ROUNDS} 🎯`;
    statusWrapper.appendChild(roundBadge);

    const countdownBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-amber-100', 'text-amber-800', 'rounded-full', 'font-extrabold', 'text-sm', 'animate-pulse'
    ]);
    countdownBadge.textContent = `👀 Memorize! ⏳ ${config.previewSec}s`;
    statusWrapper.appendChild(countdownBadge);
    mainView.appendChild(statusWrapper);

    // Magic Tray
    const trayCard = this.api.createElement('div', [
      'relative', 'bg-gradient-to-br', 'from-amber-100/90', 'via-pink-50', 'to-purple-100/90',
      'rounded-3xl', 'p-6', 'shadow-xl', 'border-4', 'border-white', 'min-h-[220px]',
      'flex', 'flex-col', 'justify-center', 'overflow-hidden'
    ]);

    const trayGrid = this.api.createElement('div', [
      'grid', 'gap-4', 'justify-center', 'items-center'
    ]);
    const cols = config.itemCount > 4 ? 4 : config.itemCount;
    trayGrid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    const itemElements: HTMLElement[] = [];
    trayItems.forEach((emoji) => {
      const pedestal = this.api.createElement('div', [
        'aspect-square', 'bg-white', 'rounded-2xl', 'shadow-md', 'border-3',
        'border-purple-200', 'flex', 'items-center', 'justify-center',
        'text-4xl', 'sm:text-5xl', 'animate-pop', 'transition-all', 'duration-300'
      ]);
      pedestal.textContent = emoji;
      itemElements.push(pedestal);
      trayGrid.appendChild(pedestal);
    });

    trayCard.appendChild(trayGrid);

    // Magic Curtain Overlay
    const curtain = this.api.createElement('div', [
      'absolute', 'inset-0', 'bg-gradient-to-r', 'from-purple-600', 'to-indigo-600',
      'flex', 'flex-col', 'items-center', 'justify-center', 'text-white', 'font-black',
      'text-2xl', 'transition-all', 'duration-500', 'opacity-0', 'pointer-events-none',
      'z-20', 'rounded-2xl'
    ]);
    curtain.innerHTML = `<span class="text-5xl mb-2 animate-bounce-slow">✨</span><span>Abracadabra...</span>`;
    trayCard.appendChild(curtain);

    mainView.appendChild(trayCard);

    // Bottom Choice Area Placeholder
    const choiceArea = this.api.createElement('div', [
      'flex', 'flex-col', 'items-center', 'gap-3', 'min-h-[140px]', 'justify-center'
    ]);
    const instructionText = this.api.createElement('p', [
      'text-center', 'text-gray-500', 'font-bold', 'text-sm'
    ]);
    instructionText.textContent = `Remember these ${config.itemCount} items!`;
    choiceArea.appendChild(instructionText);
    mainView.appendChild(choiceArea);

    // Play initial sound
    this.api.playSound('flip');

    // Countdown timer animation
    let timeLeft = config.previewSec;
    const intervalId = window.setInterval(() => {
      timeLeft -= 1;
      if (timeLeft > 0) {
        countdownBadge.textContent = `👀 Memorize! ⏳ ${timeLeft}s`;
      } else {
        window.clearInterval(intervalId);
      }
    }, 1000);

    // Wait preview duration, then drop magic curtain
    await this.api.delay(config.previewSec * 1000);
    window.clearInterval(intervalId);

    // Cover with curtain
    curtain.classList.remove('opacity-0', 'pointer-events-none');
    curtain.classList.add('opacity-100');
    this.api.playSound('flip');

    await this.api.delay(600);

    // Remove 1 item behind curtain and replace with ❓
    const missingPedestal = itemElements[missingIdx];
    missingPedestal.className = 'aspect-square bg-amber-200 rounded-2xl shadow-inner border-3 border-dashed border-amber-400 flex items-center justify-center text-4xl sm:text-5xl text-amber-700 animate-pulse font-black';
    missingPedestal.textContent = '❓';

    countdownBadge.className = 'px-4 py-1.5 bg-rose-100 text-rose-800 rounded-full font-extrabold text-sm';
    countdownBadge.textContent = '🤔 Which item vanished?';

    // Lift curtain
    curtain.classList.remove('opacity-100');
    curtain.classList.add('opacity-0', 'pointer-events-none');
    this.api.playSound('pop');

    // Render Choice Buttons
    instructionText.textContent = "Tap the item that disappeared from the tray:";

    const distractorCandidates = themeItems.filter(e => !trayItems.includes(e));
    const distractorCount = config.optionsCount - 1;
    const distractors = shuffle(distractorCandidates).slice(0, distractorCount);
    const options = shuffle([missingEmoji, ...distractors]);

    const optionsGrid = this.api.createElement('div', [
      'flex', 'gap-3', 'flex-wrap', 'justify-center', 'items-center', 'w-full'
    ]);

    options.forEach(optEmoji => {
      const optBtn = this.api.createElement('button', [
        'w-16', 'h-16', 'sm:w-20', 'sm:h-20', 'bg-white', 'rounded-2xl', 'shadow-lg',
        'border-3', 'border-purple-200', 'flex', 'items-center', 'justify-center',
        'text-4xl', 'sm:text-5xl', 'transition-all', 'duration-200', 'cursor-pointer',
        'hover:scale-110', 'active:scale-95', 'hover:border-purple-400'
      ]);
      optBtn.textContent = optEmoji;

      this.api?.onTap(optBtn, async () => {
        if (this.isLocked) return;

        this.score?.addMove();

        if (optEmoji === missingEmoji) {
          // CORRECT!
          this.isLocked = true;
          this.api?.playSound('match');
          this.score?.addMatch(50);

          missingPedestal.className = 'aspect-square bg-emerald-100 rounded-2xl shadow-lg border-4 border-emerald-400 flex items-center justify-center text-4xl sm:text-5xl animate-pop';
          missingPedestal.textContent = missingEmoji;

          optBtn.classList.add('bg-emerald-200', 'border-emerald-500', 'ring-4', 'ring-emerald-300');
          if (this.api) await this.api.pop(optBtn);

          await this.api?.delay(600);

          if (this.currentRound >= TOTAL_ROUNDS) {
            await this.handleWin();
          } else {
            this.currentRound++;
            this.isLocked = false;
            this.startRound(mainView);
          }
        } else {
          // INCORRECT
          this.api?.playSound('error');
          optBtn.classList.add('opacity-40', 'pointer-events-none', 'bg-gray-100');
          if (this.api) await this.api.shake(optBtn);
        }
      });

      optionsGrid.appendChild(optBtn);
    });

    choiceArea.appendChild(optionsGrid);
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;

    const bestScore = this.api.load<number>('missing_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('missing_best', finalScore);
    }

    this.api.playSound('win');
    this.api.showConfetti();

    if (typeof window !== 'undefined' && (window as any).SCORMBridge) {
      try {
        const scorm = (window as any).SCORMBridge.getInstance();
        const cumulativePct = Math.min(100, Math.round(((this.currentLevel || 1) / 5) * 100));
        scorm?.reportCompletion(cumulativePct);
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
    icon.textContent = '🕵️';
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-violet-600', 'mb-2']);
    title.textContent = 'Super Detective!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-purple-50 rounded-xl">
        <span class="text-purple-800">⭐ Score</span>
        <span class="font-black text-purple-700">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-purple-50 rounded-xl">
        <span class="text-purple-800">🔄 Total Tries</span>
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
        this.startGame(nextLevelNum, this.currentTheme);
      });
      btnCol.appendChild(nextBtn);
    }

    const btnRow = this.api.createElement('div', ['flex', 'gap-3', 'justify-center']);

    const replayBtn = this.api.createElement('button', [
      'flex-1', 'py-3', 'bg-violet-600', 'text-white', 'font-bold', 'rounded-2xl',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer'
    ]);
    replayBtn.textContent = '🔄 Replay';
    this.api.onTap(replayBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
      this.currentModal = null;
      this.currentRound = 1;
      this.startGame(this.currentLevel, this.currentTheme);
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
        theme: this.currentTheme,
        round: this.currentRound
      }
    };
  },

  deserialize(state: any): void {
    if (state.data) {
      this.currentLevel = state.data.level || 1;
      this.currentTheme = state.data.theme || 'animals';
      this.currentRound = state.data.round || 1;
    }
  }
} as GameModule;
