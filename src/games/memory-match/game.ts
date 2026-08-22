import type { GameModule, EngineAPI } from '../../core/types';
import { shuffle, COLOR_PALETTES } from '../../core/utils';
import { Card } from './components/Card';
import { Timer } from './components/Timer';
import { Score } from './components/Score';

// Kid-friendly emojis organized by theme
const THEMES = {
  animals: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮'],
  fruits: ['🍎','🍌','🍇','🍓','🍉','🍒','🍑','🍍','🥝','🍋','🫐','🍊'],
  space: ['🚀','🛸','🌟','🌈','⚡','🔥','🌍','🌙','☀️','☄️','🪐','👽'],
  mixed: ['🦄','🐝','🦋','🐞','🐙','🦕','🦖','🐳','🦩','🦜','🦚','🦉']
};

const DIFFICULTY_CONFIG = [
  { rows: 2, cols: 3, label: 'Easy' },      // 6 cards, 3 pairs
  { rows: 3, cols: 4, label: 'Medium' },   // 12 cards, 6 pairs
  { rows: 4, cols: 4, label: 'Hard' },     // 16 cards, 8 pairs
  { rows: 4, cols: 5, label: 'Expert' },   // 20 cards, 10 pairs
  { rows: 5, cols: 6, label: 'Master' },   // 30 cards, 15 pairs
];

