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

    config.module
      .rule('pug')
      .test(/\.pug$/) // 替换为你的文件扩展名
      .use('pug-plain-loader')
      .loader('pug-plain-loader'); // 替换为你的 loader 名称
  },
};
