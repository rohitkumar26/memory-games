// ============================================
// Utilities — Math, random, color, DOM helpers
// ============================================

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function throttle<T extends (...args: unknown[]) => void>(
  fn: T, 
  delay: number
): (...args: Parameters<T>) => void {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn(...args);
    }
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Kid-friendly color palettes
// NOTE: entries are arrays of individual class tokens (not space-joined
// strings) because classList.add() throws InvalidCharacterError on any
// token containing a space. Always spread these into createElement's
// classes array — never pass an entry in directly as one array element.
export const COLOR_PALETTES = {
  cards: [
    ['from-pink-400', 'to-rose-400'],
    ['from-blue-400', 'to-cyan-400'],
    ['from-green-400', 'to-emerald-400'],
    ['from-yellow-400', 'to-orange-400'],
    ['from-purple-400', 'to-violet-400'],
    ['from-red-400', 'to-pink-400'],
    ['from-teal-400', 'to-cyan-400'],
    ['from-orange-400', 'to-red-400'],
  ],
  backgrounds: [
    ['bg-gradient-to-br', 'from-blue-50', 'via-purple-50', 'to-pink-50'],
    ['bg-gradient-to-br', 'from-green-50', 'via-teal-50', 'to-cyan-50'],
    ['bg-gradient-to-br', 'from-yellow-50', 'via-orange-50', 'to-red-50'],
  ]
};
