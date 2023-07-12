import { HotKey } from 'code-inspector-core';
interface Options {
    hotKeys?: HotKey[] | false;
    showSwitch?: boolean;
    autoToggle?: boolean;
}
export declare function ViteCodeInspectorPlugin(options?: Options): {
    name: string;
    enforce: "pre";
    apply(_: any, { command }: {
        command: any;
    }): boolean;
    transform(code: any, id: any): Promise<any>;
    transformIndexHtml(html: any): Promise<any>;
};
export {};
