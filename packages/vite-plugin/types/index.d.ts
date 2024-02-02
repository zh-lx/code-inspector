import { CodeOptions } from 'code-inspector-core';
interface Options extends CodeOptions {
    close?: boolean;
}
export declare function ViteCodeInspectorPlugin(options?: Options): {
    apply(_: any, { command }: {
        command: any;
    }): boolean;
    resolveId(id: any): Promise<string>;
    load(id: any): string;
    transform(code: any, id: any): Promise<any>;
    enforce?: "pre";
    name: string;
};
export {};
