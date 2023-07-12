import type WebpackCodeInspectorPlugin from 'webpack-code-inspector-plugin/types/index';
import { ViteCodeInspectorPlugin } from 'vite-code-inspector-plugin';
import { CodeOptions } from 'code-inspector-core';
export interface CodeInspectorPluginOptions extends CodeOptions {
    framework?: 'vue';
    bundler: 'vite' | 'webpack';
}
export interface CodeInspectorPluginVite extends CodeInspectorPluginOptions {
    bundler: 'vite';
}
export interface CodeInspectorPluginWebpack extends CodeInspectorPluginOptions {
    bundler: 'webpack';
}
export declare function CodeInspectorPlugin(options: CodeInspectorPluginVite): ReturnType<typeof ViteCodeInspectorPlugin>;
export declare function CodeInspectorPlugin(options: CodeInspectorPluginWebpack): WebpackCodeInspectorPlugin;
