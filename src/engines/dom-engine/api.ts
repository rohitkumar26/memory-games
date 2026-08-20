// ============================================
// DOMEngineAPI — The API exposed to games using dom-engine
// ============================================

import type { EngineAPI } from '../../core/types';
import { DOMRenderer } from './renderer';
import { InputManager } from './input';
import { globalAudio } from '../../core/audio';
import { Storage } from '../../core/storage';
import { globalEvents } from '../../core/events';

export function createEngineAPI(
  gameId: string,
  container: HTMLElement
): EngineAPI {
  const renderer = new DOMRenderer(container);
  const input = new InputManager();
  const storage = new Storage(gameId);

  // Track animations and timers for safe cleanup
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
    // DOM & Rendering
    createElement: (tag, classes, text) => renderer.createElement(tag, classes || [], text),
    createBoard: (rows, cols) => renderer.createBoard(rows, cols),
    animate: wrapAnimate,
    addClass: (el, ...classes) => renderer.addClass(el, ...classes),
    removeClass: (el, ...classes) => renderer.removeClass(el, ...classes),

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
    showConfetti: () => renderer.showConfetti(),
    shake: (el) => renderer.shake(el),
    pop: (el) => renderer.pop(el),

    // Events (namespaced)
    emit: (event, data) => globalEvents.emit(gameId, event, data),
    on: (event, cb) => globalEvents.on(gameId, event, cb),

    // Timer (tracked)
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

    getContainer: () => renderer.getContainer(),

    // Internal cleanup helpers (used by engine.ts)
    _cleanup: () => {
      activeAnimations.forEach(a => a.cancel());
      activeAnimations.clear();
      activeTimers.forEach(id => window.clearTimeout(id));
      activeTimers.clear();
      input.clearAll();
      renderer.clear();
      globalEvents.offNamespace(gameId);
    }
  } as EngineAPI & { _cleanup: () => void };
}
