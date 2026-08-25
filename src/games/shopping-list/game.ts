import type { GameModule, EngineAPI } from '../../core/types';
import { shuffle } from '../../core/utils';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

interface ItemInfo {
  id: string;
  name: string;
  emoji: string;
}

interface StoreTheme {
  id: string;
  name: string;
  icon: string;
  badgeColor: string;
  shelfBg: string;
  items: ItemInfo[];
}

const STORE_THEMES: StoreTheme[] = [
  {
    id: 'grocery',
    name: 'Fresh Market',
    icon: '🍎',
    badgeColor: 'bg-emerald-600',
    shelfBg: 'from-emerald-50 to-teal-50',
    items: [
      { id: 'apple', name: 'Apple', emoji: '🍎' },
      { id: 'banana', name: 'Banana', emoji: '🍌' },
      { id: 'carrot', name: 'Carrot', emoji: '🥕' },
      { id: 'broccoli', name: 'Broccoli', emoji: '🥦' },
      { id: 'milk', name: 'Milk', emoji: '🥛' },
      { id: 'bread', name: 'Bread', emoji: '🍞' },
      { id: 'cheese', name: 'Cheese', emoji: '🧀' },
      { id: 'eggs', name: 'Eggs', emoji: '🥚' },
      { id: 'grapes', name: 'Grapes', emoji: '🍇' },
      { id: 'orange', name: 'Orange', emoji: '🍊' },
      { id: 'corn', name: 'Sweet Corn', emoji: '🌽' },
      { id: 'avocado', name: 'Avocado', emoji: '🥑' }
    ]
  },
  {
    id: 'bakery',
    name: 'Sweet Bakery',
    icon: '🧁',
    badgeColor: 'bg-pink-600',
    shelfBg: 'from-pink-50 to-rose-50',
    items: [
      { id: 'cupcake', name: 'Cupcake', emoji: '🧁' },
      { id: 'donut', name: 'Donut', emoji: '🍩' },
      { id: 'croissant', name: 'Croissant', emoji: '🥐' },
      { id: 'cookie', name: 'Cookie', emoji: '🍪' },
      { id: 'cake', name: 'Cake', emoji: '🍰' },
      { id: 'bagel', name: 'Bagel', emoji: '🥯' },
      { id: 'waffle', name: 'Waffle', emoji: '🧇' },
      { id: 'pie', name: 'Pie', emoji: '🥧' },
      { id: 'muffin', name: 'Muffin', emoji: '🥮' },
      { id: 'pancake', name: 'Pancake', emoji: '🥞' },
      { id: 'pretzel', name: 'Pretzel', emoji: '🥨' },
      { id: 'icecream', name: 'Ice Cream', emoji: '🍦' }
    ]
  },
  {
    id: 'toystore',
    name: 'Toy Paradise',
    icon: '🧸',
    badgeColor: 'bg-indigo-600',
    shelfBg: 'from-indigo-50 to-purple-50',
    items: [
      { id: 'teddy', name: 'Teddy Bear', emoji: '🧸' },
      { id: 'yoyo', name: 'Yo-Yo', emoji: '🪀' },
      { id: 'kite', name: 'Kite', emoji: '🪁' },
      { id: 'robot', name: 'Robot', emoji: '🤖' },
      { id: 'train', name: 'Train', emoji: '🚂' },
      { id: 'plane', name: 'Airplane', emoji: '✈️' },
      { id: 'ball', name: 'Soccer Ball', emoji: '⚽' },
      { id: 'dino', name: 'Dinosaur', emoji: '🦖' },
      { id: 'drum', name: 'Drum', emoji: '🥁' },
      { id: 'guitar', name: 'Guitar', emoji: '🎸' },
      { id: 'car', name: 'Toy Car', emoji: '🚗' },
      { id: 'rocket', name: 'Toy Rocket', emoji: '🚀' }
    ]
  },
  {
    id: 'picnic',
    name: 'Picnic Party',
    icon: '🍉',
    badgeColor: 'bg-amber-600',
    shelfBg: 'from-amber-50 to-yellow-50',
    items: [
      { id: 'watermelon', name: 'Watermelon', emoji: '🍉' },
      { id: 'juice', name: 'Juice Box', emoji: '🧃' },
      { id: 'sandwich', name: 'Sandwich', emoji: '🥪' },
      { id: 'pizza', name: 'Pizza', emoji: '🍕' },
      { id: 'lemonade', name: 'Lemonade', emoji: '🍋' },
      { id: 'cherries', name: 'Cherries', emoji: '🍒' },
      { id: 'strawberry', name: 'Strawberry', emoji: '🍓' },
      { id: 'popcorn', name: 'Popcorn', emoji: '🍿' },
      { id: 'burger', name: 'Burger', emoji: '🍔' },
      { id: 'hotdog', name: 'Hot Dog', emoji: '🌭' },
      { id: 'lollipop', name: 'Lollipop', emoji: '🍭' },
      { id: 'candy', name: 'Candy', emoji: '🍬' }
    ]
  }
];

