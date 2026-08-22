import type { GameModule, EngineAPI } from '../../core/types';
import { shuffle } from '../../core/utils';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

const THEMES = {
  animals: ['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🦁','🐮','🐷','🐸','🐵'],
  vehicles: ['🚗','🚀','✈️','🚢','🚁','🚂','🚜','🚒','🚑','🚓','⛵','🚲'],
  dinosaurs: ['🦖','🦕','🐙','🐬','🐳','🦋','🐝','🐞','🦄','🦚','🦉','🦀'],
  fruits: ['🍎','🍌','🍇','🍓','🍉','🍒','🍍','🥝','🥑','🌽','🥕','🍕']
};

const DIFFICULTY_CONFIG = [
  { pairs: 3, label: '3 Pairs (Easy)' },
  { pairs: 4, label: '4 Pairs (Medium)' },
  { pairs: 5, label: '5 Pairs (Hard)' },
  { pairs: 6, label: '6 Pairs (Expert)' },
  { pairs: 8, label: '8 Pairs (Master)' },
];

interface ShadowSlot {
  emoji: string;
  isMatched: boolean;
  element: HTMLElement;
  emojiEl: HTMLElement;
}

interface ItemCard {
  id: number;
  emoji: string;
  isMatched: boolean;
  element: HTMLElement;
}

