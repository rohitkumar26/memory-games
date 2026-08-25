import type { GameModule } from '../../core/types';
import type { DOMEngineAPI } from '../../engines/dom-engine/api';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

interface ThemeConfig {
  id: string;
  name: string;
  emoji: string;
  bgGradient: string;
  tileBg: string;
  tileRevealedBg: string;
  treasures: string[];
}

const THEMES: Record<string, ThemeConfig> = {
  island: {
    id: 'island',
    name: 'Pirate Island',
    emoji: '🏝️',
    bgGradient: 'from-amber-400 via-orange-500 to-yellow-600',
    tileBg: 'bg-amber-100 border-amber-300 hover:bg-amber-200 text-amber-700',
    tileRevealedBg: 'bg-yellow-400 border-yellow-500 text-yellow-900 shadow-amber-300/50',
    treasures: ['🪙', '💎', '🏆', '🦪', '🗺️', '👑', '💰', '🗝️']
  },
  reef: {
    id: 'reef',
    name: 'Sunken Reef',
    emoji: '🐠',
    bgGradient: 'from-cyan-400 via-teal-500 to-blue-600',
    tileBg: 'bg-teal-100 border-teal-300 hover:bg-teal-200 text-teal-700',
    tileRevealedBg: 'bg-cyan-300 border-cyan-500 text-cyan-900 shadow-cyan-300/50',
    treasures: ['⚓', '🐚', '🔱', '📦', '💚', '🐠', '🫧', '💎']
  },
  cave: {
    id: 'cave',
    name: 'Enchanted Cave',
    emoji: '💎',
    bgGradient: 'from-purple-500 via-indigo-600 to-violet-700',
    tileBg: 'bg-purple-100 border-purple-300 hover:bg-purple-200 text-purple-700',
    tileRevealedBg: 'bg-violet-300 border-violet-500 text-violet-900 shadow-purple-300/50',
    treasures: ['🔮', '💍', '💜', '⭐', '🧈', '🕯️', '🧿', '🗝️']
  }
};

const DIFFICULTY_CONFIG = [
  { size: 3, treasureCount: 2, previewSec: 3.5, label: 'Level 1 (3x3, 2 Treasures)' },
  { size: 3, treasureCount: 3, previewSec: 3.0, label: 'Level 2 (3x3, 3 Treasures)' },
  { size: 4, treasureCount: 4, previewSec: 3.0, label: 'Level 3 (4x4, 4 Treasures)' },
  { size: 4, treasureCount: 5, previewSec: 2.5, label: 'Level 4 (4x4, 5 Treasures)' },
  { size: 5, treasureCount: 6, previewSec: 2.0, label: 'Level 5 (5x5, 6 Treasures)' }
];

const TOTAL_ROUNDS = 3;

