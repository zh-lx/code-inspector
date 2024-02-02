import type { CodeOptions, Editor, RecordInfo } from '../shared';
export declare function createServer(callback: (port: number) => any, editor?: Editor): void;
export declare function startServer(options: CodeOptions, record: RecordInfo): Promise<void>;
