import type { GameModule, EngineAPI } from '../../core/types';
import { shuffle } from '../../core/utils';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

interface Habitat {
  id: string;
  name: string;
  icon: string;
  colorClass: string;
  bgGradient: string;
  borderClass: string;
  animals: string[];
}

const ALL_HABITATS: Habitat[] = [
  {
    id: 'farm',
    name: 'Sunny Farm',
    icon: '🚜',
    colorClass: 'bg-amber-500 text-white',
    bgGradient: 'from-amber-50 to-orange-50',
    borderClass: 'border-amber-300',
    animals: ['🐮','🐷','🐔','🐴','🐑','🐶','🦆','🐐']
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    icon: '🌊',
    colorClass: 'bg-sky-500 text-white',
    bgGradient: 'from-sky-50 to-blue-50',
    borderClass: 'border-sky-300',
    animals: ['🐬','🐳','🐙','🦈','🦀','🐠','🐢','🦑']
  },
  {
    id: 'jungle',
    name: 'Wild Jungle',
    icon: '🌴',
    colorClass: 'bg-emerald-600 text-white',
    bgGradient: 'from-emerald-50 to-green-50',
    borderClass: 'border-emerald-300',
    animals: ['🦁','🐵','🐯','🐘','🦒','🦓','🦜','🐍']
  },
  {
    id: 'arctic',
    name: 'Snowy Arctic',
    icon: '❄️',
    colorClass: 'bg-cyan-600 text-white',
    bgGradient: 'from-cyan-50 to-slate-50',
    borderClass: 'border-cyan-300',
    animals: ['🐻‍❄️','🐧','🦭','🦊','🦌','🐺','🦉','🐇']
  },
  {
    id: 'desert',
    name: 'Sandy Desert',
    icon: '🏜️',
    colorClass: 'bg-yellow-600 text-white',
    bgGradient: 'from-yellow-50 to-amber-50',
    borderClass: 'border-yellow-300',
    animals: ['🐪','🦎','🦂','🦅','🐍','🐫','🦇','🐗']
  }
];

const DIFFICULTY_CONFIG = [
  { habitatIds: ['farm', 'ocean'], animalsPerHab: 3, label: 'Easy (2 Habitats: Farm & Ocean)' },
  { habitatIds: ['jungle', 'arctic'], animalsPerHab: 4, label: 'Medium (2 Habitats: Jungle & Arctic)' },
  { habitatIds: ['farm', 'ocean', 'jungle'], animalsPerHab: 4, label: 'Hard (3 Habitats)' },
  { habitatIds: ['farm', 'ocean', 'jungle', 'arctic'], animalsPerHab: 4, label: 'Expert (4 Habitats)' },
  { habitatIds: ['jungle', 'ocean', 'arctic', 'desert'], animalsPerHab: 5, label: 'Master (4 Habitats + Desert)' },
];

interface AnimalTask {
  id: number;
  emoji: string;
  habitatId: string;
}

