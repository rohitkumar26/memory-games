import type { GameModule, EngineAPI } from '../../core/types';
import { shuffle } from '../../core/utils';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

interface CategoryDef {
  id: string;
  name: string;
  icon: string;
  colorClass: string;
  basketBorder: string;
  items: string[];
}

interface ItemToSort {
  id: number;
  emoji: string;
  categoryId: string;
}

const CATEGORY_PACKS: { label: string; categories: CategoryDef[] }[] = [
  {
    label: 'Animals vs Foods',
    categories: [
      {
        id: 'animals',
        name: 'Animals',
        icon: '🦁',
        colorClass: 'bg-emerald-500 text-white',
        basketBorder: 'border-emerald-400 bg-emerald-50',
        items: ['🐶','🐱','🦁','🐼','🦊','🐰','🐮','🐷','🐵','🐻','🐸','🦄']
      },
      {
        id: 'foods',
        name: 'Delicious Foods',
        icon: '🍎',
        colorClass: 'bg-rose-500 text-white',
        basketBorder: 'border-rose-400 bg-rose-50',
        items: ['🍎','🍌','🍕','🍩','🍦','🍉','🍇','🥕','🍔','🍓','🥑','🌽']
      }
    ]
  },
  {
    label: 'Vehicles vs Space',
    categories: [
      {
        id: 'vehicles',
        name: 'Land & Sea',
        icon: '🚗',
        colorClass: 'bg-sky-500 text-white',
        basketBorder: 'border-sky-400 bg-sky-50',
        items: ['🚗','🚌','🚒','🚑','🚜','🚂','🛵','🚲','🚢','⛵','🚤','🚕']
      },
      {
        id: 'space',
        name: 'Outer Space',
        icon: '🚀',
        colorClass: 'bg-indigo-600 text-white',
        basketBorder: 'border-indigo-400 bg-indigo-50',
        items: ['🚀','🛸','🌍','🌙','☀️','🪐','☄️','🌟','👽','🛰️','👾','🌌']
      }
    ]
  },
  {
    label: 'Animals vs Nature vs Sweets (3 Categories)',
    categories: [
      {
        id: 'animals',
        name: 'Creatures',
        icon: '🐾',
        colorClass: 'bg-amber-500 text-white',
        basketBorder: 'border-amber-400 bg-amber-50',
        items: ['🦁','🐯','🐼','🐨','🦄','🐙','🦀','🦉','🐬','🦋']
      },
      {
        id: 'nature',
        name: 'Plants & Nature',
        icon: '🌿',
        colorClass: 'bg-green-600 text-white',
        basketBorder: 'border-green-400 bg-green-50',
        items: ['🌲','🌻','🍄','🌸','🌴','🍀','🍂','🌵','🌾','🍁']
      },
      {
        id: 'sweets',
        name: 'Sweet Treats',
        icon: '🍰',
        colorClass: 'bg-pink-500 text-white',
        basketBorder: 'border-pink-400 bg-pink-50',
        items: ['🍰','🍦','🍩','🍪','🍫','🍭','🧁','🍬','🍧','🎂']
      }
    ]
  }
];

const DIFFICULTY_CONFIG = [
  { itemsPerCat: 3, label: 'Easy (6-9 Items)' },
  { itemsPerCat: 4, label: 'Medium (8-12 Items)' },
  { itemsPerCat: 6, label: 'Hard (12-18 Items)' },
  { itemsPerCat: 8, label: 'Expert (16-24 Items)' },
  { itemsPerCat: 10, label: 'Master (20-30 Items)' },
];

