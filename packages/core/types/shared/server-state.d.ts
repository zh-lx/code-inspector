import type { RecordInfo } from './type';
export interface ServerRuntimeState {
    protocolVersion: number;
    projectId: string;
    instanceId: string;
    pid: number;
    port: number;
    startedAt: number;
    updatedAt: number;
}
export declare function getServerRuntimeState(record: Pick<RecordInfo, 'output'>): ServerRuntimeState | undefined;
export declare function publishServerRuntimeState(record: Pick<RecordInfo, 'output'>, port: number, instanceId: string): ServerRuntimeState;
export declare function clearServerRuntimeState(record: Pick<RecordInfo, 'output'>, expectedInstanceId?: string): boolean;
