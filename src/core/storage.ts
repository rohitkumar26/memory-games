// ============================================
// Storage — Namespaced, COPPA-safe localStorage wrapper
// ============================================

const PREFIX = 'mg_';

export class Storage {
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  save(key: string, data: unknown): void {
    try {
      const fullKey = `${PREFIX}${this.namespace}_${key}`;
      localStorage.setItem(fullKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  load<T>(key: string): T | null {
    try {
      const fullKey = `${PREFIX}${this.namespace}_${key}`;
      const raw = localStorage.getItem(fullKey);
      return raw ? JSON.parse(raw) as T : null;
    } catch (e) {
      console.warn('Storage load failed:', e);
      return null;
    }
  }

  clear(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${PREFIX}${this.namespace}_`)) {
        localStorage.removeItem(key);
      }
    }
  }

  // COPPA/GDPR-K: One-call purge for a child's data
  // NOTE: Phase 3 To-Do — Wire this to a "Delete My Data" button in the parental dashboard.
  // Required for COPPA/GDPR-K "right to deletion." Do not ship Phase 3 without it.
  static purgeAll(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
}
