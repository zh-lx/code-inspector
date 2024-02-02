import type { CodeOptions, RecordInfo } from '../shared';
export declare const clientJsPath: string;
export declare function getClientInjectCode(port: number, options?: CodeOptions): string;
export declare function getEliminateVueWarningCode(): string;
export declare function getCodeWithWebComponent(options: CodeOptions, file: string, code: string, record: RecordInfo): Promise<string>;
