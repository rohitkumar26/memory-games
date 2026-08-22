import type { EngineAPI } from '../../../core/types';

export class Score {
  element: HTMLElement;
  private scoreDisplay: HTMLElement;
  private movesDisplay: HTMLElement;
  private score = 0;
  private moves = 0;
  private api: EngineAPI;

  constructor(api: EngineAPI) {
    this.api = api;
    this.element = this.build();
  }

  private build(): HTMLElement {
    const wrapper = this.api.createElement('div', [
      'flex', 'items-center', 'gap-4'
    ]);

    // Score badge
    const scoreBadge = this.api.createElement('div', [
      'flex', 'items-center', 'gap-2', 'bg-kid-yellow/80', 'backdrop-blur',
      'rounded-2xl', 'px-4', 'py-2', 'shadow-md'
    ]);
    const scoreIcon = this.api.createElement('span', ['text-2xl']);
    scoreIcon.textContent = '⭐';
    scoreBadge.appendChild(scoreIcon);
    this.scoreDisplay = this.api.createElement('span', [
      'text-xl', 'font-bold', 'text-gray-800'
    ]);
    this.scoreDisplay.textContent = '0';
    scoreBadge.appendChild(this.scoreDisplay);
    wrapper.appendChild(scoreBadge);

    // Moves badge
    const movesBadge = this.api.createElement('div', [
      'flex', 'items-center', 'gap-2', 'bg-kid-pink/80', 'backdrop-blur',
      'rounded-2xl', 'px-4', 'py-2', 'shadow-md'
    ]);
    const movesIcon = this.api.createElement('span', ['text-2xl']);
    movesIcon.textContent = '🔄';
    movesBadge.appendChild(movesIcon);
    this.movesDisplay = this.api.createElement('span', [
      'text-xl', 'font-bold', 'text-gray-800'
    ]);
    this.movesDisplay.textContent = '0';
    movesBadge.appendChild(this.movesDisplay);
    wrapper.appendChild(movesBadge);

    return wrapper;
  }

  addMatch(bonus = 0): void {
    const points = 100 + bonus;
    this.score += points;
    this.updateScore();
    this.api.pop(this.scoreDisplay);
  }

  addMove(): void {
    this.moves++;
    this.movesDisplay.textContent = String(this.moves);
  }

  getScore(): number {
    return this.score;
  }

  getMoves(): number {
    return this.moves;
  }

  reset(): void {
    this.score = 0;
    this.moves = 0;
    this.updateScore();
    this.movesDisplay.textContent = '0';
  }

  private updateScore(): void {
    this.scoreDisplay.textContent = String(this.score);
    if (typeof window !== 'undefined') {
      (window as any).__scormLiveScore = this.score;
      if ((window as any).SCORMBridge) {
        try {
          const scorm = (window as any).SCORMBridge.getInstance();
          scorm?.reportScore(this.score);
        } catch (e) {}
      }
    }
  }
}
