import HtmlWebpackPlugin from 'html-webpack-plugin';
import startServer from './server';
import injectCode from './get-inject-code';
class TrackCodePlugin {
  apply(complier) {
    complier.hooks.compilation.tap('TrackCodePlugin', (compilation) => {
      startServer((port) => {
        const code = injectCode(port);
        // 4 之前版本
        if (compilation.hooks.htmlWebpackPluginAfterHtmlProcessing) {
          compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tap(
            'HtmlWebpackPlugin',
            (data) => {
              // html-webpack-plugin编译后的内容，注入代码
              data.html = data.html.replace('</body>', `${code}\n</body>`);
            }
          );
        }
        // 适应 5 版本
        HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
          'TrackCodePlugin',
          (data, cb) => {
            // Manipulate the content
            if (!data.html.includes(code)) {
              // 防止重复注入
              data.html = data.html.replace('</body>', `${code}\n</body>`);
              // Tell webpack to move on
              cb(null, data);
            }
          }
        );
      });
    });
  }
}

export = TrackCodePlugin;
