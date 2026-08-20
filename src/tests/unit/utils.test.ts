import { describe, it, expect } from 'vitest';
import { shuffle, randomInt, clamp, formatTime, COLOR_PALETTES } from '../../core/utils';
import { validateManifest } from '../../core/validators';
import type { GameManifest } from '../../core/types';

describe('Utils Module', () => {
  describe('shuffle()', () => {
    it('returns an array containing the exact same elements', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = shuffle(original);

      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort((a, b) => a - b)).toEqual(original);
    });

    it('does not mutate original array', () => {
      const original = ['a', 'b', 'c', 'd'];
      const copy = [...original];
      shuffle(original);
      expect(original).toEqual(copy);
    });
  });

  describe('randomInt()', () => {
    it('generates integer within inclusive bounds', () => {
      for (let i = 0; i < 50; i++) {
        const val = randomInt(3, 7);
        expect(val).toBeGreaterThanOrEqual(3);
        expect(val).toBeLessThanOrEqual(7);
        expect(Number.isInteger(val)).toBe(true);
      }
    });
  });

  describe('clamp()', () => {
    it('clamps values correctly', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('formatTime()', () => {
    it('formats seconds into M:SS strings', () => {
      expect(formatTime(0)).toBe('0:00');
      expect(formatTime(9)).toBe('0:09');
      expect(formatTime(65)).toBe('1:05');
      expect(formatTime(130)).toBe('2:10');
    });
  });

  describe('COLOR_PALETTES', () => {
    it('has valid card gradients without spaces in tokens', () => {
      expect(COLOR_PALETTES.cards.length).toBeGreaterThan(0);
      for (const palette of COLOR_PALETTES.cards) {
        for (const token of palette) {
          expect(token).not.toContain(' ');
        }
      }
    });
  });
});

describe('Manifest Validators', () => {
  const validManifest: GameManifest = {
    id: 'test-game',
    name: 'Test Game',
    description: 'A test game for validation testing',
    version: '1.0.0',
    engine: 'dom-engine',
    category: 'visual-spatial',
    difficulty: { min: 1, max: 5, default: 1 },
    ageRange: { min: 3, max: 10 },
    assets: { images: [], sounds: [] }
  };

  it('validates compliant manifest', () => {
    const res = validateManifest(validManifest);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('catches invalid kebab-case id', () => {
    const res = validateManifest({ ...validManifest, id: 'Test Game!' });
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('id:'))).toBe(true);
  });

  it('catches invalid semver version', () => {
    const res = validateManifest({ ...validManifest, version: '1.0' });
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('version:'))).toBe(true);
  });

  it('catches invalid engine', () => {
    const res = validateManifest({ ...validManifest, engine: 'unreal-engine' });
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('engine:'))).toBe(true);
  });
});
