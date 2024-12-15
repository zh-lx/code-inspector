import { type CodeOptions, type RecordInfo } from '../shared';
export declare const ProjectRootPath: string;
export declare function getShortagePath(filePath: string): string;
export declare function createServer(callback: (port: number) => any, options?: CodeOptions): void;
export declare function startServer(options: CodeOptions, record: RecordInfo): Promise<void>;
