import type { GameModule, EngineAPI } from '../../core/types';
import { shuffle } from '../../core/utils';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

interface TileData {
  id: number;
  emojiLeft: string;
  emojiRight: string;
  isDiff: boolean;
  found: boolean;
}

const THEMES = {
  pets: ['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🦁','🐮','🐷','🐸','🐵','🦄','🦉'],
  space: ['🚀','🛸','🌍','🌙','☀️','🪐','☄️','🌟','👽','🛰️','👾','🌌','⚡','🔥'],
  fruits: ['🍎','🍌','🍕','🍩','🍦','🍉','🍇','🥕','🍔','🍓','🥑','🌽','🍰','🍪'],
  magic: ['🪄','👑','💎','🏰','🐉','🍄','🔮','✨','🦄','🧚','🗝️','🛡️','🏹','🏺']
};

const DIFFICULTY_CONFIG = [
  { rows: 3, cols: 3, diffCount: 3, label: 'Easy (3x3, 3 Differences)' },
  { rows: 3, cols: 3, diffCount: 4, label: 'Medium (3x3, 4 Differences)' },
  { rows: 3, cols: 4, diffCount: 4, label: 'Hard (3x4, 4 Differences)' },
  { rows: 4, cols: 4, diffCount: 5, label: 'Expert (4x4, 5 Differences)' },
  { rows: 4, cols: 4, diffCount: 6, label: 'Master (4x4, 6 Differences)' },
];

const TOTAL_ROUNDS = 3;

