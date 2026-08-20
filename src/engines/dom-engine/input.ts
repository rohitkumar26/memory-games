// ============================================
// Input Manager — Touch, mouse, keyboard, gestures
// ============================================

export class InputManager {
  private listeners: Map<HTMLElement, (() => void)[]> = new Map();

  onTap(el: HTMLElement, callback: (e: Event) => void): () => void {
    const handlers: (() => void)[] = [];

    const handleTap = (e: Event) => {
      e.preventDefault();
      callback(e);
    };

    el.addEventListener('click', handleTap);
    el.addEventListener('touchend', handleTap, { passive: false });

    // Make it keyboard accessible
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        callback(e);
      }
    };
    el.addEventListener('keydown', handleKey);

    const cleanup = () => {
      el.removeEventListener('click', handleTap);
      el.removeEventListener('touchend', handleTap);
      el.removeEventListener('keydown', handleKey);
    };

    handlers.push(cleanup);
    this.listeners.set(el, handlers);
    return cleanup;
  }

  onDrag(el: HTMLElement, callbacks: {
    start?: (e: PointerEvent) => void;
    move?: (e: PointerEvent) => void;
    end?: (e: PointerEvent) => void;
  }): () => void {
    let isDragging = false;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      el.setPointerCapture(e.pointerId);
      callbacks.start?.(e);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      callbacks.move?.(e);
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      callbacks.end?.(e);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);

    const cleanup = () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
    };

    const handlers = this.listeners.get(el) || [];
    handlers.push(cleanup);
    this.listeners.set(el, handlers);
    return cleanup;
  }

  clearElement(el: HTMLElement): void {
    const handlers = this.listeners.get(el);
    if (handlers) {
      handlers.forEach(h => h());
      this.listeners.delete(el);
    }
  }

  clearAll(): void {
    this.listeners.forEach((handlers, el) => {
      handlers.forEach(h => h());
    });
    this.listeners.clear();
  }
}
