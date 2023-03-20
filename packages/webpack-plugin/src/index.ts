const HtmlWebpackPlugin = require('html-webpack-plugin');
import { getInjectCode, startServer, HotKey } from 'code-inspector-core';
const path = require('path');

const applyLoader = (compiler: any) => {
  compiler.options.module.rules.push({
    test: /\.vue$/,
    use: [path.resolve(__dirname, './loader.js')],
    enforce: 'pre',
  });
};

const replaceHtml = (html: string, code: string) => {
  const index = html.lastIndexOf('</html>');
  if (index > -1) {
    const newHTML = html.slice(0, index) + `\n${code}\n` + html.slice(index);
    html = newHTML;
  }
  return html;
};

interface Options {
  hotKeys?: HotKey[];
  hideButton?: boolean;
  disableTriggerByKey?: boolean;
}
class WebpackCodeInspectorPlugin {
  options: Options;

  constructor(options?: Options) {
    this.options = options || {};
  }
  apply(compiler) {
    // 注入代码
    const injectCode = (
      port: number,
      assets: { [filename: string]: any },
      cb?: (params?: any) => void
    ) => {
      const code = getInjectCode(
        port,
        this.options.hotKeys || undefined,
        this.options.disableTriggerByKey,
        this.options.hideButton
      );
      const files = Object.keys(assets).filter((name) => /\.html$/.test(name));
      if (!files.length) {
        if (cb) {
          cb(new Error('Cannot find output HTML file'));
        } else {
          throw Error('Cannot find output HTML file');
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
    // 仅在开发环境下使用
    if (compiler.options.mode === 'development') {
      if (compiler.hooks) {
        compiler.hooks.watchRun.tap('VueCodeInspectorLoader', applyLoader);
        compiler.hooks.emit.tapAsync(
          'WebpackCodeInspectorPlugin',
          (compilation, cb) => {
            const rootPath = compilation.options.context;
            startServer((port) => {
              const { assets } = compilation;
              injectCode(port, assets, cb);
              cb();
            }, rootPath);
          }
        );
      } else {
        compiler.plugin('watchRun', applyLoader);
        compiler.plugin('emit', (compilation, cb) => {
          const rootPath = compilation.options.context;
          startServer((port) => {
            const { assets } = compilation;
            injectCode(port, assets, cb);
            cb();
          }, rootPath);
        });
      }
    }
  }
}

export = WebpackCodeInspectorPlugin;
