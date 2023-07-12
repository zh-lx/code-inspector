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

export function CodeInspectorPlugin(
  options: CodeInspectorPluginVite
): ReturnType<typeof ViteCodeInspectorPlugin>;

export function CodeInspectorPlugin(
  options: CodeInspectorPluginWebpack
): WebpackCodeInspectorPlugin;

export function CodeInspectorPlugin(
  options: CodeInspectorPluginOptions
):
  | ReturnType<typeof ViteCodeInspectorPlugin>
  | WebpackCodeInspectorPlugin
  | undefined {
  if (!options?.bundler) {
    console.error(
      'Please specify the bundler in the options of CodeInspectorPlugin.'
    );
    return;
  }
  if (options.bundler === 'webpack') {
    const WebpackCodeInspectorPlugin = require('webpack-code-inspector-plugin');
    return new WebpackCodeInspectorPlugin(options);
  } else {
    return ViteCodeInspectorPlugin(options);
  }
}
