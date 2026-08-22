import type { GameModule } from '../../core/types';
import type { CanvasEngineAPI } from '../../engines/canvas-engine/api';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

interface Point {
  x: number;
  y: number;
}

interface Checkpoint {
  x: number;
  y: number;
  reached: boolean;
}

interface ThemeConfig {
  id: string;
  name: string;
  startEmoji: string;
  endEmoji: string;
  color: string;
  trailColor: string;
  bgGradient: [string, string];
}

const THEMES: ThemeConfig[] = [
  {
    id: 'bee-flower',
    name: 'Bee & Flower',
    startEmoji: '🐝',
    endEmoji: '🌸',
    color: '#F59E0B',
    trailColor: '#FBBF24',
    bgGradient: ['#FEF3C7', '#EDE9FE']
  },
  {
    id: 'bunny-carrot',
    name: 'Bunny & Carrot',
    startEmoji: '🐰',
    endEmoji: '🥕',
    color: '#EC4899',
    trailColor: '#F472B6',
    bgGradient: ['#FCE7F3', '#E0F2FE']
  },
  {
    id: 'rocket-earth',
    name: 'Rocket & Earth',
    startEmoji: '🚀',
    endEmoji: '🌍',
    color: '#6366F1',
    trailColor: '#818CF8',
    bgGradient: ['#1E1B4B', '#312E81']
  },
  {
    id: 'puppy-bone',
    name: 'Puppy & Bone',
    startEmoji: '🐶',
    endEmoji: '🦴',
    color: '#10B981',
    trailColor: '#34D399',
    bgGradient: ['#D1FAE5', '#FEF3C7']
  },
  {
    id: 'fish-coral',
    name: 'Fish & Coral',
    startEmoji: '🐠',
    endEmoji: '🪸',
    color: '#06B6D4',
    trailColor: '#22D3EE',
    bgGradient: ['#CFFAFE', '#E0E7FF']
  }
];

const DIFFICULTY_CONFIG = [
  { checkpoints: 5, waveFreq: 1, label: 'Easy (Gentle Curve)' },
  { checkpoints: 7, waveFreq: 2, label: 'Medium (Waves)' },
  { checkpoints: 9, waveFreq: 3, label: 'Hard (Zig-Zags)' },
  { checkpoints: 12, waveFreq: 4, label: 'Expert (Loops)' },
  { checkpoints: 15, waveFreq: 5, label: 'Master (Adventure)' },
];

