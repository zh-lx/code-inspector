export { enhanceCode } from './content-enhance';
import { parse } from '@vue/compiler-sfc';
export declare function startServer(callback: Function, rootPath: string): void;
export declare function normalizePath(filepath: string): string;
export declare const parseSFC: typeof parse;
