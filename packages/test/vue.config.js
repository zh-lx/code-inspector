module.exports = {
  // ...other code
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === 'development') {
      // add this configuration in the development environment
      const DebugPlugin = require('../vue-debug-plugin/lib/index.js');
      config.module
        .rule('vue')
        .test(/\.vue$/)
        .use('../vue-debug-loader/lib/index.js')
        .loader('../vue-debug-loader/lib/index.js')
        .end();
      config.plugin('webpack-vue-debug-plugin').use(new DebugPlugin());
    }
  },
};
