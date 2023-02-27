const DebugPlugin = require('webpack-vue-inspector-plugin');

module.exports = {
  // ...other code
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === 'development') {
      // add this configuration in the development environment
      config.plugin('webpack-vue-inspector-plugin').use(new DebugPlugin());
    }
  },
};
