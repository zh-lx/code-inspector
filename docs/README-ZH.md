<div align="center">
<img src="https://user-images.githubusercontent.com/73059627/159161041-8f721c6e-8840-45f4-bf34-658223933b9f.png" width="160px" style="margin-bottom: 12px;" />

<p align="center">
  <h2>webpack-vue-debug</h2>
  <a href="https://github.com/zh-lx/webpack-vue-debug/blob/main/README.md">English Doc</a>
  |
  <a href="https://github.com/zh-lx/webpack-vue-debug/blob/main/docs/README-ZH.md">中文文档</a>
</p>

[![NPM version](https://img.shields.io/npm/v/webpack-vue-debug.svg)](https://www.npmjs.com/package/webpack-vue-debug)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/webpack-vue-debug.svg)](https://github.com/zh-lx/webpack-vue-debug)
[![MIT-license](https://img.shields.io/npm/l/webpack-vue-debug.svg)](https://opensource.org/licenses/MIT)

<p>点击页面元素，它会自动打开代码编辑器并将光标定位到元素的源代码</p>
</div>

<hr />

## 安装

### 1. 安装 `webpack-vue-debug`

在项目根目录执行以下命令：

```perl
yarn add webpack-vue-debug -D
# or
npm install webpack-vue-debug -D
```

### 2. 配置 `vue.config.js`

在 `vue.config.js` 中添加如下配置。<b>(注意你需要判断一下环境，该配置只能用于开发环境下)</b>：

```js
// vue.config.js
module.exports = {
  // ...other code
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === 'development') {
      // add this configuration in the development environment
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
```

### 3. 配置设备环境(Mac)

<b>windows 可忽略此步骤</b>

如果你使用 MAC 并且编辑器是 vscode，需要执行以下操作:

- 在 vscode 中执行 `command + shift + p` 命令，搜索并点击 `shell Command: Install 'code' command in Path`：

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

- 出现以下弹窗，说明你的配置成功：

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

## 使用及效果

如下图所示，点击页面中带有 V 标识的弹窗。当它变成绿色，说明功能打开。 (再次点击将关闭功能)<br/>

当功能打开时, 鼠标移动至页面的元素上会出现其信息，点击元素会打开 vscode 并跳转至元素对应的源代码。

![](https://s3.bmp.ovh/imgs/2021/08/b71d54d5d9c29640.gif)

## 性能

经多个大中型项目测试，对 build 及 rebuild 的性能影响可忽略不计。

## 支持哪些编辑器

该插件目前支持的代码编辑器列表如下：

- [VSCode](https://code.visualstudio.com/)
- [Sublime Text](https://www.sublimetext.com/)
- [webstorm](https://www.jetbrains.com/webstorm/)
- [phpstorm](https://www.jetbrains.com/phpstorm/)
- [HBuilderX](https://www.dcloud.io/hbuilderx.html)
- [atom](https://atom.io/)
- [brackets](https://brackets.io/)
- [VSCodium](https://vscodium.com/)
- [appcode](https://www.jetbrains.com/objc/)
- [clion](https://www.jetbrains.com/clion/)
- [idea](https://www.jetbrains.com/idea/)
- [pycharm](https://www.jetbrains.com/pycharm/)
- [rubymine](https://www.jetbrains.com/ruby/)
- [MacVim](https://macvim-dev.github.io/macvim/)
- [goland](https://www.jetbrains.com/go/)
- [rider](https://www.jetbrains.com/rider/)

如果你正在使用其他的代码编辑器，并且也想使用该插件，请在 issue 中留言，我会支持。
