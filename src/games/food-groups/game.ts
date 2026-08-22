import type { GameModule, EngineAPI } from '../../core/types';
import { shuffle } from '../../core/utils';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  groupId: string;
}

interface FoodGroup {
  id: string;
  name: string;
  icon: string;
  colorClass: string;
  bgGradient: string;
  borderClass: string;
  items: { name: string; emoji: string }[];
}

const ALL_FOOD_GROUPS: FoodGroup[] = [
  {
    id: 'fruits',
    name: 'Fresh Fruits',
    icon: '🍎',
    colorClass: 'bg-rose-500 text-white',
    bgGradient: 'from-rose-50 to-pink-50',
    borderClass: 'border-rose-300',
    items: [
      { name: 'Apple', emoji: '🍎' },
      { name: 'Banana', emoji: '🍌' },
      { name: 'Strawberry', emoji: '🍓' },
      { name: 'Orange', emoji: '🍊' },
      { name: 'Grapes', emoji: '🍇' },
      { name: 'Watermelon', emoji: '🍉' },
      { name: 'Pineapple', emoji: '🍍' },
      { name: 'Cherries', emoji: '🍒' }
    ]
  },
  {
    id: 'veggies',
    name: 'Crisp Veggies',
    icon: '🥦',
    colorClass: 'bg-emerald-600 text-white',
    bgGradient: 'from-emerald-50 to-green-50',
    borderClass: 'border-emerald-300',
    items: [
      { name: 'Broccoli', emoji: '🥦' },
      { name: 'Carrot', emoji: '🥕' },
      { name: 'Sweet Corn', emoji: '🌽' },
      { name: 'Tomato', emoji: '🍅' },
      { name: 'Avocado', emoji: '🥑' },
      { name: 'Cucumber', emoji: '🥒' },
      { name: 'Eggplant', emoji: '🍆' },
      { name: 'Bell Pepper', emoji: '🫑' }
    ]
  },
  {
    id: 'grains',
    name: 'Grains & Breads',
    icon: '🍞',
    colorClass: 'bg-amber-600 text-white',
    bgGradient: 'from-amber-50 to-yellow-50',
    borderClass: 'border-amber-300',
    items: [
      { name: 'Bread', emoji: '🍞' },
      { name: 'Rice', emoji: '🍚' },
      { name: 'Pasta', emoji: '🍝' },
      { name: 'Croissant', emoji: '🥐' },
      { name: 'Pretzel', emoji: '🥨' },
      { name: 'Bagel', emoji: '🥯' },
      { name: 'Pancake', emoji: '🥞' },
      { name: 'Waffle', emoji: '🧇' }
    ]
  },
  {
    id: 'proteins',
    name: 'Healthy Proteins',
    icon: '🍗',
    colorClass: 'bg-orange-600 text-white',
    bgGradient: 'from-orange-50 to-amber-50',
    borderClass: 'border-orange-300',
    items: [
      { name: 'Chicken', emoji: '🍗' },
      { name: 'Steak', emoji: '🥩' },
      { name: 'Fish', emoji: '🐟' },
      { name: 'Eggs', emoji: '🥚' },
      { name: 'Shrimp', emoji: '🦐' },
      { name: 'Beans', emoji: '🫘' },
      { name: 'Peanut', emoji: '🥜' },
      { name: 'Bacon', emoji: '🥓' }
    ]
  },
  {
    id: 'dairy',
    name: 'Creamy Dairy',
    icon: '🥛',
    colorClass: 'bg-sky-600 text-white',
    bgGradient: 'from-sky-50 to-blue-50',
    borderClass: 'border-sky-300',
    items: [
      { name: 'Milk', emoji: '🥛' },
      { name: 'Cheese', emoji: '🧀' },
      { name: 'Butter', emoji: '🧈' },
      { name: 'Yogurt', emoji: '🍦' },
      { name: 'Ice Cream', emoji: '🍨' },
      { name: 'Pudding', emoji: '🍮' }
    ]
  }
];

const DIFFICULTY_CONFIG = [
  { groupIds: ['fruits', 'veggies'], itemsPerGroup: 3, label: 'Easy (Fruits vs Veggies)' },
  { groupIds: ['grains', 'proteins'], itemsPerGroup: 4, label: 'Medium (Grains vs Proteins)' },
  { groupIds: ['fruits', 'veggies', 'grains'], itemsPerGroup: 3, label: 'Hard (3 Groups)' },
  { groupIds: ['fruits', 'veggies', 'grains', 'dairy'], itemsPerGroup: 3, label: 'Expert (4 Groups)' },
  { groupIds: ['fruits', 'veggies', 'grains', 'proteins', 'dairy'], itemsPerGroup: 3, label: 'Master (All 5 Groups)' },
];

