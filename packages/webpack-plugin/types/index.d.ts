import { HotKey } from 'code-inspector-core';
interface Options {
    hotKeys?: HotKey[] | false;
    showSwitch?: boolean;
    autoToggle?: boolean;
}
declare class WebpackCodeInspectorPlugin {
    options: Options;
    constructor(options?: Options);
    apply(compiler: any): void;
    handleWebpackAbove4(compiler: any, getCode: (port: number) => string): void;
}
export default WebpackCodeInspectorPlugin;