export default {
  id: 'category-sorting',
  name: 'Category Sorting',

  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  currentPackIdx: 0,
  currentLevel: 1,
  isPlaying: false,
  itemsQueue: [] as ItemToSort[],
  totalItems: 0,
  sortedCount: 0,
  timer: null as Timer | null,
  score: null as Score | null,
  currentSpotlightCard: null as HTMLElement | null,
  basketCounts: {} as Record<string, HTMLElement>,
  currentModal: null as HTMLElement | null,

  init(api: EngineAPI): void {
    this.api = api;
    this.container = api.getContainer();
    this.buildMenu();
  },

  start(level?: number): void {
    this.isPlaying = true;
    if (typeof level === 'number') this.currentLevel = level;
    this.startGame(this.currentLevel, this.currentPackIdx);
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
    this.itemsQueue = [];
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
      'bg-gradient-to-r', 'from-amber-400', 'via-rose-500', 'to-indigo-600',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🧺 Category Sorting!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Sort each mystery item into its matching category basket!';
    menu.appendChild(subtitle);

    // Theme pack selector
    const packSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const packLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    packLabel.textContent = 'Select Category Pack';
    packSection.appendChild(packLabel);

    const packRow = this.api.createElement('div', ['flex', 'gap-2', 'flex-wrap', 'justify-center']);
    CATEGORY_PACKS.forEach((pack, idx) => {
      const btn = this.api.createElement('button', [
        'px-4', 'py-2', 'rounded-2xl', 'font-bold', 'text-sm', 'transition-all',
        'border-3', 'cursor-pointer'
      ]);
      btn.textContent = pack.label;

      if (idx === this.currentPackIdx) {
        btn.classList.add('bg-rose-500', 'text-white', 'border-rose-600', 'scale-105', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-rose-400');
      }

      this.api.onTap(btn, () => {
        this.currentPackIdx = idx;
        this.api?.playSound('click');
        this.buildMenu();
      });
      packRow.appendChild(btn);
    });
    packSection.appendChild(packRow);
    menu.appendChild(packSection);

    // Difficulty selector
    const diffSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const diffLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    diffLabel.textContent = 'Difficulty (Item Count)';
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
        btn.classList.add('bg-amber-500', 'text-white', 'border-amber-600', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200', 'hover:border-amber-400');
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
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-amber-500', 'to-rose-500',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🎮 Start Sorting!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.startGame(this.currentLevel, this.currentPackIdx);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(level: number, packIdx?: number): void {
    if (!this.api || !this.container) return;

    this.currentLevel = level || 1;
    this.currentPackIdx = (typeof packIdx === 'number' && CATEGORY_PACKS[packIdx]) ? packIdx : (this.currentPackIdx || 0);
    const pack = CATEGORY_PACKS[this.currentPackIdx] || CATEGORY_PACKS[0];
    const config = DIFFICULTY_CONFIG[this.currentLevel - 1] || DIFFICULTY_CONFIG[0];

    this.container.innerHTML = '';
    this.sortedCount = 0;
    this.basketCounts = {};

    // Generate items queue
    const allItems: ItemToSort[] = [];
    let itemId = 0;

    pack.categories.forEach(cat => {
      const chosen = shuffle([...cat.items]).slice(0, config.itemsPerCat);
      chosen.forEach(emoji => {
        allItems.push({
          id: itemId++,
          emoji,
          categoryId: cat.id
        });
      });
    });

    this.itemsQueue = shuffle(allItems);
    this.totalItems = this.itemsQueue.length;

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

    // Main Play Area
    const playArea = this.api.createElement('div', [
      'w-full', 'max-w-2xl', 'mx-auto', 'px-4', 'flex', 'flex-col', 'gap-6'
    ]);

    // Progress Bar
    const progressWrapper = this.api.createElement('div', ['w-full', 'bg-gray-200', 'rounded-full', 'h-3', 'overflow-hidden']);
    const progressBar = this.api.createElement('div', ['bg-rose-500', 'h-full', 'transition-all', 'duration-300']);
    progressBar.style.width = '0%';
    progressWrapper.appendChild(progressBar);
    playArea.appendChild(progressWrapper);

    // Spotlight Card Area (Current item to sort)
    const spotlightContainer = this.api.createElement('div', [
      'flex', 'flex-col', 'items-center', 'justify-center', 'py-4'
    ]);

    const spotlightTitle = this.api.createElement('span', [
      'text-gray-500', 'font-extrabold', 'text-sm', 'uppercase', 'tracking-widest', 'mb-2'
    ]);
    spotlightTitle.textContent = `Item ${this.sortedCount + 1} of ${this.totalItems}`;
    spotlightContainer.appendChild(spotlightTitle);

    this.currentSpotlightCard = this.api.createElement('div', [
      'w-32', 'h-32', 'sm:w-36', 'sm:h-36', 'bg-white', 'rounded-3xl', 'shadow-2xl',
      'border-4', 'border-purple-200', 'flex', 'items-center', 'justify-center',
      'text-6xl', 'sm:text-7xl', 'select-none', 'animate-pop', 'transition-all'
    ]);
    spotlightContainer.appendChild(this.currentSpotlightCard);
    playArea.appendChild(spotlightContainer);

    // Category Baskets Area
    const basketsArea = this.api.createElement('div', [
      'grid', 'gap-4', 'w-full'
    ]);
    basketsArea.style.gridTemplateColumns = `repeat(${pack.categories.length}, minmax(0, 1fr))`;

    pack.categories.forEach(cat => {
      const basketCard = this.api.createElement('button', [
        'flex', 'flex-col', 'items-center', 'justify-center', 'p-4', 'rounded-3xl',
        'border-4', 'shadow-lg', 'transition-all', 'duration-200', 'cursor-pointer',
        'hover:scale-105', 'active:scale-95', ...cat.basketBorder.split(' ')
      ]);

      const catIcon = this.api.createElement('span', ['text-4xl', 'mb-1']);
      catIcon.textContent = cat.icon;
      basketCard.appendChild(catIcon);

      const catName = this.api.createElement('span', ['font-black', 'text-gray-800', 'text-base', 'sm:text-lg']);
      catName.textContent = cat.name;
      basketCard.appendChild(catName);

      const catBadge = this.api.createElement('span', [
        'mt-2', 'px-3', 'py-1', 'rounded-full', 'text-xs', 'font-bold', ...cat.colorClass.split(' ')
      ]);
      catBadge.textContent = 'Tap to Sort';
      this.basketCounts[cat.id] = catBadge;
      basketCard.appendChild(catBadge);

      this.api?.onTap(basketCard, () => {
        this.handleSortChoice(cat.id, basketCard, progressBar, spotlightTitle);
      });

      basketsArea.appendChild(basketCard);
    });

    playArea.appendChild(basketsArea);
    this.container.appendChild(playArea);

    this.renderCurrentItem(spotlightTitle);
  },

  renderCurrentItem(titleEl: HTMLElement): void {
    if (!this.currentSpotlightCard || this.itemsQueue.length === 0) return;
    const current = this.itemsQueue[0];
    this.currentSpotlightCard.textContent = current.emoji;
    titleEl.textContent = `Item ${this.sortedCount + 1} of ${this.totalItems}`;
    this.api?.pop(this.currentSpotlightCard);
  },

  async handleSortChoice(
    chosenCatId: string,
    basketEl: HTMLElement,
    progressBar: HTMLElement,
    titleEl: HTMLElement
  ): Promise<void> {
    if (!this.api || this.itemsQueue.length === 0 || !this.currentSpotlightCard) return;

    if (!this.isPlaying && this.timer) {
      this.isPlaying = true;
      this.timer.start();
    }

    const currentItem = this.itemsQueue[0];
    this.score?.addMove();

    if (currentItem.categoryId === chosenCatId) {
      // CORRECT SORT
      this.api.playSound('match');
      this.score?.addMatch(30);
      this.sortedCount++;

      progressBar.style.width = `${(this.sortedCount / this.totalItems) * 100}%`;
      await this.api.pop(basketEl);

      this.itemsQueue.shift();

      if (this.itemsQueue.length === 0) {
        // Complete!
        await this.api.delay(300);
        await this.handleWin();
      } else {
        this.renderCurrentItem(titleEl);
      }
    } else {
      // WRONG SORT
      this.api.playSound('error');
      await this.api.shake(basketEl);
    }
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;

    const bestScore = this.api.load<number>('sorting_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('sorting_best', finalScore);
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
    icon.textContent = '🎉';
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-rose-500', 'mb-2']);
    title.textContent = 'Master Sorter!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-rose-50 rounded-xl">
        <span class="text-rose-800">⭐ Score</span>
        <span class="font-black text-rose-600">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-rose-50 rounded-xl">
        <span class="text-rose-800">🔄 Moves</span>
        <span class="font-black text-rose-600">${moves}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-rose-50 rounded-xl">
        <span class="text-rose-800">⏱️ Time</span>
        <span class="font-black text-rose-600">${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}</span>
      </div>
    `;
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
        this.startGame(nextLevelNum, this.currentPackIdx);
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
      this.startGame(this.currentLevel, this.currentPackIdx);
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
        packIdx: this.currentPackIdx
      }
    };
  },

  deserialize(state: any): void {
    if (state.data) {
      this.currentLevel = state.data.level || 1;
      this.currentPackIdx = state.data.packIdx || 0;
    }
  }
} as GameModule;
