import type { GameModule, EngineAPI } from '../../core/types';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

interface ThemeConfig {
  id: string;
  name: string;
  hero: string;
  goal: string;
  tileBg: string;
  pathColor: string;
}

const THEMES: ThemeConfig[] = [
  { id: 'mouse', name: 'Mouse & Cheese', hero: '🐭', goal: '🧀', tileBg: 'bg-amber-50', pathColor: 'bg-amber-300 border-amber-400' },
  { id: 'bunny', name: 'Bunny & Carrot', hero: '🐰', goal: '🥕', tileBg: 'bg-emerald-50', pathColor: 'bg-emerald-300 border-emerald-400' },
  { id: 'space', name: 'Rocket & Planet', hero: '🚀', goal: '🪐', tileBg: 'bg-indigo-50', pathColor: 'bg-indigo-300 border-indigo-400' },
  { id: 'wizard', name: 'Wizard & Crystal', hero: '🧙', goal: '💎', tileBg: 'bg-purple-50', pathColor: 'bg-purple-300 border-purple-400' }
];

const DIFFICULTY_CONFIG = [
  { size: 4, previewSec: 4, label: 'Easy (4x4 Grid, 4s Flash)' },
  { size: 4, previewSec: 3, label: 'Medium (4x4 Grid, 3s Flash)' },
  { size: 5, previewSec: 3.5, label: 'Hard (5x5 Grid)' },
  { size: 5, previewSec: 2.5, label: 'Expert (5x5 Grid, Fast)' },
  { size: 6, previewSec: 2.5, label: 'Master (6x6 Labyrinth)' },
];

const TOTAL_ROUNDS = 3;

interface Point {
  r: number;
  c: number;
}

