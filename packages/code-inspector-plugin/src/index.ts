import { ViteCodeInspectorPlugin } from 'vite-code-inspector-plugin';
import { CodeOptions } from 'code-inspector-core';
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export interface CodeInspectorPluginOptions extends CodeOptions {
  /**
   * @zh 指定项目的打包器
   * @en specify the bundler of the project
   */
  bundler: 'vite' | 'webpack' | 'rspack';
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
    let useCodeInspector = process.env.CODE_INSPECTOR;
    if (useCodeInspector === 'true') {
      close = false;
    } else {
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf-8');
        const envConfig = dotenv.parse(envFile || '');
        const useCodeInspector = envConfig?.CODE_INSPECTOR;
        if (useCodeInspector === 'true') {
          close = false;
        }
      }
    }
  }

  if (options.bundler === 'webpack' || options.bundler === 'rspack') {
    // 使用 webpack 插件
    const WebpackCodeInspectorPlugin = require('webpack-code-inspector-plugin');
    return new WebpackCodeInspectorPlugin({ ...options, close });
  } else {
    // 使用 vite 插件
    return ViteCodeInspectorPlugin({ ...options, close });
  }
}
