import { CodeOptions } from 'code-inspector-core';
interface Options extends CodeOptions {
    close?: boolean;
    output: string;
}
export declare function TurbopackCodeInspectorPlugin(options: Options): Record<string, any>;
export {};
