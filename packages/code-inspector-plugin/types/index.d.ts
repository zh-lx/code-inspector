import WebpackCodeInspectorPlugin from 'webpack-code-inspector-plugin';
import { CodeOptions } from 'code-inspector-core';
export interface CodeInspectorPluginOptions extends CodeOptions {
    bundler: 'webpack' | 'vite';
    framework?: 'vue';
}
export declare function CodeInspectorPlugin(options: CodeInspectorPluginOptions): WebpackCodeInspectorPlugin | {
    name: string;
    enforce: "pre";
    apply(_: any, { command, mode }: {
        command: any;
        mode: any;
    }): boolean;
    transform(code: any, id: any): Promise<any>;
    transformIndexHtml(html: any): Promise<any>;
} | undefined;