export default {
  id: 'food-groups',
  name: 'Food Groups Sort',

  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  currentLevel: 1,
  isPlaying: false,
  timer: null as Timer | null,
  score: null as Score | null,
  queue: [] as FoodItem[],
  totalCount: 0,
  sortedCount: 0,
  currentCardEl: null as HTMLElement | null,
  currentModal: null as HTMLElement | null,

  init(api: EngineAPI): void {
    this.api = api;
    this.container = api.getContainer();
    this.buildMenu();
  },

  start(): void {
    this.isPlaying = true;
    this.startGame(this.currentLevel);
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
    this.queue = [];
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
      'bg-gradient-to-r', 'from-rose-500', 'via-amber-500', 'to-emerald-500',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🥗 Food Groups Sort!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Learn healthy eating habits by sorting yummy foods into their nutritional food groups!';
    menu.appendChild(subtitle);

    // Difficulty selector
    const diffSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const diffLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    diffLabel.textContent = 'Choose Difficulty';
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
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-rose-500', 'via-amber-500', 'to-emerald-500',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🍎 Start Sorting!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.startGame(this.currentLevel);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(level: number): void {
    if (!this.api || !this.container) return;

    this.currentLevel = level || 1;
    const config = DIFFICULTY_CONFIG[this.currentLevel - 1] || DIFFICULTY_CONFIG[0];
    const activeGroups = ALL_FOOD_GROUPS.filter(g => config.groupIds.includes(g.id));

    this.container.innerHTML = '';
    this.sortedCount = 0;

    // Generate Food Task Queue
    const tasks: FoodItem[] = [];
    let tid = 0;
    activeGroups.forEach(group => {
      const chosen = shuffle([...group.items]).slice(0, config.itemsPerGroup);
      chosen.forEach(item => {
        tasks.push({
          id: `food_${tid++}`,
          name: item.name,
          emoji: item.emoji,
          groupId: group.id
        });
      });
    });

    this.queue = shuffle(tasks);
    this.totalCount = this.queue.length;

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

    this.isPlaying = true;
    this.timer = new Timer(this.api);
    header.appendChild(this.timer.element);
    this.timer.start();

    this.container.appendChild(header);

    // Main Area
    const mainArea = this.api.createElement('div', [
      'w-full', 'max-w-2xl', 'mx-auto', 'px-4', 'flex', 'flex-col', 'gap-4'
    ]);

    // Level indicator
    const levelBadge = this.api.createElement('div', ['text-center', 'mb-1']);
    const levelText = this.api.createElement('span', [
      'inline-block', 'px-4', 'py-1', 'bg-rose-100', 'text-rose-800', 'font-black', 'rounded-full', 'text-xs'
    ]);
    levelText.textContent = `Level ${this.currentLevel}: ${config.label} 🎯`;
    levelBadge.appendChild(levelText);
    mainArea.appendChild(levelBadge);

    // Progress Bar
    const progressWrap = this.api.createElement('div', ['w-full', 'bg-gray-200', 'rounded-full', 'h-3', 'overflow-hidden']);
    const progressBar = this.api.createElement('div', ['bg-rose-500', 'h-full', 'transition-all', 'duration-300']);
    progressBar.style.width = '0%';
    progressWrap.appendChild(progressBar);
    mainArea.appendChild(progressWrap);

    // Current Food Spotlight Card
    const spotlightContainer = this.api.createElement('div', [
      'flex', 'flex-col', 'items-center', 'justify-center', 'py-2'
    ]);

    const countLabel = this.api.createElement('span', [
      'text-gray-500', 'font-extrabold', 'text-xs', 'uppercase', 'tracking-widest', 'mb-2'
    ]);
    countLabel.textContent = `Food 1 of ${this.totalCount}`;
    spotlightContainer.appendChild(countLabel);

    this.currentCardEl = this.api.createElement('div', [
      'w-32', 'h-32', 'bg-white', 'rounded-3xl', 'shadow-2xl',
      'border-4', 'border-rose-300', 'flex', 'flex-col', 'items-center', 'justify-center',
      'gap-1', 'select-none', 'animate-pop'
    ]);
    spotlightContainer.appendChild(this.currentCardEl);
    mainArea.appendChild(spotlightContainer);

    // Food Group Target Baskets
    const groupGrid = this.api.createElement('div', ['grid', 'gap-3', 'w-full']);
    const cols = activeGroups.length === 2 ? 2 : (activeGroups.length === 3 ? 3 : (activeGroups.length === 4 ? 2 : 3));
    groupGrid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    activeGroups.forEach(group => {
      const groupCard = this.api!.createElement('button', [
        'bg-gradient-to-br', ...group.bgGradient.split(' '), 'rounded-3xl', 'p-4', 'border-4', ...group.borderClass.split(' '),
        'shadow-lg', 'flex', 'flex-col', 'items-center', 'justify-center', 'gap-1',
        'transition-all', 'duration-150', 'hover:scale-105', 'active:scale-95', 'cursor-pointer'
      ]);

      const iconEl = this.api!.createElement('span', ['text-4xl']);
      iconEl.textContent = group.icon;
      groupCard.appendChild(iconEl);

      const nameEl = this.api!.createElement('span', ['font-black', 'text-gray-800', 'text-base']);
      nameEl.textContent = group.name;
      groupCard.appendChild(nameEl);

      const actionBadge = this.api!.createElement('span', [
        'mt-1', 'px-3', 'py-1', 'rounded-full', 'text-xs', 'font-bold', ...group.colorClass.split(' ')
      ]);
      actionBadge.textContent = 'Sort Here';
      groupCard.appendChild(actionBadge);

      this.api!.onTap(groupCard, () => {
        this.handleGroupTap(group.id, groupCard, progressBar, countLabel);
      });

      groupGrid.appendChild(groupCard);
    });

    mainArea.appendChild(groupGrid);
    this.container.appendChild(mainArea);

    this.renderCurrentFood(countLabel);
  },

  renderCurrentFood(labelEl: HTMLElement): void {
    if (!this.currentCardEl || this.queue.length === 0) return;
    const current = this.queue[0];
    this.currentCardEl.innerHTML = `
      <span class="text-5xl sm:text-6xl">${current.emoji}</span>
      <span class="text-xs font-black text-gray-700">${current.name}</span>
    `;
    labelEl.textContent = `Food ${this.sortedCount + 1} of ${this.totalCount}`;
    this.api?.pop(this.currentCardEl);
  },

  async handleGroupTap(
    groupId: string,
    groupCard: HTMLElement,
    progressBar: HTMLElement,
    countLabel: HTMLElement
  ): Promise<void> {
    if (!this.api || this.queue.length === 0 || !this.currentCardEl) return;

    const current = this.queue[0];
    this.score?.addMove();

    if (current.groupId === groupId) {
      // Correct Group!
      this.api.playSound('match');
      this.score?.addMatch(30);
      this.sortedCount++;

      const pct = Math.round((this.sortedCount / this.totalCount) * 100);
      progressBar.style.width = `${pct}%`;

      await this.api.pop(groupCard);
      this.queue.shift();

      if (this.queue.length === 0) {
        await this.handleWin();
      } else {
        this.renderCurrentFood(countLabel);
      }
    } else {
      // Wrong Food Group
      this.api.playSound('error');
      await this.api.shake(groupCard);
      if (this.container) await this.api.shake(this.container);
    }
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;

    const bestScore = this.api.load<number>('food_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('food_best', finalScore);
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
    icon.textContent = '👨‍🍳';
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-rose-600', 'mb-2']);
    title.textContent = 'Master Nutritionist!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-rose-50 rounded-xl">
        <span class="text-rose-800">⭐ Score</span>
        <span class="font-black text-rose-700">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-rose-50 rounded-xl">
        <span class="text-rose-800">🔄 Total Tries</span>
        <span class="font-black text-rose-700">${moves}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-rose-50 rounded-xl">
        <span class="text-rose-800">⏱️ Time</span>
        <span class="font-black text-rose-700">${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}</span>
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
        this.startGame(nextLevelNum);
      });
      btnCol.appendChild(nextBtn);
    }

    const btnRow = this.api.createElement('div', ['flex', 'gap-3', 'justify-center']);

    const replayBtn = this.api.createElement('button', [
      'flex-1', 'py-3', 'bg-rose-600', 'text-white', 'font-bold', 'rounded-2xl',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer'
    ]);
    replayBtn.textContent = '🔄 Replay';
    this.api.onTap(replayBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
      this.currentModal = null;
      this.startGame(this.currentLevel);
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
        level: this.currentLevel
      }
    };
  },

  deserialize(state: any): void {
    if (state.data) {
      this.currentLevel = state.data.level || 1;
    }
  }
} as GameModule;
