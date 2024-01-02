import {
  CodeOptions,
} from 'code-inspector-core';
import path from 'path';

let isFirstLoad = true;

const applyLoader =  (options: CodeOptions) => (compiler: any, cb: () => void) => {
  if (!isFirstLoad) {
    return;
  }
  isFirstLoad = false;
  // 适配 webpack 各个版本
  const _compiler = compiler?.compiler || compiler;
  const module = _compiler?.options?.module;
  const rules = module?.rules || module?.loaders || [];
  rules.push({
    test: /\.(vue|jsx|tsx|js|ts|mjs|mts)$/,
    exclude: /node_modules/,
    use: [
      { 
        loader: path.resolve(__dirname, './loader.js') ,
        options,
      }
    ],
  });
  if (typeof cb === 'function') {
    cb();
  }
}

interface Options extends CodeOptions {
  close?: boolean;
}

class WebpackCodeInspectorPlugin {
  options: Options;

  constructor(options?: Options) {
    this.options = options || {};
  }

  apply(compiler) {
    isFirstLoad = true;

    if (this.options.close) {
      return;
    }

    // 仅在开发环境下使用
    if (
      compiler?.options?.mode !== 'development' &&
      process.env.NODE_ENV !== 'development'
    ) {
      return;
    }

    applyLoader(this.options)(compiler, () => {});
  }
}

export default WebpackCodeInspectorPlugin;