export default {
  id: 'spot-the-difference',
  name: 'Spot the Difference',

  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  currentLevel: 1,
  currentTheme: 'pets' as keyof typeof THEMES,
  currentRound: 1,
  isPlaying: false,
  timer: null as Timer | null,
  score: null as Score | null,
  tiles: [] as TileData[],
  leftTileElements: [] as HTMLElement[],
  rightTileElements: [] as HTMLElement[],
  diffsFoundCount: 0,
  totalDiffs: 0,
  currentModal: null as HTMLElement | null,

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
    this.timer?.pause();
    this.tiles = [];
    this.leftTileElements = [];
    this.rightTileElements = [];
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
      'bg-gradient-to-r', 'from-pink-500', 'via-rose-500', 'to-yellow-500',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🔍 Spot the Difference!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Compare the two pictures side by side and tap all the hidden differences!';
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
        btn.classList.add('bg-rose-500', 'text-white', 'border-rose-600', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-rose-400');
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
        btn.classList.add('bg-yellow-500', 'text-white', 'border-yellow-600', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200', 'hover:border-yellow-400');
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
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-rose-500', 'to-amber-500',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🎮 Start Spotting!';
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
    const safeTheme = (theme && THEMES[theme as keyof typeof THEMES]) ? (theme as keyof typeof THEMES) : (this.currentTheme && THEMES[this.currentTheme] ? this.currentTheme : 'pets');
    this.currentTheme = safeTheme;

    this.container.innerHTML = '';

    // Header
    const header = this.api.createElement('div', [
      'flex', 'items-center', 'justify-between', 'w-full', 'max-w-4xl', 'mx-auto', 'px-4', 'py-3'
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
      'w-full', 'max-w-4xl', 'mx-auto', 'px-4', 'flex', 'flex-col', 'gap-4'
    ]);
    this.container.appendChild(mainView);

    this.startRound(mainView);
  },

  startRound(mainView: HTMLElement): void {
    if (!this.api) return;

    if (!this.isPlaying && this.timer) {
      this.isPlaying = true;
      this.timer.start();
    }

    const config = DIFFICULTY_CONFIG[this.currentLevel - 1] || DIFFICULTY_CONFIG[0];
    const totalTiles = config.rows * config.cols;
    const themeList = THEMES[this.currentTheme] || THEMES.pets;
    const themePool = shuffle([...themeList]);

    this.diffsFoundCount = 0;
    this.totalDiffs = config.diffCount;
    this.tiles = [];
    this.leftTileElements = [];
    this.rightTileElements = [];

    // Choose which indices will have differences
    const indices = Array.from({ length: totalTiles }, (_, i) => i);
    const diffIndices = new Set(shuffle(indices).slice(0, config.diffCount));

    for (let i = 0; i < totalTiles; i++) {
      const baseEmoji = themePool[i % themePool.length];
      let rightEmoji = baseEmoji;
      const isDiff = diffIndices.has(i);

      if (isDiff) {
        // Pick an alternate distinct emoji from theme
        const alternates = themePool.filter(e => e !== baseEmoji);
        rightEmoji = alternates[i % alternates.length] || '⭐';
      }

      this.tiles.push({
        id: i,
        emojiLeft: baseEmoji,
        emojiRight: rightEmoji,
        isDiff,
        found: false
      });
    }

    mainView.innerHTML = '';

    // Status Banner
    const statusWrapper = this.api.createElement('div', ['flex', 'items-center', 'justify-between', 'px-2']);
    const roundBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-rose-100', 'text-rose-800', 'rounded-full', 'font-bold', 'text-sm'
    ]);
    roundBadge.textContent = `Round ${this.currentRound} of ${TOTAL_ROUNDS} 🎯`;
    statusWrapper.appendChild(roundBadge);

    const diffCounter = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-amber-100', 'text-amber-800', 'rounded-full', 'font-extrabold', 'text-sm'
    ]);
    diffCounter.id = 'diff-counter-badge';
    diffCounter.textContent = `🔍 Differences: 0 / ${this.totalDiffs}`;
    statusWrapper.appendChild(diffCounter);
    mainView.appendChild(statusWrapper);

    // Scenes Grid Container (Side-by-side)
    const scenesContainer = this.api.createElement('div', [
      'grid', 'grid-cols-1', 'sm:grid-cols-2', 'gap-4', 'sm:gap-6', 'w-full'
    ]);

    // Build Left Scene
    const leftBox = this.buildSceneBox('Left Scene 🖼️', 'from-pink-50 to-purple-50', 'border-pink-200');
    const leftGrid = this.api.createElement('div', ['grid', 'gap-3', 'w-full', 'max-w-[320px]', 'aspect-square']);
    leftGrid.style.gridTemplateColumns = `repeat(${config.cols}, minmax(0, 1fr))`;

    this.tiles.forEach((tile, idx) => {
      const tileEl = this.api!.createElement('button', [
        'aspect-square', 'w-full', 'bg-white', 'rounded-2xl', 'shadow-md', 'border-3',
        'border-pink-200', 'flex', 'items-center', 'justify-center',
        'text-3xl', 'sm:text-4xl', 'transition-all', 'duration-200', 'cursor-pointer',
        'hover:scale-105', 'active:scale-95', 'relative', 'select-none'
      ]);
      tileEl.textContent = tile.emojiLeft;

      this.api!.onTap(tileEl, () => {
        this.handleTileTap(idx, diffCounter, mainView);
      });

      this.leftTileElements.push(tileEl);
      leftGrid.appendChild(tileEl);
    });

    leftBox.appendChild(leftGrid);
    scenesContainer.appendChild(leftBox);

    // Build Right Scene
    const rightBox = this.buildSceneBox('Right Scene 🖼️', 'from-yellow-50 to-amber-50', 'border-amber-200');
    const rightGrid = this.api.createElement('div', ['grid', 'gap-3', 'w-full', 'max-w-[320px]', 'aspect-square']);
    rightGrid.style.gridTemplateColumns = `repeat(${config.cols}, minmax(0, 1fr))`;

    this.tiles.forEach((tile, idx) => {
      const tileEl = this.api!.createElement('button', [
        'aspect-square', 'w-full', 'bg-white', 'rounded-2xl', 'shadow-md', 'border-3',
        'border-amber-200', 'flex', 'items-center', 'justify-center',
        'text-3xl', 'sm:text-4xl', 'transition-all', 'duration-200', 'cursor-pointer',
        'hover:scale-105', 'active:scale-95', 'relative', 'select-none'
      ]);
      tileEl.textContent = tile.emojiRight;

      this.api!.onTap(tileEl, () => {
        this.handleTileTap(idx, diffCounter, mainView);
      });

      this.rightTileElements.push(tileEl);
      rightGrid.appendChild(tileEl);
    });

    rightBox.appendChild(rightGrid);
    scenesContainer.appendChild(rightBox);

    mainView.appendChild(scenesContainer);
  },

  buildSceneBox(title: string, bgGradient: string, border: string): HTMLElement {
    const box = this.api!.createElement('div', [
      'bg-gradient-to-br', ...bgGradient.split(' '), 'rounded-3xl', 'p-4', 'sm:p-6', 'shadow-xl',
      'border-4', ...border.split(' '), 'flex', 'flex-col', 'items-center', 'w-full'
    ]);
    const titleEl = this.api!.createElement('span', [
      'text-xs', 'font-black', 'text-gray-600', 'uppercase', 'tracking-wider', 'mb-3'
    ]);
    titleEl.textContent = title;
    box.appendChild(titleEl);
    return box;
  },

  async handleTileTap(index: number, counterBadge: HTMLElement, mainView: HTMLElement): Promise<void> {
    if (!this.api) return;

    const tile = this.tiles[index];
    if (tile.found) return;

    this.score?.addMove();

    if (tile.isDiff) {
      // DIFFERENCE FOUND!
      tile.found = true;
      this.diffsFoundCount++;
      this.score?.addMatch(50);
      this.api.playSound('match');

      counterBadge.textContent = `🔍 Differences: ${this.diffsFoundCount} / ${this.totalDiffs}`;

      // Highlight difference on both tiles
      const lEl = this.leftTileElements[index];
      const rEl = this.rightTileElements[index];

      const foundClass = ['ring-4', 'ring-emerald-400', 'bg-emerald-50', 'border-emerald-500', 'scale-105'];
      lEl.classList.add(...foundClass);
      rEl.classList.add(...foundClass);

      await Promise.all([
        this.api.pop(lEl),
        this.api.pop(rEl)
      ]);

      if (this.diffsFoundCount >= this.totalDiffs) {
        // Round Complete!
        await this.api.delay(400);
        if (this.currentRound >= TOTAL_ROUNDS) {
          await this.handleWin();
        } else {
          this.currentRound++;
          this.startRound(mainView);
        }
      }
    } else {
      // Identical tile tapped
      this.api.playSound('error');
      const lEl = this.leftTileElements[index];
      const rEl = this.rightTileElements[index];
      await Promise.all([
        this.api.shake(lEl),
        this.api.shake(rEl)
      ]);
    }
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;

    const bestScore = this.api.load<number>('spot_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('spot_best', finalScore);
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
    icon.textContent = '🦅';
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-rose-500', 'mb-2']);
    title.textContent = 'Eagle Eye Master!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-rose-50 rounded-xl">
        <span class="text-rose-800">⭐ Score</span>
        <span class="font-black text-rose-600">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-rose-50 rounded-xl">
        <span class="text-rose-800">🔄 Total Tries</span>
        <span class="font-black text-rose-600">${moves}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-rose-50 rounded-xl">
        <span class="text-rose-800">⏱️ Time</span>
        <span class="font-black text-rose-600">${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}</span>
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
      'flex-1', 'py-3', 'bg-rose-500', 'text-white', 'font-bold', 'rounded-2xl',
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
      this.currentTheme = state.data.theme || 'pets';
      this.currentRound = state.data.round || 1;
    }
  }
} as GameModule;
