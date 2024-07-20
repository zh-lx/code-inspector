import { CodeOptions } from 'code-inspector-core';
interface Options extends CodeOptions {
    close?: boolean;
    output: string;
}
export declare function EsbuildCodeInspectorPlugin(options: Options): {
    name: string;
    setup(build: any): void;
};
export {};
