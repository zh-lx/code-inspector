import type { RecordInfo } from '../shared/type';
import { getProjectId } from '../shared/runtime-path';
export interface ServerStartupLock {
    path: string;
    token: string;
}
export { getProjectId };
export declare function getServerStartupLockPath(record: RecordInfo): string;
export declare function tryAcquireServerStartupLock(record: RecordInfo): ServerStartupLock | undefined;
export declare function releaseServerStartupLock(lock: ServerStartupLock): void;
