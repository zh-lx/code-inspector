import { ViteCodeInspectorPlugin } from 'vite-code-inspector-plugin';
import WebpackCodeInspectorPlugin from 'webpack-code-inspector-plugin';
import { EsbuildCodeInspectorPlugin } from 'esbuild-code-inspector-plugin';
import { TurbopackCodeInspectorPlugin } from 'turbopack-code-inspector-plugin';
import {
  CodeOptions,
  fileURLToPath,
  getEnvVariable,
} from 'code-inspector-core';
import chalk from 'chalk';
import path, { dirname } from 'path';

export interface CodeInspectorPluginOptions extends CodeOptions {
  /**
   * @zh 指定项目的打包器
   * @en specify the bundler of the project
   */
  bundler: 'vite' | 'webpack' | 'rspack' | 'esbuild' | 'turbopack';
  /**
   * @zh 设置为 true 时，仅当 .env.local 文件存在且其包含 CODE_INSPECTOR=true 时插件生效；默认值为 false
   * @en When set the value to true, only if the .env.local file exists and it contains CODE_INSPECTOR=true, the plugin takes effect; The default value is false
   */
  needEnvInspector?: boolean;
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
  // 判断是否只在本地启用
  let close = false;
  if (options.needEnvInspector) {
    close = true;
    if (getEnvVariable('CODE_INSPECTOR', process.cwd()) === 'true') {
      close = false;
    }
  }

  let compatibleDirname = '';
  if (typeof __dirname !== 'undefined') {
    compatibleDirname = __dirname;
  } else {
    compatibleDirname = dirname(fileURLToPath(import.meta.url));
  }
  const params = {
    ...options,
    close,
    output: path.resolve(compatibleDirname, './'),
  };
  if (options.bundler === 'webpack' || options.bundler === 'rspack') {
    // 使用 webpack 插件
    return new WebpackCodeInspectorPlugin(params);
  } else if (options.bundler === 'esbuild') {
    return EsbuildCodeInspectorPlugin(params);
  } else if (options.bundler === 'turbopack') {
    return TurbopackCodeInspectorPlugin(params);
  } else {
    // 使用 vite 插件
    return ViteCodeInspectorPlugin(params);
  }
}

export const codeInspectorPlugin = CodeInspectorPlugin;
