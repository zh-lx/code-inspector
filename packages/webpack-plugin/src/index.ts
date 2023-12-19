import {
  getInjectCode,
  startServer,
  normalizePath,
  CodeOptions,
} from 'code-inspector-core';
import path from 'path';

let isFirstLoad = true;

const applyLoader = (compiler: any, cb: () => void) => {
  if (!isFirstLoad) {
    return;
  }
  isFirstLoad = false;
  // 适配 webpack 各个版本
  const _compiler = compiler?.compiler || compiler;
  const module = _compiler?.options?.module;
  const rules = module?.rules || module?.loaders || [];
  rules.push({
    test: /\.(vue|jsx|tsx|js|ts)$/,
    exclude: /node_modules/,
    use: [path.resolve(__dirname, './loader.js')],
  });
  if (typeof cb === 'function') {
    cb();
  }
};

const replaceHtml = (html: string, code: string) => {
  const index = html.lastIndexOf('</html>');
  if (index > -1) {
    const newHTML = html.slice(0, index) + `\n${code}\n` + html.slice(index);
    html = newHTML;
  }
  return html;
};

// 不依赖 html-webpack-plugin 注入代码
const injectCode = (
  code: string,
  assets: { [filename: string]: any },
  cb?: (params?: any) => void
) => {
  const files = Object.keys(assets).filter((name) => /\.html$/.test(name));
  if (!files.length) {
    if (cb) {
      ('webpack-code-inspector-plugin Cannot find output HTML file');
      cb(
        new Error('webpack-code-inspector-plugin Cannot find output HTML file')
      );
    }
  } else {
    files.forEach((filename: string) => {
      const source = assets[filename].source();
      const sourceCode = replaceHtml(source, code);
      assets[filename] = {
        source: () => sourceCode,
        size: () => sourceCode.length,
      };
    });
  }
};

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

    // 获取要注入的代码
    const getCode = (port: number) =>
      getInjectCode(port, {
        ...(this.options || {}),
      });

    if (compiler.hooks) {
      // webpack4.x 及之后
      this.handleWebpackAbove4(compiler, getCode);
    } else {
      // this.handleWebpackBelow3(compiler, getCode);
    }
  }

  handleWebpackAbove4(compiler: any, getCode: (port: number) => string) {
    // 注入 loader
    compiler.hooks.watchRun.tap('WebpackCodeInspectorLoader', applyLoader);

    // 检测当前是否有 HTMLWebpackPlugin 插件
    const HtmlWebpackPlugin = compiler.options.plugins.find((item) => {
      return item.constructor.name === 'HtmlWebpackPlugin';
    });

    // 优先通过 html-webpack-plugin 注入 client 代码
    if (HtmlWebpackPlugin) {
      compiler.hooks.compilation.tap(
        'WebpackCodeInspectorPlugin',
        (compilation) => {
          // html-webpack-plugin 3.x 及之前版本
          let hook = compilation.hooks.htmlWebpackPluginAfterHtmlProcessing;
          // html-webpack-plugin 4.x 及之后版本
          if (!hook) {
            hook =
              HtmlWebpackPlugin.constructor.getHooks(compilation).beforeEmit;
          }
          hook.tapAsync('WebpackCodeInspectorPlugin', (data, cb) => {
            const rootPath = normalizePath(compilation.options.context);
            startServer((port) => {
              data.html = replaceHtml(data.html, getCode(port));
              cb(null, data);
            }, rootPath, this.options.editor);
          });
        }
      );
    } else {
      // 没有 html-webpack-plugin 则原生注入
      compiler.hooks.emit.tapAsync(
        'WebpackCodeInspectorPlugin',
        (compilation, cb) => {
          const rootPath = normalizePath(compilation.options.context);
          startServer((port) => {
            const { assets } = compilation;
            injectCode(getCode(port), assets, cb);
            cb();
          }, rootPath);
        }
      );
    }
  }

  // todo: webpack3.x 版本 loader 添加 vc_path 后未注入到 dom
  // todo: webpack3.x 配合 html-webpack-plugin 一同使用
  // handleWebpackBelow3(compiler: any, getCode: (port: number) => string) {}
}

export default WebpackCodeInspectorPlugin;
