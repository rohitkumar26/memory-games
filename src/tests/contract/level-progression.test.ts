import { describe, it, expect, beforeAll } from 'vitest';
import { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const GAMES_DIR = './src/games';

function getGameIds(): string[] {
  try {
    return readdirSync(GAMES_DIR).filter(id => {
      const stat = statSync(join(GAMES_DIR, id));
      return stat.isDirectory() && existsSync(join(GAMES_DIR, id, 'game.ts'));
    });
  } catch {
    return [];
  }
}

const mockCtx = {
  beginPath: () => {},
  closePath: () => {},
  arc: () => {},
  stroke: () => {},
  fill: () => {},
  moveTo: () => {},
  lineTo: () => {},
  clearRect: () => {},
  resetTransform: () => {},
  scale: () => {},
  save: () => {},
  restore: () => {},
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'round',
  lineJoin: 'round',
  setLineDash: () => {},
  fillText: () => {},
  strokeText: () => {},
  measureText: () => ({ width: 10 })
};

const createMockElement = (tag: string = 'div') => ({
  tagName: tag.toUpperCase(),
  appendChild: () => {},
  remove: () => {},
  classList: { add: () => {}, remove: () => {} },
  style: {},
  setAttribute: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  getContext: () => mockCtx,
  animate: () => Promise.resolve(),
  getBoundingClientRect: () => ({ width: 600, height: 400, top: 0, left: 0 }),
  innerHTML: '',
  textContent: ''
});

const mockContainer = {
  innerHTML: '',
  appendChild: () => {},
  remove: () => {},
  querySelector: () => createMockElement(),
  querySelectorAll: () => [],
  classList: { add: () => {}, remove: () => {} },
  style: {}
} as any;

const mockApi = {
  createElement: (tag: string) => createMockElement(tag),
  createBoard: () => createMockElement('div'),
  createCanvas: () => ({
    canvas: createMockElement('canvas'),
    ctx: mockCtx
  }),
  animate: () => Promise.resolve(),
  onTap: () => {},
  onDrag: () => {},
  playSound: () => {},
  isMuted: () => true,
  save: () => {},
  load: () => null,
  clearSave: () => {},
  showConfetti: () => {},
  shake: () => Promise.resolve(),
  pop: () => Promise.resolve(),
  emit: () => {},
  on: () => () => {},
  delay: () => Promise.resolve(),
  setTimeout: () => 1,
  clearTimeout: () => {},
  getContainer: () => mockContainer,
  _cleanup: () => {}
} as any;

beforeAll(() => {
  const raf = (cb: any) => 1;
  const caf = (id: any) => {};

  (globalThis as any).requestAnimationFrame = raf;
  (globalThis as any).cancelAnimationFrame = caf;

  (globalThis as any).window = {
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 1,
    clearTimeout: () => {},
    requestAnimationFrame: raf,
    cancelAnimationFrame: caf,
    AudioContext: class {
      createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
      createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
      get destination() { return {}; }
      get currentTime() { return 0; }
    },
    webkitAudioContext: class {
      createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {} }; }
      createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
      get destination() { return {}; }
      get currentTime() { return 0; }
    }
  };
  (globalThis as any).document = {
    createElement: (tag: string) => createMockElement(tag),
    body: { appendChild: () => {} }
  };
});

const gameIds = getGameIds();

describe('Level Progression & startGame(level) Contract Tests', () => {
  gameIds.forEach(gameId => {
    it(`correctly advances currentLevel when startGame(2) is called for ${gameId}`, async () => {
      const mod = await import(join(process.cwd(), GAMES_DIR, gameId, 'game.ts'));
      const game = mod.default;

      if (typeof game.init === 'function') {
        game.container = mockContainer;
        await game.init(mockApi);
      }

      if (typeof game.startGame === 'function') {
        // Start Level 1
        game.startGame(1);
        expect(game.currentLevel).toBe(1);

        // Advance to Level 2 (Next Level button action)
        game.startGame(2);
        expect(game.currentLevel).toBe(2);

        // Advance to Level 3
        game.startGame(3);
        expect(game.currentLevel).toBe(3);
      }
    });

    it(`reports cumulative completion percentage in handleWin for ${gameId}`, async () => {
      const mod = await import(join(process.cwd(), GAMES_DIR, gameId, 'game.ts'));
      const game = mod.default;

      let reportedScore = -1;
      (globalThis as any).window.SCORMBridge = {
        getInstance: () => ({
          reportCompletion: (score: number) => {
            reportedScore = score;
          }
        })
      };

      if (typeof game.init === 'function') {
        game.container = mockContainer;
        await game.init(mockApi);
      }

      if (typeof game.handleWin === 'function') {
        // Level 1 Win
        game.currentLevel = 1;
        await game.handleWin();
        expect(reportedScore).toBe(20);

        // Level 2 Win
        game.currentLevel = 2;
        await game.handleWin();
        expect(reportedScore).toBe(40);

        // Level 5 Win
        game.currentLevel = 5;
        await game.handleWin();
        expect(reportedScore).toBe(100);
      }
    });
  });
});
