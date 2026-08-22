import type { GameModule, EngineAPI } from '../../core/types';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

interface Point {
  nx: number;
  ny: number;
}

interface ShapePreset {
  id: string;
  name: string;
  emoji: string;
  color: string;
  fillColor: string;
  points: Point[];
  closed: boolean;
}

const SHAPES: ShapePreset[] = [
  {
    id: 'triangle',
    name: 'Triangle',
    emoji: '🔺',
    color: '#EF4444',
    fillColor: 'rgba(239, 68, 68, 0.15)',
    closed: true,
    points: [
      { nx: 0.5, ny: 0.18 },
      { nx: 0.82, ny: 0.78 },
      { nx: 0.18, ny: 0.78 }
    ]
  },
  {
    id: 'square',
    name: 'Square',
    emoji: '🟩',
    color: '#10B981',
    fillColor: 'rgba(16, 185, 129, 0.15)',
    closed: true,
    points: [
      { nx: 0.22, ny: 0.22 },
      { nx: 0.78, ny: 0.22 },
      { nx: 0.78, ny: 0.78 },
      { nx: 0.22, ny: 0.78 }
    ]
  },
  {
    id: 'diamond',
    name: 'Diamond',
    emoji: '🔶',
    color: '#F59E0B',
    fillColor: 'rgba(245, 158, 11, 0.15)',
    closed: true,
    points: [
      { nx: 0.5, ny: 0.15 },
      { nx: 0.82, ny: 0.5 },
      { nx: 0.5, ny: 0.85 },
      { nx: 0.18, ny: 0.5 }
    ]
  },
  {
    id: 'star',
    name: 'Golden Star',
    emoji: '⭐',
    color: '#EAB308',
    fillColor: 'rgba(234, 179, 8, 0.2)',
    closed: true,
    points: [
      { nx: 0.5, ny: 0.12 },
      { nx: 0.62, ny: 0.38 },
      { nx: 0.88, ny: 0.4 },
      { nx: 0.68, ny: 0.58 },
      { nx: 0.74, ny: 0.85 },
      { nx: 0.5, ny: 0.7 },
      { nx: 0.26, ny: 0.85 },
      { nx: 0.32, ny: 0.58 },
      { nx: 0.12, ny: 0.4 },
      { nx: 0.38, ny: 0.38 }
    ]
  },
  {
    id: 'heart',
    name: 'Magic Heart',
    emoji: '💖',
    color: '#EC4899',
    fillColor: 'rgba(236, 72, 153, 0.2)',
    closed: true,
    points: [
      { nx: 0.5, ny: 0.32 },
      { nx: 0.35, ny: 0.18 },
      { nx: 0.18, ny: 0.28 },
      { nx: 0.18, ny: 0.52 },
      { nx: 0.5, ny: 0.85 },
      { nx: 0.82, ny: 0.52 },
      { nx: 0.82, ny: 0.28 },
      { nx: 0.65, ny: 0.18 }
    ]
  },
  {
    id: 'house',
    name: 'Little House',
    emoji: '🏠',
    color: '#8B5CF6',
    fillColor: 'rgba(139, 92, 246, 0.15)',
    closed: true,
    points: [
      { nx: 0.5, ny: 0.15 },
      { nx: 0.82, ny: 0.42 },
      { nx: 0.82, ny: 0.82 },
      { nx: 0.18, ny: 0.82 },
      { nx: 0.18, ny: 0.42 }
    ]
  }
];

const DIFFICULTY_CONFIG = [
  { shapeIndices: [0, 1], previewSec: 4, label: 'Easy (Triangle & Square, 4s Flash)' },
  { shapeIndices: [1, 2], previewSec: 3.5, label: 'Medium (Square & Diamond, 3.5s)' },
  { shapeIndices: [2, 3], previewSec: 3, label: 'Hard (Diamond & Star, 3s)' },
  { shapeIndices: [3, 4], previewSec: 2.5, label: 'Expert (Star & Heart, 2.5s)' },
  { shapeIndices: [4, 5], previewSec: 2, label: 'Master (Heart & House, 2s)' },
];

