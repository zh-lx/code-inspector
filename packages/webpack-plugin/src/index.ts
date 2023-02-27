import HtmlWebpackPlugin from 'html-webpack-plugin';
import { getInjectCode, startServer } from 'vue-inspector-core';
const path = require('path');
class TrackCodePlugin {
  apply(complier) {
    // 仅在开发环境下使用
    if (complier.options.mode === 'development') {
      complier.hooks.watchRun.tap('TrackCodePlugin', () => {
        complier.options.module.rules.push({
          test: /\.vue$/,
          use: [path.resolve(__dirname, './loader.js')],
          enforce: 'pre',
        });
      });

      complier.hooks.compilation.tap('TrackCodePlugin', (compilation) => {
        startServer((port) => {
          const code = getInjectCode(port);
          // html-webpack-plugin 4 之前版本
          if (compilation.hooks.htmlWebpackPluginAfterHtmlProcessing) {
            compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(
              'TrackCodePlugin',
              (data, cb) => {
                const index = data.html.lastIndexOf('</html>');
                if (index > -1) {
                  const newHTML =
                    data.html.slice(0, index) +
                    `\n${code}\n` +
                    data.html.slice(index);
                  data.html = newHTML;
                  cb(null, data);
                }
              }
            );
          } else {
            // 适应 html-webpack-plugin  5 版本
            HtmlWebpackPlugin?.getHooks?.(compilation)?.beforeEmit?.tapAsync(
              'TrackCodePlugin',
              (data, cb) => {
                const index = data.html.lastIndexOf('</html>');
                if (index > -1) {
                  const newHTML =
                    data.html.slice(0, index) +
                    `\n${code}\n` +
                    data.html.slice(index);
                  data.html = newHTML;
                  cb(null, data);
                }
              }
            );
          }
        });
      });
    }
  }
}

export = TrackCodePlugin;
