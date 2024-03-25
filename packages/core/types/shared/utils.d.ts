import { EscapeTags } from './type';
export declare function fileURLToPath(fileURL: string): string;
export declare function isJsTypeFile(file: string): boolean;
export declare function isNextJsEntry(code: string): boolean;
export declare function isSsrEntry(code: string): boolean;
export declare function getFilenameWithoutExt(filePath: string): string;
export declare function normalizePath(filepath: string): string;
export declare function formatOpenPath(file: string, line: string, column: string, format: string | string[] | boolean): string[];
export declare function isEscapeTags(escapeTags: EscapeTags, tag: string): boolean;
