import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../core/events';

describe('EventBus Module', () => {
  it('registers listener and receives emitted data with namespace', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('game1', 'score.update', handler);
    bus.emit('game1', 'score.update', { score: 100 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ score: 100 });
  });

  it('unsubscribes when calling returned cleanup function', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsubscribe = bus.on('game1', 'start', handler);
    bus.emit('game1', 'start');
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    bus.emit('game1', 'start');
    expect(handler).toHaveBeenCalledTimes(1); // Still 1
  });

  it('isolates namespaces', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on('gameA', 'win', handler1);
    bus.on('gameB', 'win', handler2);

    bus.emit('gameA', 'win', { player: 'A' });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();
  });

  it('offNamespace removes all listeners for a given namespace', () => {
    const bus = new EventBus();
    const handlerA1 = vi.fn();
    const handlerA2 = vi.fn();
    const handlerB = vi.fn();

    bus.on('gameA', 'event1', handlerA1);
    bus.on('gameA', 'event2', handlerA2);
    bus.on('gameB', 'event1', handlerB);

    bus.offNamespace('gameA');

    bus.emit('gameA', 'event1');
    bus.emit('gameA', 'event2');
    bus.emit('gameB', 'event1');

    expect(handlerA1).not.toHaveBeenCalled();
    expect(handlerA2).not.toHaveBeenCalled();
    expect(handlerB).toHaveBeenCalledTimes(1);
  });

  it('error resilience: throwing listener does not kill other listeners', () => {
    const bus = new EventBus();
    const badHandler = vi.fn(() => {
      throw new Error('Boom!');
    });
    const goodHandler = vi.fn();

    bus.on('game', 'tick', badHandler);
    bus.on('game', 'tick', goodHandler);

    expect(() => {
      bus.emit('game', 'tick', { t: 1 });
    }).not.toThrow();

    expect(badHandler).toHaveBeenCalledTimes(1);
    expect(goodHandler).toHaveBeenCalledTimes(1);
  });
});
