const WebpackCodeInspectorPlugin = require('../../webpack-plugin');

module.exports = {
  // ...other code
  chainWebpack: (config) => {
    // add this configuration in the development environment
    config.plugin('webpack-code-inspector-plugin').use(
      new WebpackCodeInspectorPlugin({
        autoToggle: false,
      })
    );
  },
};
