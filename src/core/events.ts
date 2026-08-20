// ============================================
// EventBus — Namespaced, error-safe event system
// ============================================

export class EventBus {
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  on(namespace: string, event: string, callback: (data: unknown) => void): () => void {
    const key = `${namespace}:${event}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  emit(namespace: string, event: string, data?: unknown): void {
    const key = `${namespace}:${event}`;
    const cbs = this.listeners.get(key);
    if (!cbs) return;

    cbs.forEach(cb => {
      try {
        cb(data);
      } catch (e) {
        console.error(`EventBus error in ${key}:`, e);
        // One bad listener does not kill the bus for others
      }
    });
  }

  offNamespace(namespace: string): void {
    for (const key of this.listeners.keys()) {
      if (key.startsWith(`${namespace}:`)) {
        this.listeners.delete(key);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const globalEvents = new EventBus();