export default {
  id: 'maze-memory',
  name: 'Maze Memory',

  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  currentLevel: 1,
  currentThemeIdx: 0,
  currentRound: 1,
  isPlaying: false,
  timer: null as Timer | null,
  score: null as Score | null,
  path: [] as Point[],
  userStepIdx: 0,
  isLocked: false,
  gridElements: [] as HTMLElement[][],
  currentModal: null as HTMLElement | null,

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
    this.isLocked = false;
    this.timer?.pause();
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
    this.path = [];
    this.gridElements = [];
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
      'bg-gradient-to-r', 'from-amber-500', 'via-pink-500', 'to-purple-500',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🧭 Maze Memory!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Remember the secret glowing path through the labyrinth, then guide the hero safely to the treasure!';
    menu.appendChild(subtitle);

    // Theme selector
    const themeSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const themeLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    themeLabel.textContent = 'Choose Adventure';
    themeSection.appendChild(themeLabel);

    const themeRow = this.api.createElement('div', ['flex', 'gap-3', 'flex-wrap', 'justify-center']);
    THEMES.forEach((theme, idx) => {
      const btn = this.api!.createElement('button', [
        'px-4', 'py-2', 'rounded-2xl', 'font-bold', 'text-sm', 'transition-all',
        'border-3', 'cursor-pointer', 'flex', 'items-center', 'gap-1.5'
      ]);
      btn.innerHTML = `<span>${theme.hero}</span> <span>${theme.name}</span>`;

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
        btn.classList.add('bg-amber-500', 'text-white', 'border-amber-600', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200', 'hover:border-amber-400');
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
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-amber-500', 'to-purple-600',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🎮 Start Navigating!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.currentRound = 1;
      this.startGame(this.currentLevel, this.currentThemeIdx);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(level: number, themeIdx: number): void {
    if (!this.api || !this.container) return;

    this.container.innerHTML = '';
    this.isLocked = false;

    // Header
    const header = this.api.createElement('div', [
      'flex', 'items-center', 'justify-between', 'w-full', 'max-w-xl', 'mx-auto', 'px-4', 'py-3'
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
      'w-full', 'max-w-xl', 'mx-auto', 'px-4', 'flex', 'flex-col', 'gap-4'
    ]);
    this.container.appendChild(mainView);

    this.startRound(mainView);
  },

  generatePath(size: number): Point[] {
    // Generate a random self-avoiding walk from top-left (0,0) to bottom-right (size-1, size-1)
    const visited = new Set<string>();
    const path: Point[] = [{ r: 0, c: 0 }];
    visited.add('0,0');

    let current = { r: 0, c: 0 };
    const goal = { r: size - 1, c: size - 1 };

    while (current.r !== goal.r || current.c !== goal.c) {
      const neighbors: Point[] = [];
      const deltas = [
        { r: 0, c: 1 },
        { r: 1, c: 0 },
        { r: 0, c: -1 },
        { r: -1, c: 0 }
      ];

      for (const d of deltas) {
        const nr = current.r + d.r;
        const nc = current.c + d.c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited.has(`${nr},${nc}`)) {
          neighbors.push({ r: nr, c: nc });
        }
      }

      if (neighbors.length === 0) {
        // Dead end, restart path generation
        return this.generatePath(size);
      }

      // Prioritize moving towards goal
      neighbors.sort((a, b) => {
        const distA = Math.hypot(goal.r - a.r, goal.c - a.c);
        const distB = Math.hypot(goal.r - b.r, goal.c - b.c);
        return distA - distB + (Math.random() - 0.5);
      });

      const next = neighbors[0];
      visited.add(`${next.r},${next.c}`);
      path.push(next);
      current = next;
    }

    return path;
  },

  async startRound(mainView: HTMLElement): Promise<void> {
    if (!this.api) return;

    if (!this.isPlaying && this.timer) {
      this.isPlaying = true;
      this.timer.start();
    }

    const config = DIFFICULTY_CONFIG[this.currentLevel - 1] || DIFFICULTY_CONFIG[0];
    const theme = THEMES[this.currentThemeIdx] || THEMES[0];
    const size = config.size;

    this.isLocked = true;
    this.userStepIdx = 0;
    this.path = this.generatePath(size);
    this.gridElements = [];

    mainView.innerHTML = '';

    // Status Banner
    const statusWrapper = this.api.createElement('div', ['flex', 'items-center', 'justify-between', 'px-2']);
    const roundBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-amber-100', 'text-amber-800', 'rounded-full', 'font-bold', 'text-sm'
    ]);
    roundBadge.textContent = `Round ${this.currentRound} of ${TOTAL_ROUNDS} 🎯`;
    statusWrapper.appendChild(roundBadge);

    const countdownBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-purple-100', 'text-purple-800', 'rounded-full', 'font-extrabold', 'text-sm', 'animate-pulse'
    ]);
    countdownBadge.textContent = `👀 Memorize Path! ⏳ ${config.previewSec}s`;
    statusWrapper.appendChild(countdownBadge);
    mainView.appendChild(statusWrapper);

    // Maze Grid Container
    const gridCard = this.api.createElement('div', [
      'bg-white/95', 'backdrop-blur', 'rounded-3xl', 'p-4', 'sm:p-6', 'shadow-2xl',
      'border-4', 'border-purple-200', 'flex', 'flex-col', 'items-center', 'justify-center'
    ]);

    const grid = this.api.createElement('div', ['grid', 'gap-2', 'w-full', 'max-w-[420px]', 'aspect-square']);
    grid.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;

    const pathSet = new Set(this.path.map(p => `${p.r},${p.c}`));

    for (let r = 0; r < size; r++) {
      this.gridElements[r] = [];
      for (let c = 0; c < size; c++) {
        const isStart = r === 0 && c === 0;
        const isGoal = r === size - 1 && c === size - 1;
        const isPath = pathSet.has(`${r},${c}`);

        const tile = this.api.createElement('button', [
          'aspect-square', 'rounded-2xl', 'border-3', 'flex', 'items-center',
          'justify-center', 'text-3xl', 'sm:text-4xl', 'transition-all', 'duration-200',
          'cursor-pointer', 'select-none', 'relative'
        ]);

        if (isStart) {
          tile.textContent = theme.hero;
          tile.className += ' bg-amber-100 border-amber-400 ring-4 ring-amber-200 shadow-md';
        } else if (isGoal) {
          tile.textContent = theme.goal;
          tile.className += ' bg-pink-100 border-pink-400 shadow-md';
        } else {
          tile.className += ' bg-gray-50 border-gray-200 hover:border-purple-300';
        }

        // Preview golden highlight
        if (isPath && !isStart && !isGoal) {
          tile.classList.add('bg-amber-200', 'border-amber-400', 'shadow-inner');
          tile.textContent = '✨';
        }

        this.api.onTap(tile, () => {
          this.handleTileTap(r, c, mainView, countdownBadge);
        });

        this.gridElements[r][c] = tile;
        grid.appendChild(tile);
      }
    }

    gridCard.appendChild(grid);
    mainView.appendChild(gridCard);

    // Countdown interval
    let timeLeft = config.previewSec;
    const intervalId = window.setInterval(() => {
      timeLeft -= 1;
      if (timeLeft > 0) {
        countdownBadge.textContent = `👀 Memorize Path! ⏳ ${timeLeft}s`;
      } else {
        window.clearInterval(intervalId);
      }
    }, 1000);

    // Wait preview duration, then hide path
    this.api.playSound('flip');
    await this.api.delay(config.previewSec * 1000);
    window.clearInterval(intervalId);

    // Hide path tiles
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isStart = r === 0 && c === 0;
        const isGoal = r === size - 1 && c === size - 1;
        if (!isStart && !isGoal) {
          const tile = this.gridElements[r][c];
          tile.className = 'aspect-square rounded-2xl border-3 border-gray-200 bg-gray-50 flex items-center justify-center text-3xl sm:text-4xl transition-all duration-200 cursor-pointer select-none hover:border-purple-300';
          tile.textContent = '';
        }
      }
    }

    this.isLocked = false;
    countdownBadge.className = 'px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-sm';
    countdownBadge.textContent = `👉 Step to Goal (${theme.goal})!`;
    this.api.playSound('pop');
  },

  async handleTileTap(r: number, c: number, mainView: HTMLElement, badgeEl: HTMLElement): Promise<void> {
    if (this.isLocked || !this.api) return;

    const theme = THEMES[this.currentThemeIdx] || THEMES[0];
    const nextExpected = this.path[this.userStepIdx + 1];

    if (!nextExpected) return;

    this.score?.addMove();

    if (r === nextExpected.r && c === nextExpected.c) {
      // CORRECT STEP!
      this.userStepIdx++;
      this.api.playSound('flip');
      this.score?.addMatch(25);

      const tile = this.gridElements[r][c];
      const isGoal = this.userStepIdx === this.path.length - 1;

      if (isGoal) {
        // REACHED GOAL!
        this.isLocked = true;
        tile.className = 'aspect-square rounded-2xl border-4 border-emerald-500 bg-emerald-100 flex items-center justify-center text-4xl animate-pop';
        tile.textContent = `🎉`;

        badgeEl.textContent = '⭐ Goal Reached!';
        badgeEl.className = 'px-4 py-1.5 bg-emerald-500 text-white rounded-full font-black text-sm animate-bounce-slow';

        await this.api.pop(tile);
        this.api.playSound('match');

        await this.api.delay(800);

        if (this.currentRound >= TOTAL_ROUNDS) {
          await this.handleWin();
        } else {
          this.currentRound++;
          this.startRound(mainView);
        }
      } else {
        // Intermediate step
        tile.className = 'aspect-square rounded-2xl border-3 border-emerald-400 bg-emerald-100 flex items-center justify-center text-3xl animate-pop';
        tile.textContent = '👣';
        await this.api.pop(tile);
      }
    } else {
      // WRONG TILE! Off the path
      this.api.playSound('error');
      const tile = this.gridElements[r][c];
      tile.className = 'aspect-square rounded-2xl border-3 border-rose-400 bg-rose-100 flex items-center justify-center text-3xl animate-shake';
      tile.textContent = '❌';

      if (this.container) await this.api.shake(this.container);

      await this.api.delay(400);
      tile.className = 'aspect-square rounded-2xl border-3 border-gray-200 bg-gray-50 flex items-center justify-center text-3xl transition-all';
      tile.textContent = '';
    }
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;
    const theme = THEMES[this.currentThemeIdx] || THEMES[0];

    const bestScore = this.api.load<number>('maze_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('maze_best', finalScore);
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
    icon.textContent = theme.goal;
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-amber-600', 'mb-2']);
    title.textContent = 'Maze Master!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-amber-50 rounded-xl">
        <span class="text-amber-800">⭐ Score</span>
        <span class="font-black text-amber-700">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-amber-50 rounded-xl">
        <span class="text-amber-800">🔄 Total Tries</span>
        <span class="font-black text-amber-700">${moves}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-amber-50 rounded-xl">
        <span class="text-amber-800">⏱️ Time</span>
        <span class="font-black text-amber-700">${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}</span>
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
      'flex-1', 'py-3', 'bg-amber-500', 'text-white', 'font-bold', 'rounded-2xl',
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