export default {
  id: 'memory-match',
  name: 'Memory Match',

  // ── Game State ──
  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  cards: [] as Card[],
  flippedCards: [] as Card[],
  timer: null as Timer | null,
  score: null as Score | null,
  isLocked: false,
  isPlaying: false,
  currentLevel: 1,
  currentTheme: 'animals' as keyof typeof THEMES,

  // ── Lifecycle ──

  init(api: EngineAPI): void {
    this.api = api;
    this.container = api.getContainer();
    this.buildMenu();
  },

  start(): void {
    this.isPlaying = true;
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
    this.timer?.pause();
    this.cards = [];
    this.flippedCards = [];
    this.isLocked = false;
    this.api = null;
    this.container = null;
  },

  // ── Menu Screen ──

  buildMenu(): void {
    if (!this.api || !this.container) return;
    this.container.innerHTML = '';

    const menu = this.api.createElement('div', [
      'flex', 'flex-col', 'items-center', 'justify-center', 'min-h-[70vh]', 'gap-6', 'p-4'
    ]);

    // Title
    const title = this.api.createElement('h1', [
      'text-4xl', 'sm:text-6xl', 'font-black', 'text-transparent', 'bg-clip-text',
      'bg-gradient-to-r', 'from-kid-purple', 'via-kid-pink', 'to-kid-orange',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🧠 Memory Match!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Flip the cards and find all the matching pairs!';
    menu.appendChild(subtitle);

    // Theme selector
    const themeSection = this.buildThemeSelector();
    menu.appendChild(themeSection);

    // Difficulty selector
    const diffSection = this.buildDifficultySelector();
    menu.appendChild(diffSection);

    // Start button
    const startBtn = this.api.createElement('button', [
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-kid-green', 'to-kid-teal',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🎮 Play!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.startGame(this.currentLevel, this.currentTheme);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  buildThemeSelector(): HTMLElement {
    if (!this.api) return document.createElement('div');

    const wrapper = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const label = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    label.textContent = 'Choose Theme';
    wrapper.appendChild(label);

    const row = this.api.createElement('div', ['flex', 'gap-3', 'flex-wrap', 'justify-center']);

    (Object.keys(THEMES) as Array<keyof typeof THEMES>).forEach(theme => {
      const btn = this.api.createElement('button', [
        'px-4', 'py-2', 'rounded-2xl', 'font-bold', 'text-sm', 'transition-all',
        'border-3', 'cursor-pointer'
      ]);
      btn.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);

      if (theme === this.currentTheme) {
        btn.classList.add('bg-kid-blue', 'text-white', 'border-kid-blue', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-kid-blue');
      }

      this.api.onTap(btn, () => {
        this.currentTheme = theme;
        this.api?.playSound('click');
        // Rebuild menu to show selection
        this.buildMenu();
      });
      row.appendChild(btn);
    });

    wrapper.appendChild(row);
    return wrapper;
  },

  buildDifficultySelector(): HTMLElement {
    if (!this.api) return document.createElement('div');

    const wrapper = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const label = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    label.textContent = 'Difficulty';
    wrapper.appendChild(label);

    const row = this.api.createElement('div', ['flex', 'gap-2', 'flex-wrap', 'justify-center']);

    DIFFICULTY_CONFIG.forEach((config, idx) => {
      const level = idx + 1;
      const btn = this.api.createElement('button', [
        'w-12', 'h-12', 'rounded-xl', 'font-black', 'text-lg', 'transition-all',
        'border-3', 'cursor-pointer', 'flex', 'items-center', 'justify-center'
      ]);
      btn.textContent = String(level);
      btn.title = `${config.label} (${config.rows}x${config.cols})`;

      if (level === this.currentLevel) {
        btn.classList.add('bg-kid-orange', 'text-white', 'border-kid-orange', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200', 'hover:border-kid-orange');
      }

      this.api.onTap(btn, () => {
        this.currentLevel = level;
        this.api?.playSound('click');
        this.buildMenu();
      });
      row.appendChild(btn);
    });

    wrapper.appendChild(row);
    return wrapper;
  },

  // ── Game Logic ──

  startGame(level: number, theme?: keyof typeof THEMES): void {
    if (!this.api || !this.container) return;

    this.currentLevel = level || 1;
    const safeTheme = (theme && THEMES[theme as keyof typeof THEMES]) ? (theme as keyof typeof THEMES) : (this.currentTheme && THEMES[this.currentTheme] ? this.currentTheme : 'animals');
    this.currentTheme = safeTheme;

    const config = DIFFICULTY_CONFIG[this.currentLevel - 1] || DIFFICULTY_CONFIG[0];
    const pairCount = (config.rows * config.cols) / 2;

    this.container.innerHTML = '';
    this.cards = [];
    this.flippedCards = [];
    this.isLocked = false;

    // Game header
    const header = this.api.createElement('div', [
      'flex', 'items-center', 'justify-between', 'w-full', 'max-w-2xl', 'mx-auto', 'px-4', 'py-3'
    ]);

    // Back button
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

    // Score & Timer
    this.score = new Score(this.api);
    header.appendChild(this.score.element);

    this.timer = new Timer(this.api);
    header.appendChild(this.timer.element);

    this.container.appendChild(header);

    // Level indicator
    const levelBadge = this.api.createElement('div', [
      'text-center', 'mb-2'
    ]);
    const levelText = this.api.createElement('span', [
      'inline-block', 'px-4', 'py-1', 'bg-kid-purple/20', 'rounded-full',
      'text-kid-purple', 'font-bold', 'text-sm'
    ]);
    levelText.textContent = `Level ${this.currentLevel}: ${config.label} (${config.rows}×${config.cols})`;
    levelBadge.appendChild(levelText);
    this.container.appendChild(levelBadge);

    // Board
    const board = this.api.createBoard(config.rows, config.cols);
    board.classList.add('max-w-lg');

    // Generate cards
    const emojis = shuffle([...THEMES[safeTheme]]).slice(0, pairCount);
    const cardData = shuffle([...emojis, ...emojis]);
    const colors = shuffle([...COLOR_PALETTES.cards]);

    cardData.forEach((emoji, idx) => {
      const card = new Card({
        id: idx,
        emoji,
        colorClass: colors[idx % colors.length]
      }, this.api);

      this.api.onTap(card.element, () => {
        if (this.isLocked || card.isRevealed() || card.isDone()) return;
        this.handleCardClick(card);
      });

      this.cards.push(card);
      board.appendChild(card.element);
    });

    this.container.appendChild(board);

    // Start timer on first click (see handleCardClick)
  },

  async handleCardClick(card: Card): Promise<void> {
    if (!this.api || this.isLocked) return;

    // Start timer on first card flip
    if (!this.isPlaying && this.timer) {
      this.isPlaying = true;
      this.timer.start();
    }

    this.api.playSound('flip');
    await card.flip();
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.isLocked = true;
      this.score?.addMove();

      const [first, second] = this.flippedCards;

      if (first.getEmoji() === second.getEmoji()) {
        // Match!
        await this.api.delay(300);
        this.api.playSound('match');
        await first.markMatched();
        await second.markMatched();

        const timeBonus = Math.max(0, 50 - (this.timer?.getTime() || 0));
        this.score?.addMatch(timeBonus);

        this.flippedCards = [];
        this.isLocked = false;

        // Check win
        if (this.cards.every(c => c.isDone())) {
          await this.handleWin();
        }
      } else {
        // No match
        await this.api.delay(800);
        this.api.playSound('error');
        await Promise.all([
          this.api.shake(first.element),
          this.api.shake(second.element)
        ]);
        await Promise.all([
          first.unflip(),
          second.unflip()
        ]);

        this.flippedCards = [];
        this.isLocked = false;
      }
    }
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;

    // Save best score
    const bestScore = this.api.load<number>('bestScore') || 0;
    if (finalScore > bestScore) {
      this.api.save('bestScore', finalScore);
    }

    this.api.playSound('win');
    this.api.showConfetti();

    if (typeof window !== 'undefined' && (window as any).SCORMBridge) {
      try {
        const scorm = (window as any).SCORMBridge.getInstance();
        scorm?.reportCompletion(finalScore || 100);
      } catch (e) {}
    }

    // Win screen
    await this.api.delay(500);

    const overlay = this.api.createElement('div', [
      'fixed', 'inset-0', 'bg-black/40', 'backdrop-blur-sm',
      'flex', 'items-center', 'justify-center', 'z-40', 'p-4'
    ]);

    const modal = this.api.createElement('div', [
      'bg-white', 'rounded-3xl', 'p-8', 'max-w-sm', 'w-full', 'text-center',
      'shadow-2xl', 'animate-pop'
    ]);

    const trophy = this.api.createElement('div', ['text-6xl', 'mb-4', 'animate-bounce-slow']);
    trophy.textContent = '🏆';
    modal.appendChild(trophy);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-kid-green', 'mb-2']);
    title.textContent = 'You Did It!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-gray-50 rounded-xl">
        <span class="text-gray-500">⭐ Score</span>
        <span class="font-black text-kid-orange">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-gray-50 rounded-xl">
        <span class="text-gray-500">🔄 Moves</span>
        <span class="font-black text-kid-blue">${moves}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-gray-50 rounded-xl">
        <span class="text-gray-500">⏱️ Time</span>
        <span class="font-black text-kid-purple">${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}</span>
      </div>
    `;
    modal.appendChild(stats);

    // Buttons
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
        this.startGame(nextLevelNum, this.currentTheme);
      });
      btnCol.appendChild(nextBtn);
    }

    const btnRow = this.api.createElement('div', ['flex', 'gap-3', 'justify-center']);

    const replayBtn = this.api.createElement('button', [
      'flex-1', 'py-3', 'bg-kid-green', 'text-white', 'font-bold', 'rounded-2xl',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer'
    ]);
    replayBtn.textContent = '🔄 Replay';
    this.api.onTap(replayBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
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
      this.buildMenu();
    });
    btnRow.appendChild(menuBtn);

    btnCol.appendChild(btnRow);
    modal.appendChild(btnCol);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  },

  // ── Serialization ──

  serialize() {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      data: {
        level: this.currentLevel,
        theme: this.currentTheme,
        score: this.score?.getScore(),
        moves: this.score?.getMoves(),
        time: this.timer?.getTime()
      }
    };
  },

  deserialize(state: any): void {
    if (state.data) {
      this.currentLevel = state.data.level || 1;
      this.currentTheme = state.data.theme || 'animals';
    }
  }
} as GameModule;
