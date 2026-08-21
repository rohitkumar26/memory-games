// ============================================
// DOM Renderer — Beautiful, kid-friendly DOM creation & animations
// ============================================

export class DOMRenderer {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  getContainer(): HTMLElement {
    return this.container;
  }

  private sanitizeClasses(classes: (string | undefined | null)[]): string[] {
    return classes
      .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      .flatMap(c => c.trim().split(/\s+/))
      .filter(Boolean);
  }

  createElement(tag: string, classes: string[] = [], text?: string): HTMLElement {
    const el = document.createElement(tag);
    const validClasses = this.sanitizeClasses(classes);
    if (validClasses.length > 0) {
      el.classList.add(...validClasses);
    }
    if (text) el.textContent = text;
    return el;
  }

  createBoard(rows: number, cols: number): HTMLElement {
    const board = this.createElement('div', [
      'grid', 'gap-3', 'w-full', 'max-w-2xl', 'mx-auto', 'p-4'
    ]);
    board.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    return board;
  }

  animate(el: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions = {}): Promise<Animation> {
    const anim = el.animate(keyframes, {
      duration: 300,
      easing: 'ease-out',
      fill: 'both',
      ...options
    });
    return anim.finished.then(() => anim);
  }

  addClass(el: HTMLElement, ...classes: string[]): void {
    const validClasses = this.sanitizeClasses(classes);
    if (validClasses.length > 0) {
      el.classList.add(...validClasses);
    }
  }

  removeClass(el: HTMLElement, ...classes: string[]): void {
    const validClasses = this.sanitizeClasses(classes);
    if (validClasses.length > 0) {
      el.classList.remove(...validClasses);
    }
  }

  // Kid-friendly visual effects
  shake(el: HTMLElement): Promise<void> {
    return this.animate(el, [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-8px)' },
      { transform: 'translateX(8px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(0)' }
    ], { duration: 400 }).then(() => {});
  }

  pop(el: HTMLElement): Promise<void> {
    return this.animate(el, [
      { transform: 'scale(1)' },
      { transform: 'scale(1.15)' },
      { transform: 'scale(1)' }
    ], { duration: 250 }).then(() => {});
  }

  showConfetti(): void {
    const colors = ['#FFD93D', '#FF6B9D', '#60A5FA', '#4ADE80', '#C084FC', '#FF6B35'];
    for (let i = 0; i < 50; i++) {
      const confetti = this.createElement('div', ['fixed', 'pointer-events-none', 'z-50']);
      confetti.style.cssText = `
        left: ${Math.random() * 100}vw;
        top: -10px;
        width: ${8 + Math.random() * 8}px;
        height: ${8 + Math.random() * 8}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        animation: confetti-fall ${1 + Math.random() * 2}s linear forwards;
      `;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 3000);
    }
  }

  clear(): void {
    this.container.innerHTML = '';
  }
}
