import type { RecordInfo } from '../shared/type';
import { getProjectId } from '../shared/runtime-path';
export interface ServerStartupLock {
    path: string;
    token: string;
}
interface ServerStartupLockContent {
    pid: number;
    createdAt: number;
    token: string;
}
interface ServerStartupLockRecovery {
    pid: number;
    createdAt: number;
    token: string;
}
export { getProjectId };
export declare function getServerStartupLockPath(record: RecordInfo): string;
declare function readServerStartupLock(lockPath: string): ServerStartupLockContent | undefined;
declare function removeServerStartupLock(lockPath: string, token: string): boolean;
declare function isStaleServerStartupLock(lockPath: string, lock?: ServerStartupLockContent): boolean;
declare function getRecoveryPath(lockPath: string): string;
declare function readServerStartupLockRecovery(recoveryPath: string): ServerStartupLockRecovery | undefined;
declare function isStaleRecovery(recoveryPath: string): boolean;
declare function removeRecovery(recoveryPath: string, token: string): boolean;
declare function tryAcquireRecovery(lockPath: string): {
    path: string;
    token: string;
} | undefined;
declare function reclaimServerStartupLock(lockPath: string, observedLock?: ServerStartupLockContent): boolean;
export declare function tryAcquireServerStartupLock(record: RecordInfo): ServerStartupLock | undefined;
export declare function releaseServerStartupLock(lock: ServerStartupLock): void;
export declare const __TEST_ONLY__: {
    getRecoveryPath: typeof getRecoveryPath;
    isStaleRecovery: typeof isStaleRecovery;
    isStaleServerStartupLock: typeof isStaleServerStartupLock;
    readServerStartupLock: typeof readServerStartupLock;
    readServerStartupLockRecovery: typeof readServerStartupLockRecovery;
    reclaimServerStartupLock: typeof reclaimServerStartupLock;
    removeRecovery: typeof removeRecovery;
    removeServerStartupLock: typeof removeServerStartupLock;
    tryAcquireRecovery: typeof tryAcquireRecovery;
};
