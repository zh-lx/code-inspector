module.exports = {
  // ...other code
  chainWebpack: (config) => {
    // 添加如下代码，注意判别环境
    if (process.env.NODE_ENV === 'development') {
      const DebugPlugin = require('webpack-vue-debug-plugin');
      config.module
        .rule('vue')
        .test(/\.vue$/)
        .use('webpack-vue-debug-loader')
        .loader('webpack-vue-debug-loader')
        .end();
      config.plugin('webpack-vue-debug-plugin').use(new DebugPlugin());
    }
  },
};
