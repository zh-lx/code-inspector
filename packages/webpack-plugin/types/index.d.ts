import { CodeOptions } from 'code-inspector-core';
interface Options extends CodeOptions {
    close?: boolean;
}
declare class WebpackCodeInspectorPlugin {
    options: Options;
    constructor(options?: Options);
    apply(compiler: any): void;
    handleWebpackAbove4(compiler: any, getCode: (port: number) => string): void;
}
export default WebpackCodeInspectorPlugin;
