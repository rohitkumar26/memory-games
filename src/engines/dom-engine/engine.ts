// ============================================
// DOM Engine — Lifecycle manager for DOM-based games
// ============================================

import type { GameModule } from '../../core/types';
import { createEngineAPI } from './api';

// Resolved once at module load, shared with the page loader
const gameModules = import.meta.glob('/src/games/*/game.ts');
const gameManifests = import.meta.glob('/src/games/*/manifest.json', { eager: true });

export class DOMEngine {
  private container: HTMLElement | null = null;
  private currentGame: GameModule | null = null;
  private api: ReturnType<typeof createEngineAPI> | null = null;

  mount(containerId: string): void {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
  }

  async load(gameId: string): Promise<void> {
    if (!this.container) throw new Error('Engine not mounted. Call mount() first.');

    // Unload previous game if any
    if (this.currentGame) {
      await this.unload();
    }

    try {
      const modulePath = `/src/games/${gameId}/game.ts`;
      const manifestPath = `/src/games/${gameId}/manifest.json`;

      const moduleLoader = gameModules[modulePath];
      const manifest = gameManifests[manifestPath];

      if (!moduleLoader || !manifest) {
        throw new Error(`Game "${gameId}" not found`);
      }

      const module = await moduleLoader() as { default: GameModule };

      if (!module.default.init || !module.default.destroy) {
        throw new Error(`Game ${gameId} missing required hooks: init, destroy`);
      }

      this.api = createEngineAPI(gameId, this.container);
      this.currentGame = module.default;

      await this.currentGame.init(this.api);

    } catch (e) {
      console.error(`Failed to load game ${gameId}:`, e);
      this.showErrorScreen(
        'Oops! This game isn\'t working right now.',
        'Try another game or come back later.'
      );
      globalEvents.emit('system', 'game.load.error', { gameId, error: (e as Error).message });
    }
  }

  async start(): Promise<void> {
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
    if (this.api) {
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
        <a href="/" class="mt-6 px-6 py-3 bg-kid-blue text-white rounded-2xl font-bold hover:bg-blue-500 transition">
          🏠 Back to Games
        </a>
      </div>
    `;
  }
}

// Global singleton
import { globalEvents } from '../../core/events';

(window as any).GameEngine = new DOMEngine();
