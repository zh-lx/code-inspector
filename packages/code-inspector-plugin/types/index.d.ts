import { CodeOptions } from 'code-inspector-core';
export interface CodeInspectorPluginOptions extends CodeOptions {
    bundler: 'webpack' | 'vite';
    framework?: 'vue';
}
export declare function CodeInspectorPlugin(options: CodeInspectorPluginOptions): any;
