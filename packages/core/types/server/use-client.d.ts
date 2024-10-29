import type { CodeOptions, RecordInfo } from '../shared';
export declare const clientJsPath: string;
export declare function getInjectedCode(options: CodeOptions, port: number): string;
export declare function getWebComponentCode(options: CodeOptions, port: number): string;
export declare function getEliminateWarningCode(): string;
export declare function getHidePathAttrCode(): string;
export declare function getCodeWithWebComponent({ options, record, file, code, inject, }: {
    options: CodeOptions;
    record: RecordInfo;
    file: string;
    code: string;
    inject?: boolean;
}): Promise<string>;
