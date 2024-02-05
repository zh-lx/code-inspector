import type { CodeOptions, RecordInfo } from '../shared';
export declare function createServer(callback: (port: number) => any, options?: CodeOptions): void;
export declare function startServer(options: CodeOptions, record: RecordInfo): Promise<void>;