export default {
  id: 'shadow-matching',
  name: 'Shadow Match',

  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  currentLevel: 1,
  currentTheme: 'animals' as keyof typeof THEMES,
  isPlaying: false,
  timer: null as Timer | null,
  score: null as Score | null,
  selectedItem: null as ItemCard | null,
  shadowSlots: [] as ShadowSlot[],
  itemCards: [] as ItemCard[],
  currentModal: null as HTMLElement | null,

  init(api: EngineAPI): void {
    this.api = api;
    this.container = api.getContainer();
    this.buildMenu();
  },

  start(level?: number): void {
    this.isPlaying = true;
    if (typeof level === 'number') this.currentLevel = level;
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
    this.shadowSlots = [];
    this.itemCards = [];
    this.selectedItem = null;
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
      'bg-gradient-to-r', 'from-pink-500', 'via-purple-500', 'to-indigo-500',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🌓 Shadow Match!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Look at the mysterious dark silhouettes and match each colorful item to its shadow!';
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
        btn.classList.add('bg-purple-500', 'text-white', 'border-purple-600', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-purple-400');
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
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-pink-500', 'to-purple-600',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🎮 Match Shadows!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.startGame(this.currentLevel, this.currentTheme);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(level: number, theme?: keyof typeof THEMES): void {
    if (!this.api || !this.container) return;

    this.currentLevel = level || 1;
    const safeTheme = (theme && THEMES[theme as keyof typeof THEMES]) ? (theme as keyof typeof THEMES) : (this.currentTheme && THEMES[this.currentTheme] ? this.currentTheme : 'animals');
    this.currentTheme = safeTheme;

    const config = DIFFICULTY_CONFIG[this.currentLevel - 1] || DIFFICULTY_CONFIG[0];
    this.container.innerHTML = '';
    this.shadowSlots = [];
    this.itemCards = [];
    this.selectedItem = null;

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

    // Pick random items for this game
    const selectedEmojis = shuffle([...THEMES[safeTheme]]).slice(0, config.pairs);
    const shadowOrder = shuffle([...selectedEmojis]);
    const itemOrder = shuffle([...selectedEmojis]);

    // Game Board Container
    const mainWrapper = this.api.createElement('div', [
      'w-full', 'max-w-2xl', 'mx-auto', 'px-4', 'flex', 'flex-col', 'gap-6'
    ]);

    // Top Section: Shadows Shelf
    const shadowShelf = this.api.createElement('div', [
      'bg-slate-800/90', 'backdrop-blur', 'rounded-3xl', 'p-5', 'shadow-xl',
      'border-4', 'border-slate-700/50'
    ]);
    const shadowTitle = this.api.createElement('div', [
      'text-center', 'text-slate-300', 'font-extrabold', 'text-sm', 'uppercase', 'tracking-widest', 'mb-3'
    ]);
    shadowTitle.textContent = '🌑 Find Matching Shadows';
    shadowShelf.appendChild(shadowTitle);

    const shadowGrid = this.api.createElement('div', [
      'grid', 'gap-3', 'justify-center', 'items-center'
    ]);
    const cols = config.pairs > 4 ? 4 : config.pairs;
    shadowGrid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    shadowOrder.forEach(emoji => {
      const slotCard = this.api.createElement('button', [
        'aspect-square', 'bg-slate-900/80', 'rounded-2xl', 'border-3', 'border-slate-600',
        'flex', 'items-center', 'justify-center', 'text-4xl', 'sm:text-5xl',
        'transition-all', 'duration-300', 'cursor-pointer', 'shadow-inner', 'p-2'
      ]);

      const emojiSpan = this.api.createElement('span', ['transition-all', 'duration-300']);
      emojiSpan.textContent = emoji;
      // Silhouette filter
      emojiSpan.style.filter = 'brightness(0) drop-shadow(0 2px 4px rgba(0,0,0,0.5)) opacity(0.75)';
      slotCard.appendChild(emojiSpan);

      const slotData: ShadowSlot = {
        emoji,
        isMatched: false,
        element: slotCard,
        emojiEl: emojiSpan
      };

      this.api?.onTap(slotCard, () => {
        this.handleShadowTap(slotData);
      });

      this.shadowSlots.push(slotData);
      shadowGrid.appendChild(slotCard);
    });
    shadowShelf.appendChild(shadowGrid);
    mainWrapper.appendChild(shadowShelf);

    // Bottom Section: Color Items Tray
    const itemsTray = this.api.createElement('div', [
      'bg-white/80', 'backdrop-blur', 'rounded-3xl', 'p-5', 'shadow-xl',
      'border-4', 'border-white'
    ]);
    const itemsTitle = this.api.createElement('div', [
      'text-center', 'text-gray-500', 'font-extrabold', 'text-sm', 'uppercase', 'tracking-widest', 'mb-3'
    ]);
    itemsTitle.textContent = '🌈 Tap an item, then tap its shadow';
    itemsTray.appendChild(itemsTitle);

    const itemsGrid = this.api.createElement('div', [
      'grid', 'gap-3', 'justify-center', 'items-center'
    ]);
    itemsGrid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    itemOrder.forEach((emoji, idx) => {
      const itemCardEl = this.api.createElement('button', [
        'aspect-square', 'bg-gradient-to-br', 'from-pink-100', 'to-purple-100',
        'rounded-2xl', 'border-3', 'border-purple-200', 'flex', 'items-center', 'justify-center',
        'text-4xl', 'sm:text-5xl', 'transition-all', 'duration-200', 'cursor-pointer',
        'shadow-md', 'hover:scale-105', 'active:scale-95', 'p-2'
      ]);
      itemCardEl.textContent = emoji;

      const cardData: ItemCard = {
        id: idx,
        emoji,
        isMatched: false,
        element: itemCardEl
      };

      this.api?.onTap(itemCardEl, () => {
        this.handleItemTap(cardData);
      });

      this.itemCards.push(cardData);
      itemsGrid.appendChild(itemCardEl);
    });

    itemsTray.appendChild(itemsGrid);
    mainWrapper.appendChild(itemsTray);

    this.container.appendChild(mainWrapper);
  },

  handleItemTap(item: ItemCard): void {
    if (!this.api || item.isMatched) return;

    if (!this.isPlaying && this.timer) {
      this.isPlaying = true;
      this.timer.start();
    }

    this.api.playSound('click');

    // Deselect existing
    this.itemCards.forEach(c => {
      if (!c.isMatched) {
        c.element.classList.remove('ring-4', 'ring-purple-500', 'scale-110', 'bg-purple-200');
      }
    });

    if (this.selectedItem === item) {
      this.selectedItem = null;
      return;
    }

    this.selectedItem = item;
    item.element.classList.add('ring-4', 'ring-purple-500', 'scale-110', 'bg-purple-200');
    this.api.pop(item.element);
  },

  async handleShadowTap(slot: ShadowSlot): Promise<void> {
    if (!this.api || slot.isMatched || !this.selectedItem) return;

    const item = this.selectedItem;
    this.score?.addMove();

    if (item.emoji === slot.emoji) {
      // MATCH!
      slot.isMatched = true;
      item.isMatched = true;
      this.selectedItem = null;

      this.api.playSound('match');
      const timeBonus = Math.max(0, 40 - (this.timer?.getTime() || 0));
      this.score?.addMatch(timeBonus);

      // Reveal full color on shadow slot
      slot.element.className = 'aspect-square bg-emerald-500/20 rounded-2xl border-4 border-emerald-400 flex items-center justify-center text-4xl sm:text-5xl shadow-lg transition-all duration-300';
      slot.emojiEl.style.filter = 'none';
      await this.api.pop(slot.element);

      // Hide matched item card
      item.element.className = 'aspect-square bg-gray-100/50 rounded-2xl border-2 border-dashed border-gray-300 opacity-20 pointer-events-none flex items-center justify-center text-2xl';
      item.element.textContent = '✨';

      // Check for win
      if (this.shadowSlots.every(s => s.isMatched)) {
        await this.api.delay(400);
        await this.handleWin();
      }
    } else {
      // MISMATCH
      this.api.playSound('error');
      await Promise.all([
        this.api.shake(item.element),
        this.api.shake(slot.element)
      ]);
      item.element.classList.remove('ring-4', 'ring-purple-500', 'scale-110', 'bg-purple-200');
      this.selectedItem = null;
    }
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;

    const bestScore = this.api.load<number>('shadow_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('shadow_best', finalScore);
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
    icon.textContent = '🌟';
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-purple-600', 'mb-2']);
    title.textContent = 'Shadows Solved!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-purple-50 rounded-xl">
        <span class="text-purple-800">⭐ Score</span>
        <span class="font-black text-purple-700">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-purple-50 rounded-xl">
        <span class="text-purple-800">🔄 Moves</span>
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
        this.startGame(nextLevelNum, this.currentTheme);
      });
      btnCol.appendChild(nextBtn);
    }

    const btnRow = this.api.createElement('div', ['flex', 'gap-3', 'justify-center']);

    const replayBtn = this.api.createElement('button', [
      'flex-1', 'py-3', 'bg-purple-600', 'text-white', 'font-bold', 'rounded-2xl',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer'
    ]);
    replayBtn.textContent = '🔄 Replay';
    this.api.onTap(replayBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
      this.currentModal = null;
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
        theme: this.currentTheme
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
