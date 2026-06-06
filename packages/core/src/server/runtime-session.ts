import crypto from 'crypto';

export type RuntimeSessionKind = 'agent-turn' | 'terminal';

export type RuntimeSessionStatus =
  | 'pending'
  | 'running'
  | 'detached'
  | 'completed'
  | 'aborted'
  | 'failed';

export type RuntimeEvent = {
  seq: number;
  type: string;
  [key: string]: any;
};

type RuntimeSubscriber = {
  id: string;
  send: (event: RuntimeEvent) => void;
};

type RuntimeSessionRecord = {
  id: string;
  kind: RuntimeSessionKind;
  status: RuntimeSessionStatus;
  createdAt: number;
  updatedAt: number;
  lastSeq: number;
  events: RuntimeEvent[];
  subscribers: Map<string, RuntimeSubscriber>;
  maxEvents: number;
  detachGraceMs: number;
  retainCompletedMs: number;
  cleanupTimer: ReturnType<typeof setTimeout> | null;
  abort: (() => void) | null;
  cleanup: (() => void) | null;
  metadata: Record<string, any>;
};

type CreateRuntimeSessionOptions = {
  maxEvents?: number;
  detachGraceMs?: number;
  retainCompletedMs?: number;
  metadata?: Record<string, any>;
};

const DEFAULT_MAX_EVENTS = 1200;
const DEFAULT_TERMINAL_DETACH_GRACE_MS = 60_000;
const DEFAULT_AGENT_DETACH_GRACE_MS = 0;
const DEFAULT_COMPLETED_RETAIN_MS = 60_000;

const FINAL_STATUSES = new Set<RuntimeSessionStatus>([
  'completed',
  'aborted',
  'failed',
]);

const sessions = new Map<string, RuntimeSessionRecord>();

function now(): number {
  return Date.now();
}

function isFinalStatus(status: RuntimeSessionStatus): boolean {
  return FINAL_STATUSES.has(status);
}