const DIFFICULTY_CONFIG = [
  { listCount: 3, shelfCount: 6, previewSec: 5, label: 'Easy (3 Items, 5s Flash)' },
  { listCount: 4, shelfCount: 8, previewSec: 5, label: 'Medium (4 Items, 5s Flash)' },
  { listCount: 4, shelfCount: 9, previewSec: 4, label: 'Hard (4 Items, 4s Flash)' },
  { listCount: 5, shelfCount: 10, previewSec: 4, label: 'Expert (5 Items, 4s Flash)' },
  { listCount: 6, shelfCount: 12, previewSec: 3.5, label: 'Master (6 Items, 3.5s Flash)' },
];

const TOTAL_ROUNDS = 3;

export default {
  id: 'shopping-list',
  name: 'Shopping List',

  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  currentLevel: 1,
  currentStoreIdx: 0,
  currentRound: 1,
  isPlaying: false,
  timer: null as Timer | null,
  score: null as Score | null,
  targetItems: [] as ItemInfo[],
  remainingTargets: new Set<string>(),
  shelfItems: [] as ItemInfo[],
  isLocked: false,
  shelfButtons: [] as HTMLElement[],
  basketListEl: null as HTMLElement | null,
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
    this.startGame(this.currentLevel, this.currentStoreIdx);
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
    this.targetItems = [];
    this.remainingTargets.clear();
    this.shelfItems = [];
    this.shelfButtons = [];
    this.basketListEl = null;
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
      'bg-gradient-to-r', 'from-emerald-500', 'via-pink-500', 'to-amber-500',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🛒 Shopping List!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Memorize the items on the notepad before it slips into your pocket, then pick the exact items from the store shelves!';
    menu.appendChild(subtitle);

    // Store selector
    const storeSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const storeLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    storeLabel.textContent = 'Choose Store';
    storeSection.appendChild(storeLabel);

    const storeRow = this.api.createElement('div', ['flex', 'gap-3', 'flex-wrap', 'justify-center']);
    STORE_THEMES.forEach((store, idx) => {
      const btn = this.api!.createElement('button', [
        'px-4', 'py-2', 'rounded-2xl', 'font-bold', 'text-sm', 'transition-all',
        'border-3', 'cursor-pointer', 'flex', 'items-center', 'gap-1.5'
      ]);
      btn.innerHTML = `<span>${store.icon}</span> <span>${store.name}</span>`;

      if (idx === this.currentStoreIdx) {
        btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-700', 'scale-105', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-emerald-400');
      }

      this.api!.onTap(btn, () => {
        this.currentStoreIdx = idx;
        this.api?.playSound('click');
        this.buildMenu();
      });
      storeRow.appendChild(btn);
    });
    storeSection.appendChild(storeRow);
    menu.appendChild(storeSection);

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
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-emerald-500', 'via-teal-500', 'to-amber-500',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🛍️ Start Shopping!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.currentRound = 1;
      this.startGame(this.currentLevel, this.currentStoreIdx);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(level: number, storeIdx?: number): void {
    if (!this.api || !this.container) return;

    this.currentLevel = level || 1;
    this.currentRound = 1;
    this.currentStoreIdx = (typeof storeIdx === 'number' && STORE_THEMES[storeIdx]) ? storeIdx : (this.currentStoreIdx || 0);

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

    this.isPlaying = true;
    this.timer = new Timer(this.api);
    header.appendChild(this.timer.element);
    this.timer.start();

    this.container.appendChild(header);

    const mainView = this.api.createElement('div', [
      'w-full', 'max-w-2xl', 'mx-auto', 'px-4', 'flex', 'flex-col', 'gap-5', 'items-center'
    ]);
    this.container.appendChild(mainView);

    this.startRound(mainView);
  },

  async startRound(mainView: HTMLElement): Promise<void> {
    if (!this.api) return;

    const config = DIFFICULTY_CONFIG[this.currentLevel - 1] || DIFFICULTY_CONFIG[0];
    const store = STORE_THEMES[this.currentStoreIdx] || STORE_THEMES[0];

    // Pick target items from store
    const shuffledStoreItems = shuffle([...store.items]);
    this.targetItems = shuffledStoreItems.slice(0, config.listCount);
    this.remainingTargets = new Set(this.targetItems.map(i => i.id));

    // Fill the rest of the shelf with distractors
    const remainingStore = shuffledStoreItems.slice(config.listCount);
    const distractorCount = config.shelfCount - config.listCount;
    const distractors = remainingStore.slice(0, distractorCount);

    this.shelfItems = shuffle([...this.targetItems, ...distractors]);
    this.shelfButtons = [];
    this.isLocked = true;

    mainView.innerHTML = '';

    // Status Banner
    const statusWrapper = this.api.createElement('div', ['flex', 'items-center', 'justify-between', 'w-full', 'px-2']);
    const roundBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-emerald-100', 'text-emerald-800', 'rounded-full', 'font-bold', 'text-sm'
    ]);
    roundBadge.textContent = `Round ${this.currentRound} of ${TOTAL_ROUNDS} 🎯`;
    statusWrapper.appendChild(roundBadge);

    const promptBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-amber-100', 'text-amber-800', 'rounded-full', 'font-extrabold', 'text-sm', 'animate-pulse'
    ]);
    promptBadge.textContent = `📝 Memorize List! ⏳ ${config.previewSec}s`;
    statusWrapper.appendChild(promptBadge);
    mainView.appendChild(statusWrapper);

    // ============================================
    // PHASE 1: Shopping Notepad View (Memorize)
    // ============================================
    const noteCard = this.api.createElement('div', [
      'w-full', 'max-w-md', 'bg-amber-50', 'rounded-3xl', 'p-6', 'sm:p-8', 'shadow-2xl',
      'border-4', 'border-amber-200', 'flex', 'flex-col', 'items-center', 'gap-4',
      'relative', 'overflow-hidden', 'transition-all', 'duration-500'
    ]);

    // Notepad clip
    const clip = this.api.createElement('div', [
      'w-24', 'h-5', 'bg-amber-400', 'rounded-full', 'shadow-md', '-mt-3', 'mb-1'
    ]);
    noteCard.appendChild(clip);

    const noteTitle = this.api.createElement('h2', ['text-2xl', 'font-black', 'text-amber-900', 'tracking-wide']);
    noteTitle.innerHTML = `📝 Mom's Shopping List`;
    noteCard.appendChild(noteTitle);

    const listGrid = this.api.createElement('div', ['grid', 'grid-cols-2', 'gap-3', 'w-full']);
    this.targetItems.forEach(item => {
      const row = this.api!.createElement('div', [
        'flex', 'items-center', 'gap-3', 'p-3', 'bg-white', 'rounded-2xl',
        'border-2', 'border-amber-200', 'shadow-sm'
      ]);
      row.innerHTML = `
        <span class="text-3xl">${item.emoji}</span>
        <span class="font-black text-gray-800 text-sm sm:text-base">${item.name}</span>
      `;
      listGrid.appendChild(row);
    });
    noteCard.appendChild(listGrid);
    mainView.appendChild(noteCard);

    // Countdown interval
    let timeLeft = config.previewSec;
    const intervalId = window.setInterval(() => {
      timeLeft -= 1;
      if (timeLeft > 0) {
        promptBadge.textContent = `📝 Memorize List! ⏳ ${timeLeft}s`;
      } else {
        window.clearInterval(intervalId);
      }
    }, 1000);

    this.api.playSound('flip');
    await this.api.delay(config.previewSec * 1000);
    window.clearInterval(intervalId);

    // Notepad flips away (Pocketed!)
    await this.api.animate(noteCard, [
      { transform: 'translateY(0) scale(1)', opacity: '1' },
      { transform: 'translateY(40px) scale(0.8)', opacity: '0' }
    ], { duration: 350 });

    noteCard.remove();

    // ============================================
    // PHASE 2: Supermarket Shelves & Cart View
    // ============================================
    promptBadge.className = 'px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-sm';
    promptBadge.textContent = `🛒 Pick from Shelves (${this.remainingTargets.size} left)!`;
    this.api.playSound('pop');

    // Supermarket Shelf Container
    const shelfCard = this.api.createElement('div', [
      'w-full', 'max-w-xl', 'bg-white/95', 'backdrop-blur', 'rounded-3xl', 'p-6',
      'shadow-2xl', 'border-4', 'border-emerald-200', 'flex', 'flex-col', 'gap-4', 'animate-pop'
    ]);

    const shelfHeader = this.api.createElement('div', ['flex', 'items-center', 'justify-between']);
    shelfHeader.innerHTML = `
      <span class="text-xs font-black text-gray-500 uppercase tracking-wider">🏪 Supermarket Shelves</span>
      <span class="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">${store.name}</span>
    `;
    shelfCard.appendChild(shelfHeader);

    // Shelf Grid
    const shelfGrid = this.api.createElement('div', ['grid', 'grid-cols-3', 'sm:grid-cols-4', 'gap-3', 'w-full']);

    this.shelfItems.forEach(item => {
      const itemBtn = this.api!.createElement('button', [
        'aspect-square', 'bg-gray-50', 'hover:bg-white', 'rounded-2xl', 'border-3',
        'border-gray-200', 'hover:border-emerald-400', 'flex', 'flex-col', 'items-center',
        'justify-center', 'gap-1', 'shadow-sm', 'hover:shadow-md', 'transition-all',
        'cursor-pointer', 'select-none', 'hover:scale-105', 'active:scale-95'
      ]);

      itemBtn.innerHTML = `
        <span class="text-3xl sm:text-4xl pointer-events-none">${item.emoji}</span>
        <span class="text-2xs sm:text-xs font-bold text-gray-700 pointer-events-none text-center truncate px-1">${item.name}</span>
      `;

      this.api!.onTap(itemBtn, () => {
        this.handleShelfItemTap(item, itemBtn, promptBadge, mainView);
      });

      this.shelfButtons.push(itemBtn);
      shelfGrid.appendChild(itemBtn);
    });
    shelfCard.appendChild(shelfGrid);
    mainView.appendChild(shelfCard);

    // Shopping Basket Bar
    const basketCard = this.api.createElement('div', [
      'w-full', 'max-w-xl', 'bg-gradient-to-r', 'from-emerald-500', 'to-teal-600',
      'rounded-3xl', 'p-4', 'shadow-lg', 'text-white', 'flex', 'items-center',
      'justify-between', 'gap-4', 'animate-pop'
    ]);

    const basketLeft = this.api.createElement('div', ['flex', 'items-center', 'gap-2']);
    basketLeft.innerHTML = `<span class="text-3xl">🛒</span> <span class="font-black text-sm sm:text-base">Your Cart</span>`;
    basketCard.appendChild(basketLeft);

    this.basketListEl = this.api.createElement('div', ['flex', 'items-center', 'gap-2', 'flex-wrap', 'justify-end']);
    basketCard.appendChild(this.basketListEl);

    mainView.appendChild(basketCard);
    this.isLocked = false;
  },

  async handleShelfItemTap(
    item: ItemInfo,
    itemBtn: HTMLElement,
    promptBadge: HTMLElement,
    mainView: HTMLElement
  ): Promise<void> {
    if (this.isLocked || !this.api) return;

    this.score?.addMove();

    if (this.remainingTargets.has(item.id)) {
      // CORRECT ITEM PICKED!
      this.remainingTargets.delete(item.id);
      this.score?.addMatch(35);
      this.api.playSound('match');

      // Style item as collected
      itemBtn.className = 'aspect-square bg-emerald-100 rounded-2xl border-4 border-emerald-500 flex flex-col items-center justify-center gap-1 shadow-inner opacity-70 pointer-events-none cursor-default';
      itemBtn.innerHTML = `
        <span class="text-3xl sm:text-4xl">${item.emoji}</span>
        <span class="text-2xs font-black text-emerald-800">✅ Picked</span>
      `;
      await this.api.pop(itemBtn);

      // Add mini badge to basket
      if (this.basketListEl) {
        const badge = this.api.createElement('span', [
          'px-2.5', 'py-1', 'bg-white/20', 'backdrop-blur', 'rounded-xl',
          'text-base', 'font-black', 'flex', 'items-center', 'gap-1', 'animate-pop'
        ]);
        badge.textContent = item.emoji;
        this.basketListEl.appendChild(badge);
      }

      if (this.remainingTargets.size === 0) {
        // ROUND COMPLETE!
        this.isLocked = true;
        promptBadge.className = 'px-4 py-1.5 bg-emerald-500 text-white rounded-full font-black text-sm animate-bounce-slow';
        promptBadge.textContent = '⭐ List Complete! Awesome Shopping!';

        await this.api.delay(800);

        if (this.currentRound >= TOTAL_ROUNDS) {
          await this.handleWin();
        } else {
          this.currentRound++;
          this.startRound(mainView);
        }
      } else {
        promptBadge.textContent = `🛒 Pick from Shelves (${this.remainingTargets.size} left)!`;
      }
    } else {
      // WRONG ITEM (Not on shopping list)
      this.api.playSound('error');
      await this.api.shake(itemBtn);

      promptBadge.className = 'px-4 py-1.5 bg-rose-100 text-rose-800 rounded-full font-black text-sm';
      promptBadge.textContent = `❌ ${item.name} is not on our list!`;

      await this.api.delay(600);
      promptBadge.className = 'px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-sm';
      promptBadge.textContent = `🛒 Pick from Shelves (${this.remainingTargets.size} left)!`;
    }
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;
    const store = STORE_THEMES[this.currentStoreIdx] || STORE_THEMES[0];

    const bestScore = this.api.load<number>('shopping_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('shopping_best', finalScore);
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
    icon.textContent = '🛍️';
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-emerald-600', 'mb-2']);
    title.textContent = 'Master Shopper!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-emerald-50 rounded-xl">
        <span class="text-emerald-800">⭐ Score</span>
        <span class="font-black text-emerald-700">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-emerald-50 rounded-xl">
        <span class="text-emerald-800">🔄 Total Tries</span>
        <span class="font-black text-emerald-700">${moves}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-emerald-50 rounded-xl">
        <span class="text-emerald-800">⏱️ Time</span>
        <span class="font-black text-emerald-700">${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}</span>
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
        this.startGame(nextLevelNum, this.currentStoreIdx);
      });
      btnCol.appendChild(nextBtn);
    }

    const btnRow = this.api.createElement('div', ['flex', 'gap-3', 'justify-center']);

    const replayBtn = this.api.createElement('button', [
      'flex-1', 'py-3', 'bg-emerald-600', 'text-white', 'font-bold', 'rounded-2xl',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer'
    ]);
    replayBtn.textContent = '🔄 Replay';
    this.api.onTap(replayBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
      this.currentModal = null;
      this.currentRound = 1;
      this.startGame(this.currentLevel, this.currentStoreIdx);
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
        storeIdx: this.currentStoreIdx,
        round: this.currentRound
      }
    };
  },

  deserialize(state: any): void {
    if (state.data) {
      this.currentLevel = state.data.level || 1;
      this.currentStoreIdx = state.data.storeIdx || 0;
      this.currentRound = state.data.round || 1;
    }
  }
} as GameModule;
