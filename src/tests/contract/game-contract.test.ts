import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { validateManifest } from '../../core/validators';

const GAMES_DIR = './src/games';
const ENGINES_DIR = './src/engines';

// NOTE: Contract tests run in Vitest/Node, not Vite —
// these are standard Node dynamic imports, not bundler-resolved.
function getGameIds(): string[] {
  try {
    return readdirSync(GAMES_DIR).filter(id => {
      const stat = statSync(join(GAMES_DIR, id));
      return stat.isDirectory();
    });
  } catch {
    return [];
  }
}

function getEngineIds(): string[] {
  try {
    return readdirSync(ENGINES_DIR).filter(id => {
      const stat = statSync(join(ENGINES_DIR, id));
      return stat.isDirectory();
    });
  } catch {
    return [];
  }
}

const gameIds = getGameIds();
const engineIds = getEngineIds();

describe('Game Contract Validation', () => {
  it('discovers at least one game', () => {
    expect(gameIds.length).toBeGreaterThan(0);
  });

  it('discovers at least one engine', () => {
    expect(engineIds.length).toBeGreaterThan(0);
  });

  for (const gameId of gameIds) {
    describe(gameId, () => {
      it('has a valid manifest.json', async () => {
        const manifest = await import(join(process.cwd(), GAMES_DIR, gameId, 'manifest.json'));
        const result = validateManifest(manifest.default);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('has a game.ts with required hooks', async () => {
        const module = await import(join(process.cwd(), GAMES_DIR, gameId, 'game.ts'));
        expect(module.default).toBeDefined();
        expect(typeof module.default.init).toBe('function');
        expect(typeof module.default.destroy).toBe('function');
      });

      it('has all declared assets', () => {
        const manifestPath = join(process.cwd(), GAMES_DIR, gameId, 'manifest.json');
        const manifest = require(manifestPath);
        const assetsDir = join(GAMES_DIR, gameId, 'assets');

        for (const img of manifest.assets?.images || []) {
          expect(statSync(join(assetsDir, img)).isFile()).toBe(true);
        }
        for (const snd of manifest.assets?.sounds || []) {
          expect(statSync(join(assetsDir, snd)).isFile()).toBe(true);
        }
      });

      it('uses a valid engine', () => {
        const manifestPath = join(process.cwd(), GAMES_DIR, gameId, 'manifest.json');
        const manifest = require(manifestPath);
        expect(engineIds).toContain(manifest.engine);
      });
    });
  }
});