const TOTAL_ROUNDS = 3;

export default {
  id: 'draw-the-shape',
  name: 'Draw the Shape',

  api: null as EngineAPI | null,
  container: null as HTMLElement | null,
  canvas: null as HTMLCanvasElement | null,
  ctx: null as CanvasRenderingContext2D | null,
  currentLevel: 1,
  currentShapeIdx: 0,
  currentRound: 1,
  isPlaying: false,
  isDrawing: false,
  timer: null as Timer | null,
  score: null as Score | null,
  drawnPoints: [] as { x: number; y: number }[],
  isMemorizing: false,
  currentModal: null as HTMLElement | null,
  animId: 0,

  init(api: EngineAPI): void {
    this.api = api;
    this.container = api.getContainer();
    this.buildMenu();
  },

  start(): void {
    this.isPlaying = true;
    this.currentRound = 1;
    this.startGame(this.currentLevel, this.currentShapeIdx);
  },

  pause(): void {
    this.timer?.pause();
  },

  resume(): void {
    this.timer?.resume();
  },

  destroy(): void {
    this.isPlaying = false;
    this.isDrawing = false;
    this.timer?.pause();
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
    this.drawnPoints = [];
    this.api = null;
    this.container = null;
    this.canvas = null;
    this.ctx = null;
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
    title.textContent = '✏️ Draw the Shape!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Memorize the glowing mystery geometry shape before it fades, then draw its outline on the drawing canvas!';
    menu.appendChild(subtitle);

    // Shape selector
    const shapeSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const shapeLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    shapeLabel.textContent = 'Choose Starting Shape';
    shapeSection.appendChild(shapeLabel);

    const shapeRow = this.api.createElement('div', ['flex', 'gap-2', 'flex-wrap', 'justify-center']);
    SHAPES.forEach((shape, idx) => {
      const btn = this.api!.createElement('button', [
        'px-3.5', 'py-2', 'rounded-2xl', 'font-bold', 'text-sm', 'transition-all',
        'border-3', 'cursor-pointer', 'flex', 'items-center', 'gap-1.5'
      ]);
      btn.innerHTML = `<span>${shape.emoji}</span> <span>${shape.name}</span>`;

      if (idx === this.currentShapeIdx) {
        btn.classList.add('bg-purple-600', 'text-white', 'border-purple-700', 'scale-105', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-purple-400');
      }

      this.api!.onTap(btn, () => {
        this.currentShapeIdx = idx;
        this.api?.playSound('click');
        this.buildMenu();
      });
      shapeRow.appendChild(btn);
    });
    shapeSection.appendChild(shapeRow);
    menu.appendChild(shapeSection);

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
        btn.classList.add('bg-pink-500', 'text-white', 'border-pink-600', 'scale-110', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200', 'hover:border-pink-400');
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
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-pink-500', 'via-purple-500', 'to-indigo-600',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🎨 Start Drawing!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.currentRound = 1;
      this.startGame(this.currentLevel, this.currentShapeIdx);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(level: number, shapeIdx: number): void {
    if (!this.api || !this.container) return;

    this.container.innerHTML = '';
    this.isDrawing = false;
    this.drawnPoints = [];

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
    const mainView = this.api.createElement('div', [
      'w-full', 'max-w-2xl', 'mx-auto', 'px-4', 'flex', 'flex-col', 'gap-4', 'items-center'
    ]);
    this.container.appendChild(mainView);

    this.startRound(mainView);
  },

  async startRound(mainView: HTMLElement): Promise<void> {
    if (!this.api) return;

    const config = DIFFICULTY_CONFIG[this.currentLevel - 1] || DIFFICULTY_CONFIG[0];
    const availableIndices = config.shapeIndices;
    const shapeIndex = availableIndices[(this.currentRound - 1) % availableIndices.length];
    const shape = SHAPES[shapeIndex] || SHAPES[0];

    this.drawnPoints = [];
    this.isMemorizing = true;
    this.isDrawing = false;

    mainView.innerHTML = '';

    // Status Banner
    const statusWrapper = this.api.createElement('div', ['flex', 'items-center', 'justify-between', 'w-full', 'px-2']);
    const roundBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-purple-100', 'text-purple-800', 'rounded-full', 'font-bold', 'text-sm'
    ]);
    roundBadge.textContent = `Round ${this.currentRound} of ${TOTAL_ROUNDS} 🎯`;
    statusWrapper.appendChild(roundBadge);

    const promptBadge = this.api.createElement('span', [
      'px-4', 'py-1.5', 'bg-amber-100', 'text-amber-800', 'rounded-full', 'font-extrabold', 'text-sm', 'animate-pulse'
    ]);
    promptBadge.textContent = `👀 Memorize the ${shape.name}! ⏳ ${config.previewSec}s`;
    statusWrapper.appendChild(promptBadge);
    mainView.appendChild(statusWrapper);

    // Canvas Container Pad
    const canvasCard = this.api.createElement('div', [
      'w-full', 'max-w-xl', 'aspect-[4/3]', 'bg-white', 'rounded-3xl', 'shadow-2xl',
      'border-4', 'border-purple-200', 'relative', 'overflow-hidden', 'touch-none'
    ]);

    const canvas = document.createElement('canvas');
    canvas.className = 'w-full h-full block cursor-crosshair';
    canvasCard.appendChild(canvas);
    mainView.appendChild(canvasCard);

    // Done Button
    const doneBtn = this.api.createElement('button', [
      'px-8', 'py-3.5', 'bg-gradient-to-r', 'from-emerald-500', 'to-teal-600',
      'text-white', 'font-black', 'text-lg', 'rounded-2xl', 'shadow-lg',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer', 'hidden'
    ]);
    doneBtn.textContent = '✨ Check My Shape! →';
    mainView.appendChild(doneBtn);

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Resize canvas
    const rect = canvasCard.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (rect.width || 560) * dpr;
    canvas.height = (rect.height || 420) * dpr;
    this.ctx?.scale(dpr, dpr);

    const width = rect.width || 560;
    const height = rect.height || 420;

    // Render Preview Shape
    this.drawPreviewShape(shape, width, height);

    // Countdown interval
    let timeLeft = config.previewSec;
    const intervalId = window.setInterval(() => {
      timeLeft -= 1;
      if (timeLeft > 0) {
        promptBadge.textContent = `👀 Memorize the ${shape.name}! ⏳ ${timeLeft}s`;
      } else {
        window.clearInterval(intervalId);
      }
    }, 1000);

    this.api.playSound('flip');
    await this.api.delay(config.previewSec * 1000);
    window.clearInterval(intervalId);

    // Clear Canvas and start drawing mode
    this.isMemorizing = false;
    this.clearCanvas(width, height);
    this.drawDrawingPadGuides(width, height);

    promptBadge.className = 'px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full font-black text-sm';
    promptBadge.textContent = `✏️ Draw the ${shape.name} from memory!`;
    this.api.playSound('pop');
    doneBtn.classList.remove('hidden');

    // Attach Drawing Handlers
    this.setupDrawingListeners(canvas, width, height, doneBtn, shape, promptBadge, mainView);
  },

  drawPreviewShape(shape: ShapePreset, w: number, h: number): void {
    if (!this.ctx) return;
    this.clearCanvas(w, h);

    const pts = shape.points;
    if (pts.length < 2) return;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(pts[0].nx * w, pts[0].ny * h);

    for (let i = 1; i < pts.length; i++) {
      this.ctx.lineTo(pts[i].nx * w, pts[i].ny * h);
    }

    if (shape.closed) {
      this.ctx.closePath();
      this.ctx.fillStyle = shape.fillColor;
      this.ctx.fill();
    }

    this.ctx.strokeStyle = shape.color;
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.shadowColor = shape.color;
    this.ctx.shadowBlur = 15;
    this.ctx.stroke();

    // Draw vertex dots
    pts.forEach(p => {
      this.ctx!.beginPath();
      this.ctx!.arc(p.nx * w, p.ny * h, 7, 0, Math.PI * 2);
      this.ctx!.fillStyle = '#FFFFFF';
      this.ctx!.fill();
      this.ctx!.lineWidth = 3;
      this.ctx!.strokeStyle = shape.color;
      this.ctx!.stroke();
    });

    this.ctx.restore();
  },

  drawDrawingPadGuides(w: number, h: number): void {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.strokeStyle = '#F3E8FF';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([6, 6]);

    // Grid center lines
    this.ctx.beginPath();
    this.ctx.moveTo(w / 2, 20);
    this.ctx.lineTo(w / 2, h - 20);
    this.ctx.moveTo(20, h / 2);
    this.ctx.lineTo(w - 20, h / 2);
    this.ctx.stroke();

    this.ctx.restore();
  },

  clearCanvas(w: number, h: number): void {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, w, h);
  },

  setupDrawingListeners(
    canvas: HTMLCanvasElement,
    w: number,
    h: number,
    doneBtn: HTMLElement,
    shape: ShapePreset,
    promptBadge: HTMLElement,
    mainView: HTMLElement
  ): void {
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDraw = (e: MouseEvent | TouchEvent) => {
      if (this.isMemorizing) return;
      e.preventDefault();
      this.isDrawing = true;
      const pos = getPos(e);
      this.drawnPoints.push(pos);
      this.redrawDrawnPath(w, h, shape);
    };

    const moveDraw = (e: MouseEvent | TouchEvent) => {
      if (!this.isDrawing || this.isMemorizing) return;
      e.preventDefault();
      const pos = getPos(e);
      this.drawnPoints.push(pos);
      this.redrawDrawnPath(w, h, shape);
    };

    const endDraw = (e: MouseEvent | TouchEvent) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      this.isDrawing = false;
      this.score?.addMove();
      this.api?.playSound('pop');
    };

    canvas.onmousedown = startDraw;
    canvas.onmousemove = moveDraw;
    window.onmouseup = endDraw;

    canvas.ontouchstart = startDraw;
    canvas.ontouchmove = moveDraw;
    window.ontouchend = endDraw;

    this.api!.onTap(doneBtn, async () => {
      if (this.drawnPoints.length < 10) {
        this.api?.playSound('error');
        promptBadge.textContent = '✏️ Draw more of the shape outline first!';
        promptBadge.className = 'px-4 py-1.5 bg-rose-100 text-rose-800 rounded-full font-black text-sm animate-shake';
        return;
      }

      // Check Shape Accuracy
      const accuracy = this.calculateAccuracy(shape, w, h);
      this.score?.addMatch(Math.round(accuracy * 50));

      if (accuracy >= 0.5) {
        // Successful Drawing!
        this.api?.playSound('match');
        promptBadge.className = 'px-4 py-1.5 bg-emerald-500 text-white rounded-full font-black text-sm animate-bounce-slow';
        promptBadge.textContent = `🎉 Great Job! ${Math.round(accuracy * 100)}% Match!`;

        // Reveal original target shape overlay in gold
        this.drawPreviewShape(shape, w, h);
        await this.api?.delay(1000);

        if (this.currentRound >= TOTAL_ROUNDS) {
          await this.handleWin();
        } else {
          this.currentRound++;
          this.startRound(mainView);
        }
      } else {
        // Low accuracy, retry
        this.api?.playSound('error');
        promptBadge.className = 'px-4 py-1.5 bg-rose-100 text-rose-800 rounded-full font-black text-sm';
        promptBadge.textContent = `❌ Almost! Try drawing the ${shape.name} again.`;

        await this.api?.delay(800);
        this.drawnPoints = [];
        this.clearCanvas(w, h);
        this.drawDrawingPadGuides(w, h);
      }
    });
  },

  redrawDrawnPath(w: number, h: number, shape: ShapePreset): void {
    if (!this.ctx) return;
    this.clearCanvas(w, h);
    this.drawDrawingPadGuides(w, h);

    if (this.drawnPoints.length < 2) return;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(this.drawnPoints[0].x, this.drawnPoints[0].y);

    for (let i = 1; i < this.drawnPoints.length; i++) {
      this.ctx.lineTo(this.drawnPoints[i].x, this.drawnPoints[i].y);
    }

    this.ctx.strokeStyle = shape.color;
    this.ctx.lineWidth = 8;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.shadowColor = shape.color;
    this.ctx.shadowBlur = 10;
    this.ctx.stroke();

    this.ctx.restore();
  },

  calculateAccuracy(shape: ShapePreset, w: number, h: number): number {
    // Check how close the drawn points come to each required vertex of the shape
    const vertices = shape.points.map(p => ({ x: p.nx * w, y: p.ny * h }));
    let matchedVertices = 0;
    const threshold = Math.min(w, h) * 0.22; // 22% viewport radius tolerance for young kids

    vertices.forEach(v => {
      const isClose = this.drawnPoints.some(dp => Math.hypot(dp.x - v.x, dp.y - v.y) < threshold);
      if (isClose) matchedVertices++;
    });

    const vertexRatio = matchedVertices / vertices.length;

    // Check path length bounding box
    const xs = this.drawnPoints.map(p => p.x);
    const ys = this.drawnPoints.map(p => p.y);
    const drawnWidth = Math.max(...xs) - Math.min(...xs);
    const drawnHeight = Math.max(...ys) - Math.min(...ys);

    const targetXs = vertices.map(p => p.x);
    const targetYs = vertices.map(p => p.y);
    const targetWidth = Math.max(...targetXs) - Math.min(...targetXs);
    const targetHeight = Math.max(...targetYs) - Math.min(...targetYs);

    const sizeRatio = Math.min(drawnWidth / targetWidth, drawnHeight / targetHeight);
    const sizeScore = sizeRatio >= 0.5 ? 1 : sizeRatio * 2;

    return Math.min(1, Math.max(0, (vertexRatio * 0.7 + sizeScore * 0.3)));
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const moves = this.score?.getMoves() || 0;

    const bestScore = this.api.load<number>('draw_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('draw_best', finalScore);
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
    icon.textContent = '🎨';
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-purple-600', 'mb-2']);
    title.textContent = 'Geometry Artist!';
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-purple-50 rounded-xl">
        <span class="text-purple-800">⭐ Score</span>
        <span class="font-black text-purple-700">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-purple-50 rounded-xl">
        <span class="text-purple-800">🔄 Total Strokes</span>
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
        'w-full', 'py-3.5', 'bg-gradient-to-r', 'from-purple-600', 'to-pink-500',
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
      'flex-1', 'py-3', 'bg-purple-600', 'text-white', 'font-bold', 'rounded-2xl',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer'
    ]);
    replayBtn.textContent = '🔄 Replay';
    this.api.onTap(replayBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
      this.currentModal = null;
      this.startGame(this.currentLevel, this.currentShapeIdx);
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
        shapeIdx: this.currentShapeIdx,
        round: this.currentRound
      }
    };
  },

  deserialize(state: any): void {
    if (state.data) {
      this.currentLevel = state.data.level || 1;
      this.currentShapeIdx = state.data.shapeIdx || 0;
      this.currentRound = state.data.round || 1;
    }
  }
} as GameModule;