interface GridTile {
  index: number;
  hasTreasure: boolean;
  treasureEmoji: string;
  isRevealed: boolean;
  element: HTMLElement | null;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default {
  id: 'treasure-hunt',
  name: 'Treasure Hunt',

  api: null as DOMEngineAPI | null,
  container: null as HTMLElement | null,
  currentLevel: 1,
  currentRound: 1,
  currentTheme: 'island' as keyof typeof THEMES,
  isPlaying: false,
  isMemorizing: false,
  isLocked: false,
  timer: null as Timer | null,
  score: null as Score | null,
  tiles: [] as GridTile[],
  foundTreasuresCount: 0,
  totalTreasuresInRound: 0,
  currentModal: null as HTMLElement | null,

  init(api: DOMEngineAPI): void {
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
    this.isMemorizing = false;
    this.timer?.pause();
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
    this.tiles = [];
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
      'bg-gradient-to-r', 'from-amber-400', 'via-orange-500', 'to-yellow-500',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🏴‍☠️ Treasure Hunt!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Memorize where the buried pirate treasures flash on the map, then dig them all up from memory!';
    menu.appendChild(subtitle);

    // Theme selector
    const themeSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const themeLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    themeLabel.textContent = 'Choose Adventure Map';
    themeSection.appendChild(themeLabel);

    const themeRow = this.api.createElement('div', ['flex', 'gap-3', 'flex-wrap', 'justify-center']);
    Object.values(THEMES).forEach((thm) => {
      const btn = this.api!.createElement('button', [
        'px-4', 'py-2', 'rounded-2xl', 'font-bold', 'text-sm', 'transition-all',
        'border-3', 'cursor-pointer', 'flex', 'items-center', 'gap-1.5'
      ]);
      btn.innerHTML = `<span>${thm.emoji}</span> <span>${thm.name}</span>`;

      if (thm.id === this.currentTheme) {
        btn.classList.add('bg-amber-500', 'text-white', 'border-amber-600', 'scale-105', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-amber-400');
      }

      this.api!.onTap(btn, () => {
        this.currentTheme = thm.id as keyof typeof THEMES;
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
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-amber-500', 'via-orange-500', 'to-yellow-500',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🗺️ Start Hunt!';
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
    const safeTheme = (theme && THEMES[theme as keyof typeof THEMES]) ? (theme as keyof typeof THEMES) : (this.currentTheme && THEMES[this.currentTheme] ? this.currentTheme : 'island');
    this.currentTheme = safeTheme;

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

    this.isPlaying = true;
    this.timer = new Timer(this.api);
    header.appendChild(this.timer.element);
    this.timer.start();

    this.container.appendChild(header);

    const mainView = this.api.createElement('div', [
      'w-full', 'max-w-xl', 'mx-auto', 'px-4', 'flex', 'flex-col', 'gap-4', 'items-center'
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
    const themeConfig = THEMES[this.currentTheme] || THEMES.island;
    const totalTiles = config.size * config.size;

    this.foundTreasuresCount = 0;
    this.totalTreasuresInRound = config.treasureCount;
    this.isMemorizing = true;
    this.isLocked = true;

    // Pick random treasure positions
    const indices = Array.from({ length: totalTiles }, (_, i) => i);
    const shuffledIndices = shuffle(indices);
    const treasurePositions = new Set(shuffledIndices.slice(0, config.treasureCount));
    const treasurePool = shuffle([...themeConfig.treasures]);

    this.tiles = indices.map((idx, i) => ({
      index: idx,
      hasTreasure: treasurePositions.has(idx),
      treasureEmoji: treasurePool[i % treasurePool.length] || '🪙',
      isRevealed: false,
      element: null
    }));

    mainView.innerHTML = '';

    // HUD: Round Badge & Status Prompt
    const hud = this.api.createElement('div', ['flex', 'items-center', 'justify-between', 'w-full', 'px-2']);
    
    const roundBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-amber-100', 'text-amber-800', 'rounded-full', 'font-bold', 'text-sm'
    ]);
    roundBadge.textContent = `Round ${this.currentRound} of ${TOTAL_ROUNDS} 🎯`;
    hud.appendChild(roundBadge);

    const statusBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-yellow-100', 'text-yellow-800', 'rounded-full', 'font-black', 'text-sm', 'animate-pulse'
    ]);
    statusBadge.id = 'treasure-status-badge';
    statusBadge.textContent = `👀 Memorize! ⏳ ${config.previewSec}s`;
    hud.appendChild(statusBadge);

    mainView.appendChild(hud);

    // Grid Container
    const gridContainer = this.api.createElement('div', [
      'w-full', 'bg-amber-900/10', 'p-4', 'sm:p-6', 'rounded-3xl', 'border-4',
      'border-amber-300', 'shadow-inner', 'flex', 'justify-center'
    ]);

    const grid = this.api.createElement('div', [
      'grid', 'gap-2.5', 'sm:gap-3', 'w-full', 'max-w-md', 'aspect-square'
    ]);
    grid.style.gridTemplateColumns = `repeat(${config.size}, minmax(0, 1fr))`;
    grid.style.gridTemplateRows = `repeat(${config.size}, minmax(0, 1fr))`;

    this.tiles.forEach(tile => {
      const tileBtn = this.api!.createElement('button', [
        'w-full', 'h-full', 'rounded-2xl', 'font-black', 'text-2xl', 'sm:text-3xl',
        'border-3', 'shadow-md', 'flex', 'items-center', 'justify-center',
        'transition-all', 'duration-300', 'select-none'
      ]);

      // Initially show revealed for memorization
      tileBtn.className += ' ' + (tile.hasTreasure ? themeConfig.tileRevealedBg : themeConfig.tileBg);
      tileBtn.innerHTML = tile.hasTreasure ? `<span class="animate-pop">${tile.treasureEmoji}</span>` : '<span class="opacity-20">🏝️</span>';
      
      tile.element = tileBtn;
      grid.appendChild(tileBtn);
    });

    gridContainer.appendChild(grid);
    mainView.appendChild(gridContainer);

    // Memorization Countdown
    let timeLeft = config.previewSec;
    const interval = setInterval(() => {
      timeLeft = Math.max(0, +(timeLeft - 0.5).toFixed(1));
      if (statusBadge) {
        statusBadge.textContent = `👀 Memorize! ⏳ ${timeLeft}s`;
      }
    }, 500);

    await this.api.delay(config.previewSec * 1000);
    clearInterval(interval);

    // Cover tiles with sand / chests
    this.isMemorizing = false;
    this.isLocked = false;

    if (statusBadge) {
      statusBadge.className = 'px-4 py-1.5 bg-amber-500 text-white rounded-full font-black text-sm animate-pop';
      statusBadge.textContent = `⛏️ Dig Treasures! (0/${this.totalTreasuresInRound})`;
    }

    this.tiles.forEach(tile => {
      if (!tile.element) return;
      tile.element.className = `w-full h-full rounded-2xl font-black text-2xl sm:text-3xl border-3 shadow-md flex items-center justify-center transition-all duration-300 cursor-pointer ${themeConfig.tileBg}`;
      tile.element.innerHTML = '<span class="opacity-40">❓</span>';

      this.api!.onTap(tile.element, () => {
        this.handleTileClick(tile, mainView, statusBadge);
      });
    });
  },

  async handleTileClick(tile: GridTile, mainView: HTMLElement, statusBadge: HTMLElement): Promise<void> {
    if (this.isLocked || this.isMemorizing || tile.isRevealed || !this.api) return;

    tile.isRevealed = true;
    this.score?.addMove();

    const themeConfig = THEMES[this.currentTheme] || THEMES.island;

    if (tile.hasTreasure) {
      // Correct treasure dig!
      this.api.playSound('match');
      this.score?.addMatch(25);
      this.foundTreasuresCount++;

      if (tile.element) {
        tile.element.className = `w-full h-full rounded-2xl font-black text-2xl sm:text-3xl border-3 shadow-lg flex items-center justify-center transition-all duration-300 scale-105 ${themeConfig.tileRevealedBg}`;
        tile.element.innerHTML = `<span class="animate-pop">${tile.treasureEmoji}</span>`;
      }

      if (statusBadge) {
        statusBadge.textContent = `⛏️ Found (${this.foundTreasuresCount}/${this.totalTreasuresInRound})`;
      }

      // Check if all treasures in this round are found
      if (this.foundTreasuresCount >= this.totalTreasuresInRound) {
        this.isLocked = true;
        this.api.playSound('pop');

        if (statusBadge) {
          statusBadge.className = 'px-4 py-1.5 bg-emerald-500 text-white rounded-full font-black text-sm animate-bounce-slow';
          statusBadge.textContent = '🎉 All Treasures Found!';
        }

        await this.api.delay(1000);

        if (this.currentRound >= TOTAL_ROUNDS) {
          await this.handleWin();
        } else {
          this.currentRound++;
          this.startRound(mainView);
        }
      }
    } else {
      // Empty Sand Dig
      this.api.playSound('error');
      if (tile.element) {
        this.api.shake(tile.element);
        tile.element.className = `w-full h-full rounded-2xl font-black text-2xl sm:text-3xl border-3 shadow-inner flex items-center justify-center transition-all duration-300 bg-gray-200 border-gray-300 text-gray-400`;
        tile.element.innerHTML = '<span class="opacity-60">💨</span>';
      }
    }
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;

    const bestScore = this.api.load<number>('treasure_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('treasure_best', finalScore);
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
    icon.textContent = '🏆';
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-amber-500', 'mb-2']);
    title.textContent = 'Treasure Master!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-amber-50 rounded-xl">
        <span class="text-amber-800">⭐ Score</span>
        <span class="font-black text-amber-600">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-amber-50 rounded-xl">
        <span class="text-amber-800">🔄 Moves</span>
        <span class="font-black text-amber-600">${moves}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-amber-50 rounded-xl">
        <span class="text-amber-800">⏱️ Time</span>
        <span class="font-black text-amber-600">${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}</span>
      </div>
    `;
    modal.appendChild(stats);

    const btnCol = this.api.createElement('div', ['flex', 'flex-col', 'gap-3']);

    if (this.currentLevel < 5) {
      const nextLevelNum = this.currentLevel + 1;
      const nextBtn = this.api.createElement('button', [
        'w-full', 'py-3.5', 'bg-gradient-to-r', 'from-amber-500', 'to-orange-500',
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
      'flex-1', 'py-3', 'bg-amber-500', 'text-white', 'font-bold', 'rounded-2xl',
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
        round: this.currentRound,
        theme: this.currentTheme
      }
    };
  },

  deserialize(state: any): void {
    if (state.data) {
      this.currentLevel = state.data.level || 1;
      this.currentRound = state.data.round || 1;
      this.currentTheme = state.data.theme || 'island';
    }
  }
} as GameModule;
