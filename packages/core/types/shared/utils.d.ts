/// <reference types="node" />
import { CodeOptions, Condition, EscapeTags, RecordInfo } from './type';
export declare function getIP(ip: boolean | string): string;
export declare function fileURLToPath(fileURL: string): string;
export declare function isJsTypeFile(file: string): boolean;
export declare function getFilePathWithoutExt(filePath: string): string;
export declare function normalizePath(filepath: string): string;
export declare function isEscapeTags(escapeTags: EscapeTags, tag: string): boolean;
export declare function getDenpendencies(): string[];
type BooleanFunction = () => boolean;
export declare function isDev(userDev: boolean | BooleanFunction | undefined, systemDev: boolean): boolean;
export declare function matchCondition(condition: Condition, file: string): boolean;
export declare function getMappingFilePath(file: string, mappings?: Record<string, string> | Array<{
    find: string | RegExp;
    replacement: string;
}>): string;
export declare function isExcludedFile(file: string, options: CodeOptions): boolean;
export declare const hasProjectRecord: (record: RecordInfo) => boolean;
export declare const getProjectRecord: (record: RecordInfo) => Partial<RecordInfo> | undefined;
export declare const setProjectRecord: (record: RecordInfo, key: keyof RecordInfo, value: any) => void;
export declare const cleanProjectRecord: (record: RecordInfo) => void;
export declare const isProjectAlive: (record: RecordInfo) => false | (() => string | import("net").AddressInfo | null) | undefined;
export {};
