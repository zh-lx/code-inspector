import { ViteCodeInspectorPlugin } from 'vite-code-inspector-plugin';
import { CodeOptions } from 'code-inspector-core';
import chalk from 'chalk';

export interface CodeInspectorPluginOptions extends CodeOptions {
  bundler: 'vite' | 'webpack';
  catch?: boolean;
}

export function CodeInspectorPlugin(options: CodeInspectorPluginOptions): any {
  // 没有 bundler 参数，报错
  if (!options?.bundler) {
    console.log(
      chalk.red(
        'Please specify the bundler in the options of code-inspector-plugin.'
      )
    );
    return;
  }
  if (options.bundler === 'webpack') {
    // 使用 webpack 插件
    const WebpackCodeInspectorPlugin = require('webpack-code-inspector-plugin');
    return new WebpackCodeInspectorPlugin(options);
  } else {
    // 使用 vite 插件
    return ViteCodeInspectorPlugin(options);
  }
}
