import type { EngineAPI } from '../../../core/types';

export interface CardData {
  id: number;
  emoji: string;
  colorClass: string[];
}

export class Card {
  element: HTMLElement;
  private front: HTMLElement;
  private back: HTMLElement;
  private isFlipped = false;
  private isMatched = false;
  private api: EngineAPI;

  constructor(data: CardData, api: EngineAPI) {
    this.api = api;
    this.element = this.build(data);
  }

  private build(data: CardData): HTMLElement {
    const card = this.api.createElement('div', [
      'relative', 'aspect-square', 'cursor-pointer', 'select-none',
      'group', 'perspective-1000'
    ]);
    card.setAttribute('data-card-id', String(data.id));
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Memory card');
    card.style.perspective = '1000px';

    // Inner container for 3D flip
    const inner = this.api.createElement('div', [
      'w-full', 'h-full', 'relative', 'transition-transform', 'duration-500',
      'transform-style-preserve-3d', 'rounded-2xl', 'shadow-lg'
    ]);
    inner.style.transformStyle = 'preserve-3d';
    card.appendChild(inner);

    // Front face (hidden initially — the "back" of the physical card)
    this.front = this.api.createElement('div', [
      'absolute', 'inset-0', 'backface-hidden', 'rounded-2xl',
      'flex', 'items-center', 'justify-center', 'text-4xl', 'sm:text-5xl',
      'bg-gradient-to-br', ...data.colorClass,
      'border-4', 'border-white/50'
    ]);
    this.front.style.backfaceVisibility = 'hidden';
    this.front.textContent = data.emoji;
    inner.appendChild(this.front);

    // Back face (visible initially — the pattern side)
    this.back = this.api.createElement('div', [
      'absolute', 'inset-0', 'backface-hidden', 'rounded-2xl',
      'flex', 'items-center', 'justify-center',
      'bg-gradient-to-br', 'from-kid-purple', 'to-kid-blue',
      'border-4', 'border-white/50'
    ]);
    this.back.style.backfaceVisibility = 'hidden';
    this.back.style.transform = 'rotateY(180deg)';

    // Pattern on back
    const pattern = this.api.createElement('div', ['text-3xl', 'opacity-60']);
    pattern.textContent = '⭐';
    this.back.appendChild(pattern);

    inner.appendChild(this.back);

    // Hover effect
    card.addEventListener('mouseenter', () => {
      if (!this.isFlipped && !this.isMatched) {
        inner.style.transform = 'scale(1.05) rotateY(180deg)';
      }
    });
    card.addEventListener('mouseleave', () => {
      if (!this.isFlipped && !this.isMatched) {
        inner.style.transform = 'scale(1) rotateY(180deg)';
      }
    });

    return card;
  }

  async flip(): Promise<void> {
    if (this.isFlipped || this.isMatched) return;
    this.isFlipped = true;

    const inner = this.element.firstElementChild as HTMLElement;
    inner.style.transform = 'rotateY(0deg)';

    await this.api.animate(this.front, [
      { transform: 'scale(1)' },
      { transform: 'scale(1.1)' },
      { transform: 'scale(1)' }
    ], { duration: 200 });
  }

  async unflip(): Promise<void> {
    if (!this.isFlipped || this.isMatched) return;
    this.isFlipped = false;

    const inner = this.element.firstElementChild as HTMLElement;
    inner.style.transform = 'rotateY(180deg)';
  }

  async markMatched(): Promise<void> {
    this.isMatched = true;
    this.element.classList.add('matched');

    await this.api.pop(this.element);

    // Add glow effect
    const inner = this.element.firstElementChild as HTMLElement;
    inner.style.boxShadow = '0 0 20px rgba(74, 222, 128, 0.6)';
  }

  isRevealed(): boolean {
    return this.isFlipped;
  }

  isDone(): boolean {
    return this.isMatched;
  }

  getEmoji(): string {
    return this.front.textContent || '';
  }
}
