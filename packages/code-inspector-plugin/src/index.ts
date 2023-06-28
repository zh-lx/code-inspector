import WebpackCodeInspectorPlugin from 'webpack-code-inspector-plugin';
import { ViteCodeInspectorPlugin } from 'vite-code-inspector-plugin';
import { CodeOptions } from 'code-inspector-core';

export interface CodeInspectorPluginOptions extends CodeOptions {
  bundler: 'webpack' | 'vite';
  framework?: 'vue';
}

export function CodeInspectorPlugin(options: CodeInspectorPluginOptions) {
  if (!options?.bundler) {
    console.error(
      'Please specify the bundler in the options of CodeInspectorPlugin.'
    );
    return;
  }
  if (options.bundler === 'webpack') {
    return new WebpackCodeInspectorPlugin(options);
  } else {
    return ViteCodeInspectorPlugin(options);
  }
}
