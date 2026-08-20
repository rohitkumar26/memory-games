import type { EngineAPI } from '../../../core/types';
import { formatTime } from '../../../core/utils';

export class Timer {
  element: HTMLElement;
  private timeDisplay: HTMLElement;
  private seconds = 0;
  private intervalId: number | null = null;
  private api: EngineAPI;

  constructor(api: EngineAPI) {
    this.api = api;
    this.element = this.build();
  }

  private build(): HTMLElement {
    const wrapper = this.api.createElement('div', [
      'flex', 'items-center', 'gap-2', 'bg-white/80', 'backdrop-blur',
      'rounded-2xl', 'px-4', 'py-2', 'shadow-md'
    ]);

    const icon = this.api.createElement('span', ['text-2xl']);
    icon.textContent = '⏱️';
    wrapper.appendChild(icon);

    this.timeDisplay = this.api.createElement('span', [
      'text-xl', 'font-bold', 'text-gray-700', 'font-mono'
    ]);
    this.timeDisplay.textContent = '0:00';
    wrapper.appendChild(this.timeDisplay);

    return wrapper;
  }

  start(): void {
    if (this.intervalId !== null) return;
    this.intervalId = window.setInterval(() => {
      this.seconds++;
      this.updateDisplay();
    }, 1000);
  }

  pause(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resume(): void {
    this.start();
  }

  stop(): number {
    this.pause();
    return this.seconds;
  }

  reset(): void {
    this.pause();
    this.seconds = 0;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    this.timeDisplay.textContent = formatTime(this.seconds);
  }

  getTime(): number {
    return this.seconds;
  }
}
