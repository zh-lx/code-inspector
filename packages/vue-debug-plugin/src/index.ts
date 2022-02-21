import HtmlWebpackPlugin from 'html-webpack-plugin';
import startServer from './server';
import injectCode from './get-inject-code';
class TrackCodePlugin {
  apply(complier) {
    complier.hooks.compilation.tap('TrackCodePlugin', (compilation) => {
      startServer((port) => {
        const code = injectCode(port);
        HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
          'TrackCodePlugin',
          (data, cb) => {
            // Manipulate the content
            data.html = data.html.replace('</body>', `${code}\n</body>`);
            // Tell webpack to move on
            cb(null, data);
          }
        );
      });
    });
  }
}

export = TrackCodePlugin;
