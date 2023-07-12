import { CodeOptions } from 'code-inspector-core';
export interface CodeInspectorPluginOptions extends CodeOptions {
    bundler: 'vite' | 'webpack';
    catch?: boolean;
}
export declare function CodeInspectorPlugin(options: CodeInspectorPluginOptions): any;
