import { RecordInfo } from './type';
export declare const resetFileRecord: (output: string) => void;
export declare const getProjectRecord: (record: RecordInfo) => any;
export declare const setProjectRecord: (record: RecordInfo, key: keyof RecordInfo, value: RecordInfo[keyof RecordInfo]) => void;
export declare const findPort: (record: RecordInfo) => Promise<number>;
