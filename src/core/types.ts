// ============================================
// Core Types — Shared across all engines & games
// ============================================

export interface GameModule {
  id: string;
  name: string;

  init(api: EngineAPI): void | Promise<void>;
  start(): void | Promise<void>;
  pause?(): void;
  resume?(): void;
  destroy(): void | Promise<void>;

  serialize?(): GameState;
  deserialize?(state: GameState): void;
}

export interface GameState {
  version: string;
  timestamp: number;
  data: unknown;
}

export interface AssetManifest {
  images: string[];
  sounds: string[];
  fonts?: string[];
  videos?: string[];
}

export interface GameManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  engine: string;
  category: string;
  difficulty: {
    min: number;
    max: number;
    default: number;
  };
  ageRange: {
    min: number;
    max: number;
  };
  assets: AssetManifest;
  settings?: Record<string, unknown>;
}

// ============================================
// Engine API — Exposed to every game
// ============================================

export interface EngineAPI {
  // DOM & Rendering
  createElement(tag: string, classes?: string[], text?: string): HTMLElement;
  createBoard(rows: number, cols: number): HTMLElement;
  animate(el: HTMLElement, keyframes: Keyframe[], options?: KeyframeAnimationOptions): Promise<Animation>;
  addClass(el: HTMLElement, ...classes: string[]): void;
  removeClass(el: HTMLElement, ...classes: string[]): void;

  // Input
  onTap(el: HTMLElement, callback: (e: Event) => void): () => void;
  onDrag(el: HTMLElement, callbacks: {
    start?: (e: PointerEvent) => void;
    move?: (e: PointerEvent) => void;
    end?: (e: PointerEvent) => void;
  }): () => void;

  // Audio
  playSound(type: 'flip' | 'match' | 'win' | 'error' | 'click' | 'simon-red' | 'simon-green' | 'simon-blue' | 'simon-yellow' | (string & {})): void;
  setVolume(vol: number): void;
  toggleMute?(): boolean;
  isMuted?(): boolean;

  // Data (namespaced automatically)
  save(key: string, data: unknown): void;
  load<T>(key: string): T | null;
  clearSave(): void;

  // Progression & FX
  showConfetti(): void;
  shake(el: HTMLElement): void;
  pop(el: HTMLElement): void;

  // Events (namespaced automatically)
  emit(event: string, data?: unknown): void;
  on(event: string, callback: (data: unknown) => void): () => void;

  // Timer (tracked for safe cleanup)
  delay(ms: number): Promise<void>;
  setTimeout(callback: () => void, ms: number): number;
  clearTimeout(id: number): void;

  // Container
  getContainer(): HTMLElement;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
