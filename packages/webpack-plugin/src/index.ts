const HtmlWebpackPlugin = require('html-webpack-plugin');
import { getInjectCode, startServer } from 'vue-inspector-core';
const path = require('path');
class TrackCodePlugin {
  apply(compiler) {
    // 仅在开发环境下使用
    if (compiler.options.mode === 'development') {
      if (compiler.hooks) {
        compiler.hooks.watchRun.tap('VueInspectorLoader', () => {
          compiler.options.module.rules.push({
            test: /\.vue$/,
            use: [path.resolve(__dirname, './loader.js')],
            enforce: 'pre',
          });
        });

        compiler.hooks.compilation.tap(
          'WebpackVueInspectorPlugin',
          (compilation) => {
            startServer((port) => {
              const code = getInjectCode(port);
              // HtmlWebpackPlugin3 及之前版本
              let hook = compilation.hooks.htmlWebpackPluginAfterHtmlProcessing;
              if (!hook) {
                // 4 及之后版本
                hook = HtmlWebpackPlugin.getHooks(compilation).beforeEmit;
              }
              console.log(hook);
              hook.tapAsync('VueInspectorPlugin', (data, cb) => {
                const index = data.html.lastIndexOf('</html>');
                if (index > -1) {
                  const newHTML =
                    data.html.slice(0, index) +
                    `\n${code}\n` +
                    data.html.slice(index);
                  data.html = newHTML;
                  cb(null, data);
                }
              });
            });
          }
        );
      }
    }
  }
}

export = TrackCodePlugin;
