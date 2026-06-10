import { CodeOptions } from '@code-inspector/core';
interface Options extends CodeOptions {
    close?: boolean;
    output: string;
}
export declare function ViteCodeInspectorPlugin(options: Options): {
    apply(_: any, { command }: {
        command: any;
    }): boolean;
    configResolved(config: any): void;
    transform(code: string, id: string): Promise<string>;
    transformIndexHtml(html: any): Promise<any>;
    configureServer(server: any): void;
    enforce?: "pre";
    name: string;
};
export {};
