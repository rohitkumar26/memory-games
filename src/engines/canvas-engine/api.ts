// ============================================
// CanvasEngineAPI — The API exposed to games using canvas-engine
// ============================================

import type { EngineAPI } from '../../core/types';
import { CanvasRenderer } from './renderer';
import { DOMRenderer } from '../dom-engine/renderer';
import { InputManager } from '../dom-engine/input';
import { globalAudio } from '../../core/audio';
import { Storage } from '../../core/storage';
import { globalEvents } from '../../core/events';

export interface CanvasEngineAPI extends EngineAPI {
  createCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D };
}

export function createCanvasEngineAPI(
  gameId: string,
  container: HTMLElement
): CanvasEngineAPI {
  const canvasRenderer = new CanvasRenderer(container);
  const domRenderer = new DOMRenderer(container);
  const input = new InputManager();
  const storage = new Storage(gameId);

  const activeAnimations: Set<Animation> = new Set();
  const activeTimers: Set<number> = new Set();

  const wrapAnimate = (el: HTMLElement, keyframes: Keyframe[], options?: KeyframeAnimationOptions) => {
    const anim = el.animate(keyframes, {
      duration: 300,
      easing: 'ease-out',
      fill: 'both',
      ...options
    });
    activeAnimations.add(anim);
    return anim.finished.then(() => {
      activeAnimations.delete(anim);
      return anim;
    });
  };

  return {
    // Canvas specific
    createCanvas: () => canvasRenderer.createCanvas(),

    // DOM & Rendering
    createElement: (tag, classes, text) => domRenderer.createElement(tag, classes || [], text),
    createBoard: (rows, cols) => domRenderer.createBoard(rows, cols),
    animate: wrapAnimate,
    addClass: (el, ...classes) => domRenderer.addClass(el, ...classes),
    removeClass: (el, ...classes) => domRenderer.removeClass(el, ...classes),

    // Input
    onTap: (el, cb) => input.onTap(el, cb),
    onDrag: (el, cbs) => input.onDrag(el, cbs),

    // Audio
    playSound: (type: any) => {
      globalAudio.unlock().then(() => globalAudio.play(type));
    },
    setVolume: (vol) => globalAudio.setVolume(vol),
    toggleMute: () => globalAudio.toggleMute(),
    isMuted: () => globalAudio.isAudioMuted(),

    // Data
    save: (key, data) => storage.save(key, data),
    load: (key) => storage.load(key),
    clearSave: () => storage.clear(),

    // FX
    showConfetti: () => domRenderer.showConfetti(),
    shake: (el) => domRenderer.shake(el),
    pop: (el) => domRenderer.pop(el),

    // Events
    emit: (event, data) => globalEvents.emit(gameId, event, data),
    on: (event, cb) => globalEvents.on(gameId, event, cb),

    // Timers
    delay: (ms) => new Promise(resolve => {
      const id = window.setTimeout(() => {
        activeTimers.delete(id);
        resolve();
      }, ms);
      activeTimers.add(id);
    }),
    setTimeout: (cb, ms) => {
      const id = window.setTimeout(() => {
        activeTimers.delete(id);
        cb();
      }, ms);
      activeTimers.add(id);
      return id;
    },
    clearTimeout: (id) => {
      window.clearTimeout(id);
      activeTimers.delete(id);
    },

    getContainer: () => container,

    _cleanup: () => {
      activeAnimations.forEach(a => a.cancel());
      activeAnimations.clear();
      activeTimers.forEach(id => window.clearTimeout(id));
      activeTimers.clear();
      input.clearAll();
      canvasRenderer.clear();
      domRenderer.clear();
      globalEvents.offNamespace(gameId);
    }
  } as CanvasEngineAPI & { _cleanup: () => void };
}
