const { CodeInspectorPlugin } = require('code-inspector-plugin');

module.exports = {
  // ...other code
  chainWebpack: (config) => {
    // add this configuration in the development environment
    config.plugin('@code-inspector/webpack').use(
      CodeInspectorPlugin({
        bundler: 'webpack',
      })
    );
  },
};
