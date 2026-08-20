import { describe, it, expect, beforeEach } from 'vitest';
import { Storage } from '../../core/storage';

// In-memory mock for localStorage in Node test environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  getItem(key: string): string | null {
    return this.store[key] !== undefined ? this.store[key] : null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe('Storage Module', () => {
  beforeEach(() => {
    (global as any).localStorage = new LocalStorageMock();
  });

  it('saves and loads namespaced data correctly', () => {
    const storage = new Storage('game1');
    storage.save('score', 1500);

    const loaded = storage.load<number>('score');
    expect(loaded).toBe(1500);
    expect(localStorage.getItem('mg_game1_score')).toBe('1500');
  });

  it('isolates data between different game namespaces', () => {
    const storageA = new Storage('gameA');
    const storageB = new Storage('gameB');

    storageA.save('level', 5);
    storageB.save('level', 2);

    expect(storageA.load('level')).toBe(5);
    expect(storageB.load('level')).toBe(2);
  });

  it('returns null for missing keys', () => {
    const storage = new Storage('game1');
    expect(storage.load('nonexistent')).toBeNull();
  });

  it('clears only its own namespace data', () => {
    const storageA = new Storage('gameA');
    const storageB = new Storage('gameB');

    storageA.save('item', 'apple');
    storageB.save('item', 'banana');

    storageA.clear();

    expect(storageA.load('item')).toBeNull();
    expect(storageB.load('item')).toBe('banana');
  });

  it('COPPA/GDPR-K: purgeAll removes all mg_ keys across all games', () => {
    const storageA = new Storage('gameA');
    const storageB = new Storage('gameB');
    localStorage.setItem('other_app_key', 'keep_me');

    storageA.save('name', 'Alice');
    storageB.save('score', 100);

    Storage.purgeAll();

    expect(storageA.load('name')).toBeNull();
    expect(storageB.load('score')).toBeNull();
    expect(localStorage.getItem('other_app_key')).toBe('keep_me');
  });
});