export default {
  id: 'trace-the-path',
  name: 'Trace the Path',

  api: null as CanvasEngineAPI | null,
  container: null as HTMLElement | null,
  currentLevel: 1,
  currentThemeIdx: 0,
  isPlaying: false,
  timer: null as Timer | null,
  score: null as Score | null,
  canvas: null as HTMLCanvasElement | null,
  ctx: null as CanvasRenderingContext2D | null,
  pathPoints: [] as Point[],
  checkpoints: [] as Checkpoint[],
  userDrawnPoints: [] as Point[],
  isDrawing: false,
  currentCharPos: null as Point | null,
  animFrameId: null as number | null,
  currentModal: null as HTMLElement | null,

  init(api: CanvasEngineAPI): void {
    this.api = api;
    this.container = api.getContainer();
    this.buildMenu();
  },

  start(): void {
    this.isPlaying = true;
    this.startGame(this.currentLevel, this.currentThemeIdx);
  },

  pause(): void {
    this.timer?.pause();
    this.isDrawing = false;
  },

  resume(): void {
    this.timer?.resume();
  },

  destroy(): void {
    this.isPlaying = false;
    this.isDrawing = false;
    this.timer?.pause();
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
    this.pathPoints = [];
    this.checkpoints = [];
    this.userDrawnPoints = [];
    this.canvas = null;
    this.ctx = null;
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
      'bg-gradient-to-r', 'from-amber-400', 'via-pink-500', 'to-indigo-500',
      'animate-float', 'text-center'
    ]);
    title.textContent = '✏️ Trace the Path!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Follow the sparkling dotted path with your finger or mouse to guide cute friends to their goal!';
    menu.appendChild(subtitle);

    // Theme selector
    const themeSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const themeLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    themeLabel.textContent = 'Choose Character';
    themeSection.appendChild(themeLabel);

    const themeRow = this.api.createElement('div', ['flex', 'gap-2', 'flex-wrap', 'justify-center']);
    THEMES.forEach((theme, idx) => {
      const btn = this.api.createElement('button', [
        'px-4', 'py-2', 'rounded-2xl', 'font-bold', 'text-sm', 'transition-all',
        'border-3', 'cursor-pointer', 'flex', 'items-center', 'gap-1'
      ]);
      btn.innerHTML = `<span>${theme.startEmoji}</span> <span>${theme.name}</span>`;

      if (idx === this.currentThemeIdx) {
        btn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-700', 'scale-105', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-indigo-400');
      }

      this.api.onTap(btn, () => {
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
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-amber-400', 'to-orange-500',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🎮 Start Tracing!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.startGame(this.currentLevel, this.currentThemeIdx);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(level: number, themeIdx: number): void {
    if (!this.api || !this.container) return;

    this.container.innerHTML = '';
    this.userDrawnPoints = [];
    this.isDrawing = false;

    // Header
    const header = this.api.createElement('div', [
      'flex', 'items-center', 'justify-between', 'w-full', 'max-w-3xl', 'mx-auto', 'px-4', 'py-3'
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

    // Instruction banner
    const banner = this.api.createElement('div', ['text-center', 'my-2']);
    const theme = THEMES[themeIdx];
    banner.innerHTML = `
      <span class="inline-block px-4 py-1.5 bg-white/90 backdrop-blur rounded-full text-sm font-bold text-gray-700 shadow-sm">
        Guide ${theme.startEmoji} along the dotted line to ${theme.endEmoji}!
      </span>
    `;
    this.container.appendChild(banner);

    // Canvas container
    const canvasWrap = this.api.createElement('div', [
      'w-full', 'max-w-3xl', 'h-[60vh]', 'min-h-[350px]', 'mx-auto', 'px-4', 'relative'
    ]);

    const canvasBox = this.api.createElement('div', [
      'w-full', 'h-full', 'bg-white', 'rounded-3xl', 'shadow-2xl', 'border-4',
      'border-purple-200', 'overflow-hidden', 'relative'
    ]);
    canvasWrap.appendChild(canvasBox);
    this.container.appendChild(canvasWrap);

    // Create Canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'w-full h-full block touch-none select-none cursor-crosshair';
    canvasBox.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.canvas = canvas;
    this.ctx = ctx;

    // Handle high DPI
    const rect = canvasBox.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width || 600;
    const h = rect.height || 400;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Generate Path
    this.generatePath(w, h, level);

    // Wire Touch / Mouse drawing events
    this.setupDrawingEvents(canvas, rect);

    // Start render loop
    this.renderLoop(w, h);
  },

  generatePath(w: number, h: number, level: number): void {
    const config = DIFFICULTY_CONFIG[level - 1] || DIFFICULTY_CONFIG[0];
    this.pathPoints = [];
    this.checkpoints = [];

    const paddingX = 60;
    const startX = paddingX;
    const endX = w - paddingX;
    const midY = h / 2;
    const amplitude = Math.min(100, (h / 3));

    const totalSteps = 100;
    for (let i = 0; i <= totalSteps; i++) {
      const t = i / totalSteps;
      const x = startX + t * (endX - startX);
      const angle = t * Math.PI * 2 * config.waveFreq;
      const y = midY + Math.sin(angle) * amplitude;
      this.pathPoints.push({ x, y });
    }

    // Checkpoints
    const checkCount = config.checkpoints;
    for (let c = 0; c < checkCount; c++) {
      const idx = Math.floor((c / (checkCount - 1)) * (this.pathPoints.length - 1));
      const pt = this.pathPoints[idx];
      this.checkpoints.push({
        x: pt.x,
        y: pt.y,
        reached: c === 0 // Start point is automatically reached
      });
    }

    this.currentCharPos = { ...this.pathPoints[0] };
  },

  setupDrawingEvents(canvas: HTMLCanvasElement, rect: DOMRect): void {
    const getPos = (e: PointerEvent): Point => {
      const currentRect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - currentRect.left,
        y: e.clientY - currentRect.top
      };
    };

    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!this.isPlaying && this.timer) {
        this.isPlaying = true;
        this.timer.start();
      }

      const pt = getPos(e);
      // Check if near start point or current character
      const startPt = this.currentCharPos || this.pathPoints[0];
      const dist = Math.hypot(pt.x - startPt.x, pt.y - startPt.y);

      if (dist < 60) {
        this.isDrawing = true;
        canvas.setPointerCapture(e.pointerId);
        this.userDrawnPoints = [pt];
        this.api?.playSound('click');
      }
    });

    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isDrawing) return;
      const pt = getPos(e);
      this.userDrawnPoints.push(pt);
      this.checkProgress(pt);
    });

    const stopDrawing = () => {
      this.isDrawing = false;
    };

    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointercancel', stopDrawing);
  },

  checkProgress(pt: Point): void {
    if (!this.api) return;

    // Check distance to next unreached checkpoint
    const nextCp = this.checkpoints.find(c => !c.reached);
    if (!nextCp) return;

    const dist = Math.hypot(pt.x - nextCp.x, pt.y - nextCp.y);
    if (dist < 40) {
      // Reached checkpoint!
      nextCp.reached = true;
      this.currentCharPos = { x: nextCp.x, y: nextCp.y };
      this.api.playSound('flip');
      this.score?.addMove();
      this.score?.addMatch(20);

      // Check if all checkpoints reached
      if (this.checkpoints.every(c => c.reached)) {
        this.isDrawing = false;
        this.handleWin();
      }
    }
  },

  renderLoop(w: number, h: number): void {
    const draw = () => {
      if (!this.ctx || !this.canvas) return;

      this.ctx.clearRect(0, 0, w, h);

      const theme = THEMES[this.currentThemeIdx];

      // Draw Guide Ribbon (Dashed dotted line)
      if (this.pathPoints.length > 1) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
          this.ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        this.ctx.strokeStyle = '#E0E7FF';
        this.ctx.lineWidth = 24;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();

        // Inner dashed line
        this.ctx.beginPath();
        this.ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
          this.ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        this.ctx.setLineDash([8, 12]);
        this.ctx.strokeStyle = theme.color;
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        this.ctx.restore();
      }

      // Draw Checkpoints
      this.checkpoints.forEach((cp, idx) => {
        if (!this.ctx) return;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(cp.x, cp.y, cp.reached ? 14 : 10, 0, Math.PI * 2);
        this.ctx.fillStyle = cp.reached ? '#10B981' : '#FCD34D';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = cp.reached ? 'rgba(16, 185, 129, 0.6)' : 'rgba(252, 211, 77, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.stroke();

        if (cp.reached && idx > 0 && idx < this.checkpoints.length - 1) {
          this.ctx.font = '12px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('⭐', cp.x, cp.y);
        }
        this.ctx.restore();
      });

      // Draw User Trail
      if (this.userDrawnPoints.length > 1) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(this.userDrawnPoints[0].x, this.userDrawnPoints[0].y);
        for (let i = 1; i < this.userDrawnPoints.length; i++) {
          this.ctx.lineTo(this.userDrawnPoints[i].x, this.userDrawnPoints[i].y);
        }
        this.ctx.strokeStyle = theme.trailColor;
        this.ctx.lineWidth = 12;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.shadowColor = theme.trailColor;
        this.ctx.shadowBlur = 15;
        this.ctx.stroke();
        this.ctx.restore();
      }

      // Draw Destination Goal Emoji
      if (this.pathPoints.length > 0) {
        const endPt = this.pathPoints[this.pathPoints.length - 1];
        this.ctx.save();
        this.ctx.font = '40px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(theme.endEmoji, endPt.x, endPt.y - 10);
        this.ctx.restore();
      }

      // Draw Character Emoji
      const charPos = this.currentCharPos || this.pathPoints[0];
      if (charPos) {
        this.ctx.save();
        this.ctx.font = '42px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(theme.startEmoji, charPos.x, charPos.y - 10);
        this.ctx.restore();
      }

      this.animFrameId = requestAnimationFrame(draw);
    };

    draw();
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;

    const bestScore = this.api.load<number>('trace_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('trace_best', finalScore);
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
    icon.textContent = '🌈';
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-amber-500', 'mb-2']);
    title.textContent = 'Path Completed!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-amber-50 rounded-xl">
        <span class="text-amber-800">⭐ Score</span>
        <span class="font-black text-amber-600">${finalScore}</span>
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
        themeIdx: this.currentThemeIdx
      }
    };
  },

  deserialize(state: any): void {
    if (state.data) {
      this.currentLevel = state.data.level || 1;
      this.currentThemeIdx = state.data.themeIdx || 0;
    }
  }
} as GameModule;