function buildRuntimeSessionId(kind: RuntimeSessionKind): string {
  const prefix = kind === 'terminal' ? 'rt-term' : 'rt-agent';
  return `${prefix}-${now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function clearCleanupTimer(session: RuntimeSessionRecord): void {
  if (session.cleanupTimer) {
    clearTimeout(session.cleanupTimer);
    session.cleanupTimer = null;
  }
}

function destroyRuntimeSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  clearCleanupTimer(session);
  try {
    session.cleanup?.();
  } catch {
    // ignore cleanup errors
  }
  sessions.delete(sessionId);
}

function scheduleRuntimeCleanup(
  session: RuntimeSessionRecord,
  delayMs: number,
): void {
  clearCleanupTimer(session);
  if (delayMs <= 0) {
    destroyRuntimeSession(session.id);
    return;
  }
  session.cleanupTimer = setTimeout(() => {
    destroyRuntimeSession(session.id);
  }, delayMs);
}

function trimRuntimeEvents(session: RuntimeSessionRecord): void {
  if (session.events.length <= session.maxEvents) return;
  session.events.splice(0, session.events.length - session.maxEvents);
}

function appendRuntimeEvent(
  session: RuntimeSessionRecord,
  event: Omit<RuntimeEvent, 'seq'>,
): RuntimeEvent {
  const nextEvent = {
    seq: session.lastSeq + 1,
  } as RuntimeEvent;
  Object.assign(nextEvent, event);
  session.lastSeq = nextEvent.seq;
  session.updatedAt = now();
  session.events.push(nextEvent);
  trimRuntimeEvents(session);
  session.subscribers.forEach((subscriber) => {
    try {
      subscriber.send(nextEvent);
    } catch {
      // ignore subscriber errors
    }
  });
  return nextEvent;
}

export function createRuntimeSession(
  kind: RuntimeSessionKind,
  options?: CreateRuntimeSessionOptions,
): RuntimeSessionRecord {
  const session: RuntimeSessionRecord = {
    id: buildRuntimeSessionId(kind),
    kind,
    status: 'pending',
    createdAt: now(),
    updatedAt: now(),
    lastSeq: 0,
    events: [],
    subscribers: new Map(),
    maxEvents: options?.maxEvents || DEFAULT_MAX_EVENTS,
    detachGraceMs:
      options?.detachGraceMs ??
      (kind === 'terminal'
        ? DEFAULT_TERMINAL_DETACH_GRACE_MS
        : DEFAULT_AGENT_DETACH_GRACE_MS),
    retainCompletedMs:
      options?.retainCompletedMs ?? DEFAULT_COMPLETED_RETAIN_MS,
    cleanupTimer: null,
    abort: null,
    cleanup: null,
    metadata: { ...(options?.metadata || {}) },
  };
  sessions.set(session.id, session);
  return session;
}

export function getRuntimeSession(
  sessionId: string,
): RuntimeSessionRecord | null {
  return sessions.get(sessionId) || null;
}

export function listRuntimeSessions(): RuntimeSessionRecord[] {
  return Array.from(sessions.values());
}

export function setRuntimeSessionHooks(
  sessionId: string,
  hooks: {
    abort?: (() => void) | null;
    cleanup?: (() => void) | null;
  },
): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  if (hooks.abort !== undefined) {
    session.abort = hooks.abort;
  }
  if (hooks.cleanup !== undefined) {
    session.cleanup = hooks.cleanup;
  }
}

export function updateRuntimeSessionMetadata(
  sessionId: string,
  patch: Record<string, any>,
): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.metadata = {
    ...session.metadata,
    ...patch,
  };
  session.updatedAt = now();
}

export function markRuntimeSessionRunning(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  clearCleanupTimer(session);
  session.status = 'running';
  session.updatedAt = now();
}

export function emitRuntimeEvent(
  sessionId: string,
  event: Omit<RuntimeEvent, 'seq'>,
): RuntimeEvent | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  return appendRuntimeEvent(session, event);
}

export function completeRuntimeSession(
  sessionId: string,
  status: Extract<RuntimeSessionStatus, 'completed' | 'aborted' | 'failed'>,
  reason?: string,
): void {
  const session = sessions.get(sessionId);
  if (!session || isFinalStatus(session.status)) return;
  session.status = status;
  appendRuntimeEvent(session, {
    type: 'runtime_state',
    status,
    ...(reason ? { reason } : {}),
  });
  scheduleRuntimeCleanup(session, session.retainCompletedMs);
}

export function abortRuntimeSession(
  sessionId: string,
  reason = 'aborted_by_user',
): boolean {
  const session = sessions.get(sessionId);
  if (!session || isFinalStatus(session.status)) return false;
  try {
    session.abort?.();
  } catch {
    // ignore abort errors
  }
  completeRuntimeSession(sessionId, 'aborted', reason);
  return true;
}

export function subscribeRuntimeSession(
  sessionId: string,
  clientId: string,
  cursor: number,
  send: (event: RuntimeEvent) => void,
): {
  session: RuntimeSessionRecord;
  replayedEvents: RuntimeEvent[];
  isFinal: boolean;
} | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  clearCleanupTimer(session);

  if (session.status === 'detached') {
    session.status = 'running';
  } else if (session.status === 'pending') {
    session.status = 'running';
  }

  const replayedEvents = session.events.filter((event) => event.seq > cursor);

  for (const event of replayedEvents) {
    send(event);
  }

  if (!isFinalStatus(session.status)) {
    session.subscribers.set(clientId, { id: clientId, send });
  }

  return {
    session,
    replayedEvents,
    isFinal: isFinalStatus(session.status),
  };
}

export function unsubscribeRuntimeSession(
  sessionId: string,
  clientId: string,
): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.subscribers.delete(clientId);
  session.updatedAt = now();

  if (session.subscribers.size > 0) {
    return;
  }

  if (isFinalStatus(session.status)) {
    scheduleRuntimeCleanup(session, session.retainCompletedMs);
    return;
  }

  session.status = 'detached';

  if (session.kind === 'terminal') {
    scheduleRuntimeCleanup(session, session.detachGraceMs);
  }
}

export function getRuntimeSessionSnapshot(sessionId: string): {
  id: string;
  kind: RuntimeSessionKind;
  status: RuntimeSessionStatus;
  lastSeq: number;
  metadata: Record<string, any>;
} | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  return {
    id: session.id,
    kind: session.kind,
    status: session.status,
    lastSeq: session.lastSeq,
    metadata: { ...session.metadata },
  };
}

export const __TEST_ONLY__ = {
  destroyRuntimeSession,
  scheduleRuntimeCleanup,
};
