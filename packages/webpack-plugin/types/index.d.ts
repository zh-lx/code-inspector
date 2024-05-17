import { CodeOptions } from 'code-inspector-core';
interface Options extends CodeOptions {
    close?: boolean;
    output: string;
}
declare class WebpackCodeInspectorPlugin {
    options: Options;
    constructor(options: Options);
    apply(compiler: any): void;
}
export default WebpackCodeInspectorPlugin;
