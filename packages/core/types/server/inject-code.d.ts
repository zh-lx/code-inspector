import type { CodeOptions, RecordInfo } from '../index';
export declare const clientJsPath: string;
export declare function getClientInjectCode(port: number, options?: CodeOptions): string;
export declare const eliminateVueWarningCode: string;
export declare function getCodeWithWebComponent(options: CodeOptions, file: string, code: string, record: RecordInfo): Promise<string>;
