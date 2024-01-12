import type { CodeOptions } from '../index';
export declare const clientJsPath: string;
export type RecordInfo = {
    port: number;
    entry: string;
    nextInjectedFile: string;
    useEffectFile: string;
    injectAll: boolean;
};
export declare function getServedCode(options: CodeOptions, file: string, code: string, record: RecordInfo): Promise<string>;
