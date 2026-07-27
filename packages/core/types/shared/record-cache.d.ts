import type { RecordInfo } from './type';
export declare const resetFileRecord: (output: string) => void;
export declare const updateProjectRecord: (record: RecordInfo, patch: Partial<RecordInfo>) => void;
export declare const getProjectRecord: (record: Pick<RecordInfo, 'output'>) => Partial<RecordInfo> | undefined;
export declare const setProjectRecord: (record: RecordInfo, key: keyof RecordInfo, value: RecordInfo[keyof RecordInfo]) => void;
export declare const findPort: (record: RecordInfo, timeoutMs?: number) => Promise<number>;
