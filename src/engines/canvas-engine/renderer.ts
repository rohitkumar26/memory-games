// ============================================
// Canvas Renderer — High-DPI Canvas Creation & Lifecycle
// ============================================

export class CanvasRenderer {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  getContainer(): HTMLElement {
    return this.container;
  }

  createCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    this.container.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.className = 'w-full h-full block rounded-3xl touch-none select-none';
    this.container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context from canvas');

    this.canvas = canvas;
    this.ctx = ctx;

    this.setupHighDPI();
    this.setupResizeListener();

    return { canvas, ctx };
  }

  private setupHighDPI(): void {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const width = rect.width || this.container.clientWidth || 600;
    const height = rect.height || this.container.clientHeight || 450;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  private setupResizeListener(): void {
    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver(() => {
        this.setupHighDPI();
      });
      this.resizeObserver.observe(this.container);
    }
  }

  clear(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.container.innerHTML = '';
    this.canvas = null;
    this.ctx = null;
  }
}
