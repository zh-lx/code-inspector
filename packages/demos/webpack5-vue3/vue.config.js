const WebpeckInspecterPlugin = require('webpack-vue-inspector-plugin');

module.exports = {
  // ...other code
  chainWebpack: (config) => {
    // add this configuration in the development environment
    config
      .plugin('webpack-vue-inspector-plugin')
      .use(new WebpeckInspecterPlugin({}));
  },
};
