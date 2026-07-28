export declare const SERVER_PROTOCOL_VERSION = 1;
export declare function getProjectId(): string;
export declare function getRuntimeDirectory(output: string): string;
export declare function ensureRuntimeDirectory(output: string): string;
export declare function getBuildStateFilePath(output: string): string;
export declare function getServerStateFilePath(output: string): string;
export declare function readRuntimeJsonFile<T>(filePath: string): T | undefined;
export declare function writeRuntimeJsonFile<T>(output: string, filePath: string, content: T): void;