export default {
  id: 'habitat-sort',
  name: 'Habitat Sort',

  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  currentLevel: 1,
  isPlaying: false,
  timer: null as Timer | null,
  score: null as Score | null,
  queue: [] as AnimalTask[],
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
      'bg-gradient-to-r', 'from-emerald-500', 'via-sky-500', 'to-amber-500',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🌴 Habitat Sort!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Help cute animals find their natural homes: Farm, Ocean, Jungle, Arctic, or Desert!';
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
        btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-700', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200', 'hover:border-emerald-400');
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
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-emerald-500', 'to-teal-600',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🐾 Start Sorting!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.startGame(this.currentLevel);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(level: number): void {
    if (!this.api || !this.container) return;

    const config = DIFFICULTY_CONFIG[level - 1] || DIFFICULTY_CONFIG[0];
    const activeHabitats = ALL_HABITATS.filter(h => config.habitatIds.includes(h.id));

    this.container.innerHTML = '';
    this.sortedCount = 0;

    // Generate Animal Queue
    const tasks: AnimalTask[] = [];
    let tid = 0;
    activeHabitats.forEach(hab => {
      const chosen = shuffle([...hab.animals]).slice(0, config.animalsPerHab);
      chosen.forEach(emoji => {
        tasks.push({
          id: tid++,
          emoji,
          habitatId: hab.id
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

    // Progress Bar
    const progressWrap = this.api.createElement('div', ['w-full', 'bg-gray-200', 'rounded-full', 'h-3', 'overflow-hidden']);
    const progressBar = this.api.createElement('div', ['bg-emerald-500', 'h-full', 'transition-all', 'duration-300']);
    progressBar.style.width = '0%';
    progressWrap.appendChild(progressBar);
    mainArea.appendChild(progressWrap);

    // Current Animal Spotlight
    const spotlightContainer = this.api.createElement('div', [
      'flex', 'flex-col', 'items-center', 'justify-center', 'py-2'
    ]);

    const countLabel = this.api.createElement('span', [
      'text-gray-500', 'font-extrabold', 'text-xs', 'uppercase', 'tracking-widest', 'mb-2'
    ]);
    countLabel.textContent = `Animal 1 of ${this.totalCount}`;
    spotlightContainer.appendChild(countLabel);

    this.currentCardEl = this.api.createElement('div', [
      'w-28', 'h-28', 'sm:w-32', 'sm:h-32', 'bg-white', 'rounded-3xl', 'shadow-2xl',
      'border-4', 'border-emerald-300', 'flex', 'items-center', 'justify-center',
      'text-6xl', 'sm:text-7xl', 'select-none', 'animate-pop'
    ]);
    spotlightContainer.appendChild(this.currentCardEl);
    mainArea.appendChild(spotlightContainer);

    // Habitats Basket Grid
    const habGrid = this.api.createElement('div', ['grid', 'gap-3', 'w-full']);
    const cols = activeHabitats.length === 2 ? 2 : (activeHabitats.length === 3 ? 3 : 2);
    habGrid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

    activeHabitats.forEach(hab => {
      const habBox = this.api!.createElement('button', [
        'bg-gradient-to-br', hab.bgGradient, 'rounded-3xl', 'p-4', 'border-4', hab.borderClass,
        'shadow-lg', 'flex', 'flex-col', 'items-center', 'justify-center', 'gap-1',
        'transition-all', 'duration-150', 'hover:scale-105', 'active:scale-95', 'cursor-pointer'
      ]);

      const iconEl = this.api!.createElement('span', ['text-4xl']);
      iconEl.textContent = hab.icon;
      habBox.appendChild(iconEl);

      const nameEl = this.api!.createElement('span', ['font-black', 'text-gray-800', 'text-base']);
      nameEl.textContent = hab.name;
      habBox.appendChild(nameEl);

      const actionBadge = this.api!.createElement('span', [
        'mt-1', 'px-3', 'py-1', 'rounded-full', 'text-xs', 'font-bold', ...hab.colorClass.split(' ')
      ]);
      actionBadge.textContent = 'Tap to Send Home';
      habBox.appendChild(actionBadge);

      this.api!.onTap(habBox, () => {
        this.handleHabitatTap(hab.id, habBox, progressBar, countLabel);
      });

      habGrid.appendChild(habBox);
    });

    mainArea.appendChild(habGrid);
    this.container.appendChild(mainArea);

    this.renderCurrentAnimal(countLabel);
  },

  renderCurrentAnimal(labelEl: HTMLElement): void {
    if (!this.currentCardEl || this.queue.length === 0) return;
    const current = this.queue[0];
    this.currentCardEl.textContent = current.emoji;
    labelEl.textContent = `Animal ${this.sortedCount + 1} of ${this.totalCount}`;
    this.api?.pop(this.currentCardEl);
  },

  async handleHabitatTap(
    habitatId: string,
    habBox: HTMLElement,
    progressBar: HTMLElement,
    countLabel: HTMLElement
  ): Promise<void> {
    if (!this.api || this.queue.length === 0 || !this.currentCardEl) return;

    if (!this.isPlaying && this.timer) {
      this.isPlaying = true;
      this.timer.start();
    }

    const current = this.queue[0];
    this.score?.addMove();

    if (current.habitatId === habitatId) {
      // CORRECT HABITAT
      this.api.playSound('match');
      this.score?.addMatch(40);
      this.sortedCount++;

      progressBar.style.width = `${(this.sortedCount / this.totalCount) * 100}%`;
      await this.api.pop(habBox);

      this.queue.shift();

      if (this.queue.length === 0) {
        // Complete!
        await this.api.delay(400);
        await this.handleWin();
      } else {
        this.renderCurrentAnimal(countLabel);
      }
    } else {
      // WRONG HABITAT
      this.api.playSound('error');
      await this.api.shake(habBox);
    }
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;

    const bestScore = this.api.load<number>('habitat_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('habitat_best', finalScore);
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
    icon.textContent = '🦁';
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-emerald-600', 'mb-2']);
    title.textContent = 'Animals Saved!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-emerald-50 rounded-xl">
        <span class="text-emerald-800">⭐ Score</span>
        <span class="font-black text-emerald-600">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-emerald-50 rounded-xl">
        <span class="text-emerald-800">🎯 Correct Sorts</span>
        <span class="font-black text-emerald-600">${this.totalCount}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-emerald-50 rounded-xl">
        <span class="text-emerald-800">⏱️ Time</span>
        <span class="font-black text-emerald-600">${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}</span>
      </div>
    `;
    modal.appendChild(stats);

    const btnRow = this.api.createElement('div', ['flex', 'gap-3', 'justify-center']);

    const replayBtn = this.api.createElement('button', [
      'px-6', 'py-3', 'bg-emerald-600', 'text-white', 'font-bold', 'rounded-2xl',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer'
    ]);
    replayBtn.textContent = '🔄 Play Again';
    this.api.onTap(replayBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
      this.currentModal = null;
      this.startGame(this.currentLevel);
    });
    btnRow.appendChild(replayBtn);

    const menuBtn = this.api.createElement('button', [
      'px-6', 'py-3', 'bg-gray-100', 'text-gray-600', 'font-bold', 'rounded-2xl',
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

    modal.appendChild(btnRow);
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
