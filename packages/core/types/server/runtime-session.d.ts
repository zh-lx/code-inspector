export type RuntimeSessionKind = 'agent-turn' | 'terminal';
export type RuntimeSessionStatus = 'pending' | 'running' | 'detached' | 'completed' | 'aborted' | 'failed';
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
declare function destroyRuntimeSession(sessionId: string): void;
declare function scheduleRuntimeCleanup(session: RuntimeSessionRecord, delayMs: number): void;
export declare function createRuntimeSession(kind: RuntimeSessionKind, options?: CreateRuntimeSessionOptions): RuntimeSessionRecord;
export declare function getRuntimeSession(sessionId: string): RuntimeSessionRecord | null;
export declare function listRuntimeSessions(): RuntimeSessionRecord[];
export declare function setRuntimeSessionHooks(sessionId: string, hooks: {
    abort?: (() => void) | null;
    cleanup?: (() => void) | null;
}): void;
export declare function updateRuntimeSessionMetadata(sessionId: string, patch: Record<string, any>): void;
export declare function markRuntimeSessionRunning(sessionId: string): void;
export declare function emitRuntimeEvent(sessionId: string, event: Omit<RuntimeEvent, 'seq'>): RuntimeEvent | null;
export declare function completeRuntimeSession(sessionId: string, status: Extract<RuntimeSessionStatus, 'completed' | 'aborted' | 'failed'>, reason?: string): void;
export declare function abortRuntimeSession(sessionId: string, reason?: string): boolean;
export declare function subscribeRuntimeSession(sessionId: string, clientId: string, cursor: number, send: (event: RuntimeEvent) => void): {
    session: RuntimeSessionRecord;
    replayedEvents: RuntimeEvent[];
    isFinal: boolean;
} | null;
export declare function unsubscribeRuntimeSession(sessionId: string, clientId: string): void;
export declare function getRuntimeSessionSnapshot(sessionId: string): {
    id: string;
    kind: RuntimeSessionKind;
    status: RuntimeSessionStatus;
    lastSeq: number;
    metadata: Record<string, any>;
} | null;
export declare const __TEST_ONLY__: {
    destroyRuntimeSession: typeof destroyRuntimeSession;
    scheduleRuntimeCleanup: typeof scheduleRuntimeCleanup;
};
export {};
