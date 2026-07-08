import { describe, expect, it, vi } from 'vitest';
import {
  __TEST_ONLY__,
  abortRuntimeSession,
  completeRuntimeSession,
  createRuntimeSession,
  emitRuntimeEvent,
  getRuntimeSession,
  getRuntimeSessionSnapshot,
  listRuntimeSessions,
  markRuntimeSessionRunning,
  setRuntimeSessionHooks,
  subscribeRuntimeSession,
  updateRuntimeSessionMetadata,
  unsubscribeRuntimeSession,
} from '@/core/src/ai/server/runtime-session';

describe('runtime session manager', () => {
  it('should replay buffered events to reattached subscribers', () => {
    const session = createRuntimeSession('agent-turn');
    markRuntimeSessionRunning(session.id);
    emitRuntimeEvent(session.id, { type: 'text', content: 'a' });
    emitRuntimeEvent(session.id, { type: 'text', content: 'b' });

    const received: any[] = [];
    subscribeRuntimeSession(session.id, 'client-1', 1, (event) => {
      received.push(event);
    });

    expect(received).toHaveLength(1);
    expect(received[0].content).toBe('b');
  });

  it('should mark terminal sessions detached when last subscriber leaves', () => {
    const session = createRuntimeSession('terminal', { detachGraceMs: 10_000 });
    subscribeRuntimeSession(session.id, 'client-1', 0, () => {});
    unsubscribeRuntimeSession(session.id, 'client-1');

    expect(getRuntimeSessionSnapshot(session.id)?.status).toBe('detached');
  });

  it('should call abort hook and mark session aborted', () => {
    const session = createRuntimeSession('agent-turn');
    const abort = vi.fn();
    markRuntimeSessionRunning(session.id);
    setRuntimeSessionHooks(session.id, { abort });

    expect(abortRuntimeSession(session.id)).toBe(true);
    expect(abort).toHaveBeenCalledTimes(1);
    expect(getRuntimeSessionSnapshot(session.id)?.status).toBe('aborted');
  });

  it('should expose completed status after completion', () => {
    const session = createRuntimeSession('agent-turn');
    markRuntimeSessionRunning(session.id);
    completeRuntimeSession(session.id, 'completed');

    expect(getRuntimeSessionSnapshot(session.id)?.status).toBe('completed');
  });

  it('should return null or false for missing sessions', () => {
    expect(getRuntimeSession('missing')).toBeNull();
    expect(emitRuntimeEvent('missing', { type: 'text' })).toBeNull();
    expect(subscribeRuntimeSession('missing', 'client', 0, vi.fn())).toBeNull();
    expect(getRuntimeSessionSnapshot('missing')).toBeNull();
    expect(abortRuntimeSession('missing')).toBe(false);

    expect(() => {
      setRuntimeSessionHooks('missing', { abort: vi.fn() });
      updateRuntimeSessionMetadata('missing', { a: 1 });
      markRuntimeSessionRunning('missing');
      unsubscribeRuntimeSession('missing', 'client');
      completeRuntimeSession('missing', 'completed');
    }).not.toThrow();
  });

  it('should trim old events and ignore subscriber send errors', () => {
    const session = createRuntimeSession('agent-turn', { maxEvents: 2 });
    const badSend = vi.fn(() => {
      throw new Error('send failed');
    });

    subscribeRuntimeSession(session.id, 'bad-client', 0, badSend);
    emitRuntimeEvent(session.id, { type: 'text', content: 'a' });
    emitRuntimeEvent(session.id, { type: 'text', content: 'b' });
    emitRuntimeEvent(session.id, { type: 'text', content: 'c' });

    expect(getRuntimeSession(session.id)?.events.map((event) => event.content)).toEqual([
      'b',
      'c',
    ]);
    expect(badSend).toHaveBeenCalledTimes(3);
  });

  it('should update metadata and list active sessions', () => {
    const session = createRuntimeSession('agent-turn', {
      metadata: { provider: 'codex' },
    });
    updateRuntimeSessionMetadata(session.id, { model: 'gpt-5-codex' });

    expect(getRuntimeSessionSnapshot(session.id)).toMatchObject({
      id: session.id,
      kind: 'agent-turn',
      status: 'pending',
      lastSeq: 0,
      metadata: { provider: 'codex', model: 'gpt-5-codex' },
    });
    expect(listRuntimeSessions().some((item) => item.id === session.id)).toBe(
      true,
    );
  });

  it('should restore detached sessions to running when resubscribed', () => {
    const session = createRuntimeSession('terminal', { detachGraceMs: 10_000 });
    subscribeRuntimeSession(session.id, 'client-1', 0, vi.fn());
    unsubscribeRuntimeSession(session.id, 'client-1');
    expect(getRuntimeSessionSnapshot(session.id)?.status).toBe('detached');

    const result = subscribeRuntimeSession(session.id, 'client-2', 0, vi.fn());
    expect(result?.session.status).toBe('running');
  });

  it('should keep a session active while other subscribers remain', () => {
    const session = createRuntimeSession('terminal');
    subscribeRuntimeSession(session.id, 'client-1', 0, vi.fn());
    subscribeRuntimeSession(session.id, 'client-2', 0, vi.fn());

    unsubscribeRuntimeSession(session.id, 'client-1');

    expect(getRuntimeSessionSnapshot(session.id)?.status).toBe('running');
    expect(getRuntimeSession(session.id)?.subscribers.size).toBe(1);
  });

  it('should not subscribe clients to final sessions', () => {
    const session = createRuntimeSession('agent-turn');
    markRuntimeSessionRunning(session.id);
    emitRuntimeEvent(session.id, { type: 'text', content: 'done' });
    completeRuntimeSession(session.id, 'completed');

    const send = vi.fn();
    const result = subscribeRuntimeSession(session.id, 'late-client', 0, send);

    expect(result?.isFinal).toBe(true);
    expect(result?.replayedEvents.length).toBe(2);
    expect(getRuntimeSession(session.id)?.subscribers.size).toBe(0);
  });

  it('should schedule cleanup for final sessions when the last subscriber leaves', () => {
    vi.useFakeTimers();
    try {
      const session = createRuntimeSession('terminal', {
        retainCompletedMs: 100,
      });
      subscribeRuntimeSession(session.id, 'client-1', 0, vi.fn());
      completeRuntimeSession(session.id, 'completed');
      subscribeRuntimeSession(session.id, 'client-1', 0, vi.fn());
      unsubscribeRuntimeSession(session.id, 'client-1');

      expect(getRuntimeSession(session.id)).not.toBeNull();
      vi.advanceTimersByTime(100);
      expect(getRuntimeSession(session.id)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should destroy sessions immediately for zero-delay cleanup and ignore cleanup errors', () => {
    const session = createRuntimeSession('agent-turn');
    const cleanup = vi.fn(() => {
      throw new Error('cleanup failed');
    });
    setRuntimeSessionHooks(session.id, { cleanup });

    __TEST_ONLY__.scheduleRuntimeCleanup(session as any, 0);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(getRuntimeSession(session.id)).toBeNull();
  });

  it('should ignore abort hook errors and prevent repeated finalization', () => {
    const session = createRuntimeSession('agent-turn');
    markRuntimeSessionRunning(session.id);
    setRuntimeSessionHooks(session.id, {
      abort: () => {
        throw new Error('abort failed');
      },
    });

    expect(abortRuntimeSession(session.id, 'manual')).toBe(true);
    expect(abortRuntimeSession(session.id)).toBe(false);
    completeRuntimeSession(session.id, 'failed');

    expect(getRuntimeSessionSnapshot(session.id)?.status).toBe('aborted');
  });
});
