// ============================================
// DOM Engine — Universal Engine Manager
// Dispatches to appropriate Engine API based on manifest
// ============================================

import type { GameModule } from '../../core/types';
import { createEngineAPI } from './api';
import { createCanvasEngineAPI } from '../canvas-engine/api';
import { globalEvents } from '../../core/events';

// Resolved once at module load, shared with the page loader
const gameModules = import.meta.glob('/src/games/*/game.ts');
const gameManifests = import.meta.glob('/src/games/*/manifest.json', { eager: true });

export class DOMEngine {
  private container: HTMLElement | null = null;
  private currentGame: GameModule | null = null;
  private api: any = null;

  mount(containerId: string): void {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
  }

  getCurrentGame(): GameModule | null {
    return this.currentGame;
  }

  async load(gameId: string, options?: { level?: number }): Promise<void> {
    if (!this.container) throw new Error('Engine not mounted. Call mount() first.');

    // Unload previous game if any
    if (this.currentGame) {
      await this.unload();
    }

    try {
      const modulePath = `/src/games/${gameId}/game.ts`;
      const manifestPath = `/src/games/${gameId}/manifest.json`;

      const moduleLoader = gameModules[modulePath];
      const manifestMod = gameManifests[manifestPath] as any;
      const manifest = manifestMod?.default || manifestMod;

      if (!moduleLoader || !manifest) {
        throw new Error(`Game "${gameId}" not found`);
      }

      const module = await moduleLoader() as { default: GameModule };

      if (!module.default.init || !module.default.destroy) {
        throw new Error(`Game ${gameId} missing required hooks: init, destroy`);
      }

      if (manifest.engine === 'canvas-engine') {
        this.api = createCanvasEngineAPI(gameId, this.container);
      } else {
        this.api = createEngineAPI(gameId, this.container);
      }

      this.currentGame = module.default;

      const g = this.currentGame as any;
      if (options?.level && options.level > 0) {
        g.currentLevel = options.level;
        if ('currentPathIdx' in g) {
          g.currentPathIdx = Math.max(0, Math.min(options.level - 1, 4));
        }
        if ('currentShapeIdx' in g) {
          g.currentShapeIdx = Math.max(0, Math.min(options.level - 1, 4));
        }
        if (typeof g.deserialize === 'function') {
          g.deserialize({ version: '1.0.0', timestamp: Date.now(), data: { level: options.level, shapeIdx: options.level - 1, pathIdx: options.level - 1 } });
        }
      }

      await this.currentGame.init(this.api);

      if (options?.level && typeof g.buildMenu === 'function') {
        g.currentLevel = options.level;
        if ('currentPathIdx' in g) {
          g.currentPathIdx = Math.max(0, Math.min(options.level - 1, 4));
        }
        if ('currentShapeIdx' in g) {
          g.currentShapeIdx = Math.max(0, Math.min(options.level - 1, 4));
        }
        g.buildMenu();
      }

    } catch (e) {
      console.error(`Failed to load game ${gameId}:`, e);
      this.showErrorScreen(
        'Oops! This game isn\'t working right now.',
        'Try another game or come back later.'
      );
      globalEvents.emit('system', 'game.load.error', { gameId, error: (e as Error).message });
    }
  }

  async start(level?: number): Promise<void> {
    if (level && this.currentGame) {
      if (typeof this.currentGame.deserialize === 'function') {
        this.currentGame.deserialize({ version: '1.0.0', timestamp: Date.now(), data: { level } });
      }
      const g = this.currentGame as any;
      if (typeof g.startGame === 'function') {
        g.isPlaying = true;
        g.startGame(level, g.currentTheme || g.currentPackIdx || g.currentShapeIdx || 0);
        return;
      }
    }
    await this.currentGame?.start();
  }

  pause(): void {
    this.currentGame?.pause?.();
  }

  resume(): void {
    this.currentGame?.resume?.();
  }

  async unload(): Promise<void> {
    if (this.currentGame) {
      await this.currentGame.destroy();
      this.currentGame = null;
    }
    if (this.api && typeof this.api._cleanup === 'function') {
      this.api._cleanup();
      this.api = null;
    }
  }

  private showErrorScreen(title: string, message: string): void {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div class="text-6xl mb-4">😕</div>
        <h2 class="text-2xl font-bold text-gray-700 mb-2">${title}</h2>
        <p class="text-gray-500">${message}</p>
        <a href="/" class="mt-6 px-6 py-3 bg-purple-500 text-white rounded-2xl font-bold hover:bg-purple-600 transition">
          🏠 Back to Games
        </a>
      </div>
    `;
  }
}

if (typeof window !== 'undefined') {
  (window as any).GameEngine = new DOMEngine();
}
