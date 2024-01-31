import type { CodeOptions, RecordInfo } from '../index';
export declare const clientJsPath: string;
export declare function getCodeWithWebComponent(options: CodeOptions, file: string, code: string, record: RecordInfo): Promise<string>;
