export { enhanceCode } from './content-enhance';
import { parse } from '@vue/compiler-sfc';
import { Editor } from '../shared/constant';
export { getServedCode } from './inject-code';
export type { RecordInfo } from './inject-code';
export declare function startServer(callback: (port: number) => any, editor?: Editor): void;
export declare function normalizePath(filepath: string): string;
export declare const parseSFC: typeof parse;
