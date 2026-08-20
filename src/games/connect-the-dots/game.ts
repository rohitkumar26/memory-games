import type { GameModule } from '../../core/types';
import type { CanvasEngineAPI } from '../../engines/canvas-engine/api';
import { Score } from '../memory-match/components/Score';
import { Timer } from '../memory-match/components/Timer';

interface Dot {
  num: number;
  nx: number; // Normalized 0..1
  ny: number; // Normalized 0..1
  connected: boolean;
}

interface ShapePreset {
  id: string;
  name: string;
  emoji: string;
  color: string;
  fillColor: string;
  dots: { nx: number; ny: number }[];
}

const SHAPE_PRESETS: ShapePreset[] = [
  {
    id: 'star',
    name: 'Shining Star',
    emoji: '⭐',
    color: '#F59E0B',
    fillColor: 'rgba(245, 158, 11, 0.15)',
    dots: [
      { nx: 0.5, ny: 0.15 },
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
    id: 'house',
    name: 'Cozy House',
    emoji: '🏠',
    color: '#EC4899',
    fillColor: 'rgba(236, 72, 153, 0.15)',
    dots: [
      { nx: 0.5, ny: 0.15 },
      { nx: 0.8, ny: 0.4 },
      { nx: 0.8, ny: 0.82 },
      { nx: 0.2, ny: 0.82 },
      { nx: 0.2, ny: 0.4 }
    ]
  },
  {
    id: 'boat',
    name: 'Little Sailboat',
    emoji: '⛵',
    color: '#0284C7',
    fillColor: 'rgba(2, 132, 199, 0.15)',
    dots: [
      { nx: 0.5, ny: 0.15 },
      { nx: 0.78, ny: 0.52 },
      { nx: 0.55, ny: 0.56 },
      { nx: 0.88, ny: 0.65 },
      { nx: 0.74, ny: 0.85 },
      { nx: 0.26, ny: 0.85 },
      { nx: 0.12, ny: 0.65 },
      { nx: 0.45, ny: 0.56 },
      { nx: 0.22, ny: 0.52 }
    ]
  },
  {
    id: 'heart',
    name: 'Lovely Heart',
    emoji: '💖',
    color: '#E11D48',
    fillColor: 'rgba(225, 29, 72, 0.15)',
    dots: [
      { nx: 0.5, ny: 0.35 },
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
    id: 'rocket',
    name: 'Cosmic Rocket',
    emoji: '🚀',
    color: '#6366F1',
    fillColor: 'rgba(99, 102, 241, 0.15)',
    dots: [
      { nx: 0.5, ny: 0.12 },
      { nx: 0.65, ny: 0.35 },
      { nx: 0.65, ny: 0.68 },
      { nx: 0.82, ny: 0.82 },
      { nx: 0.65, ny: 0.78 },
      { nx: 0.5, ny: 0.85 },
      { nx: 0.35, ny: 0.78 },
      { nx: 0.18, ny: 0.82 },
      { nx: 0.35, ny: 0.68 },
      { nx: 0.35, ny: 0.35 }
    ]
  }
];

export default {
  id: 'connect-the-dots',
  name: 'Connect the Dots',

  api: null as CanvasEngineAPI | null,
  container: null as HTMLElement | null,
  currentShapeIdx: 0,
  isPlaying: false,
  timer: null as Timer | null,
  score: null as Score | null,
  canvas: null as HTMLCanvasElement | null,
  ctx: null as CanvasRenderingContext2D | null,
  dots: [] as Dot[],
  nextDotNum: 1,
  completed: false,
  animFrameId: null as number | null,
  currentModal: null as HTMLElement | null,

  init(api: CanvasEngineAPI): void {
    this.api = api;
    this.container = api.getContainer();
    this.buildMenu();
  },

  start(): void {
    this.isPlaying = true;
    this.startGame(this.currentShapeIdx);
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
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
    this.dots = [];
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
      'bg-gradient-to-r', 'from-amber-400', 'via-pink-500', 'to-sky-500',
      'animate-float', 'text-center'
    ]);
    title.textContent = '🔢 Connect the Dots!';
    menu.appendChild(title);

    const subtitle = this.api.createElement('p', [
      'text-lg', 'text-gray-500', 'text-center', 'max-w-md'
    ]);
    subtitle.textContent = 'Connect the numbers in order (1 → 2 → 3...) to reveal the surprise hidden picture!';
    menu.appendChild(subtitle);

    // Shape selector
    const shapeSection = this.api.createElement('div', ['flex', 'flex-col', 'items-center', 'gap-2']);
    const shapeLabel = this.api.createElement('span', ['text-sm', 'font-bold', 'text-gray-400', 'uppercase', 'tracking-wider']);
    shapeLabel.textContent = 'Choose Picture to Reveal';
    shapeSection.appendChild(shapeLabel);

    const shapeRow = this.api.createElement('div', ['flex', 'gap-2', 'flex-wrap', 'justify-center']);
    SHAPE_PRESETS.forEach((preset, idx) => {
      const btn = this.api.createElement('button', [
        'px-4', 'py-2.5', 'rounded-2xl', 'font-bold', 'text-sm', 'transition-all',
        'border-3', 'cursor-pointer', 'flex', 'items-center', 'gap-1.5'
      ]);
      btn.innerHTML = `<span>${preset.emoji}</span> <span>${preset.name}</span>`;

      if (idx === this.currentShapeIdx) {
        btn.classList.add('bg-pink-500', 'text-white', 'border-pink-600', 'scale-105', 'shadow-lg');
      } else {
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200', 'hover:border-pink-400');
      }

      this.api.onTap(btn, () => {
        this.currentShapeIdx = idx;
        this.api?.playSound('click');
        this.buildMenu();
      });
      shapeRow.appendChild(btn);
    });
    shapeSection.appendChild(shapeRow);
    menu.appendChild(shapeSection);

    // Play Button
    const startBtn = this.api.createElement('button', [
      'px-10', 'py-4', 'bg-gradient-to-r', 'from-pink-500', 'to-amber-500',
      'text-white', 'text-2xl', 'font-black', 'rounded-3xl', 'shadow-xl',
      'hover:shadow-2xl', 'hover:scale-105', 'active:scale-95', 'transition-all',
      'cursor-pointer', 'border-4', 'border-white/30'
    ]);
    startBtn.textContent = '🎮 Start Connecting!';
    this.api.onTap(startBtn, () => {
      this.api?.playSound('click');
      this.startGame(this.currentShapeIdx);
    });
    menu.appendChild(startBtn);

    this.container.appendChild(menu);
  },

  startGame(shapeIdx: number): void {
    if (!this.api || !this.container) return;

    this.container.innerHTML = '';
    this.nextDotNum = 1;
    this.completed = false;

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

    const preset = SHAPE_PRESETS[shapeIdx] || SHAPE_PRESETS[0];

    // Status Banner
    const banner = this.api.createElement('div', ['text-center', 'my-2']);
    banner.innerHTML = `
      <span id="dots-target-badge" class="inline-block px-4 py-1.5 bg-pink-100 text-pink-800 rounded-full text-sm font-black shadow-sm">
        👉 Tap Dot (1) to start!
      </span>
    `;
    this.container.appendChild(banner);

    // Canvas Container
    const canvasWrap = this.api.createElement('div', [
      'w-full', 'max-w-3xl', 'h-[60vh]', 'min-h-[350px]', 'mx-auto', 'px-4', 'relative'
    ]);

    const canvasBox = this.api.createElement('div', [
      'w-full', 'h-full', 'bg-white', 'rounded-3xl', 'shadow-2xl', 'border-4',
      'border-pink-200', 'overflow-hidden', 'relative'
    ]);
    canvasWrap.appendChild(canvasBox);
    this.container.appendChild(canvasWrap);

    // Initialize Dots
    this.dots = preset.dots.map((d, i) => ({
      num: i + 1,
      nx: d.nx,
      ny: d.ny,
      connected: false
    }));

    // Create Canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'w-full h-full block touch-none select-none cursor-pointer';
    canvasBox.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.canvas = canvas;
    this.ctx = ctx;

    const rect = canvasBox.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width || 600;
    const h = rect.height || 400;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Setup Pointer Click/Tap Event
    this.setupTapEvents(canvas, w, h);

    // Render loop
    this.renderLoop(w, h, preset);
  },

  setupTapEvents(canvas: HTMLCanvasElement, w: number, h: number): void {
    const handleTap = (clientX: number, clientY: number) => {
      if (this.completed || !this.api) return;

      if (!this.isPlaying && this.timer) {
        this.isPlaying = true;
        this.timer.start();
      }

      const rect = canvas.getBoundingClientRect();
      const tapX = clientX - rect.left;
      const tapY = clientY - rect.top;

      const targetDot = this.dots.find(d => d.num === this.nextDotNum);
      if (!targetDot) return;

      const dotX = targetDot.nx * w;
      const dotY = targetDot.ny * h;
      const dist = Math.hypot(tapX - dotX, tapY - dotY);

      if (dist < 40) {
        // Correct dot tapped!
        targetDot.connected = true;
        this.api.playSound('flip');
        this.score?.addMove();
        this.score?.addMatch(25);

        this.nextDotNum++;

        const targetBadge = document.getElementById('dots-target-badge');
        if (this.nextDotNum <= this.dots.length) {
          if (targetBadge) {
            targetBadge.textContent = `👉 Next: Tap Dot (${this.nextDotNum})`;
          }
        } else {
          // All dots connected!
          this.completed = true;
          if (targetBadge) {
            targetBadge.textContent = `✨ Picture Revealed!`;
            targetBadge.className = 'inline-block px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-black animate-pop';
          }
          this.handleWin();
        }
      } else {
        // Tapped elsewhere or wrong dot
        this.api.playSound('error');
      }
    };

    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      handleTap(e.clientX, e.clientY);
    });
  },

  renderLoop(w: number, h: number, preset: ShapePreset): void {
    let tick = 0;

    const draw = () => {
      if (!this.ctx || !this.canvas) return;
      tick++;

      this.ctx.clearRect(0, 0, w, h);

      const connectedDots = this.dots.filter(d => d.connected);

      // Draw Connected Polygon / Lines
      if (connectedDots.length > 1) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(connectedDots[0].nx * w, connectedDots[0].ny * h);

        for (let i = 1; i < connectedDots.length; i++) {
          this.ctx.lineTo(connectedDots[i].nx * w, connectedDots[i].ny * h);
        }

        if (this.completed) {
          // Close path
          this.ctx.closePath();
          this.ctx.fillStyle = preset.fillColor;
          this.ctx.fill();
        }

        this.ctx.strokeStyle = preset.color;
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.shadowColor = preset.color;
        this.ctx.shadowBlur = 12;
        this.ctx.stroke();
        this.ctx.restore();
      }

      // Draw Revealed Picture in Center if completed
      if (this.completed) {
        this.ctx.save();
        this.ctx.font = '64px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(preset.emoji, w / 2, h / 2);
        this.ctx.restore();
      }

      // Draw Dots
      this.dots.forEach((dot) => {
        if (!this.ctx) return;
        const dx = dot.nx * w;
        const dy = dot.ny * h;
        const isNext = dot.num === this.nextDotNum;

        this.ctx.save();

        // Pulsing halo for next target dot
        if (isNext && !this.completed) {
          const pulse = (Math.sin(tick * 0.1) + 1) / 2; // 0..1
          this.ctx.beginPath();
          this.ctx.arc(dx, dy, 20 + pulse * 8, 0, Math.PI * 2);
          this.ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
          this.ctx.fill();
        }

        // Dot Circle
        this.ctx.beginPath();
        this.ctx.arc(dx, dy, dot.connected ? 14 : 16, 0, Math.PI * 2);
        this.ctx.fillStyle = dot.connected ? '#10B981' : (isNext ? '#EC4899' : '#F3F4F6');
        this.ctx.strokeStyle = dot.connected ? '#059669' : (isNext ? '#BE185D' : '#9CA3AF');
        this.ctx.lineWidth = 3;
        this.ctx.fill();
        this.ctx.stroke();

        // Dot Number Text
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = dot.connected || isNext ? '#FFFFFF' : '#374151';
        this.ctx.fillText(String(dot.num), dx, dy);

        this.ctx.restore();
      });

      this.animFrameId = requestAnimationFrame(draw);
    };

    draw();
  },

  async handleWin(): Promise<void> {
    if (!this.api || !this.timer) return;

    const finalTime = this.timer.stop();
    const finalScore = this.score?.getScore() || 0;
    const preset = SHAPE_PRESETS[this.currentShapeIdx];

    const bestScore = this.api.load<number>('dots_best') || 0;
    if (finalScore > bestScore) {
      this.api.save('dots_best', finalScore);
    }

    this.api.playSound('win');
    this.api.showConfetti();

    await this.api.delay(500);

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
    icon.textContent = preset.emoji;
    modal.appendChild(icon);

    const title = this.api.createElement('h2', ['text-3xl', 'font-black', 'text-pink-600', 'mb-2']);
    title.textContent = `You Drew a ${preset.name}!`;
    modal.appendChild(title);

    const stats = this.api.createElement('div', ['flex', 'flex-col', 'gap-2', 'mb-6']);
    stats.innerHTML = `
      <div class="flex justify-between px-4 py-2 bg-pink-50 rounded-xl">
        <span class="text-pink-800">⭐ Score</span>
        <span class="font-black text-pink-700">${finalScore}</span>
      </div>
      <div class="flex justify-between px-4 py-2 bg-pink-50 rounded-xl">
        <span class="text-pink-800">⏱️ Time</span>
        <span class="font-black text-pink-700">${Math.floor(finalTime / 60)}:${(finalTime % 60).toString().padStart(2, '0')}</span>
      </div>
    `;
    modal.appendChild(stats);

    const btnRow = this.api.createElement('div', ['flex', 'gap-3', 'justify-center']);

    const replayBtn = this.api.createElement('button', [
      'px-6', 'py-3', 'bg-pink-500', 'text-white', 'font-bold', 'rounded-2xl',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer'
    ]);
    replayBtn.textContent = '🔄 Play Again';
    this.api.onTap(replayBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
      this.currentModal = null;
      this.startGame(this.currentShapeIdx);
    });
    btnRow.appendChild(replayBtn);

    const nextBtn = this.api.createElement('button', [
      'px-6', 'py-3', 'bg-purple-600', 'text-white', 'font-bold', 'rounded-2xl',
      'hover:scale-105', 'active:scale-95', 'transition', 'cursor-pointer'
    ]);
    nextBtn.textContent = 'Next Shape ⏭️';
    this.api.onTap(nextBtn, () => {
      this.api?.playSound('click');
      overlay.remove();
      this.currentModal = null;
      this.currentShapeIdx = (this.currentShapeIdx + 1) % SHAPE_PRESETS.length;
      this.startGame(this.currentShapeIdx);
    });
    btnRow.appendChild(nextBtn);

    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  },

  serialize() {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      data: {
        shapeIdx: this.currentShapeIdx
      }
    };
  },

  deserialize(state: any): void {
    if (state.data) {
      this.currentShapeIdx = state.data.shapeIdx || 0;
    }
  }
} as GameModule;
