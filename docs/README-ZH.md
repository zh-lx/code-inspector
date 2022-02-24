<div align="center">
<img src="https://user-images.githubusercontent.com/73059627/155552101-5df77d46-e852-4007-9983-7e7c093b88b5.png" width="360px" style="margin-bottom: 12px;" />

<p align="center">
  <a href="https://github.com/zh-lx/webpack-vue-debug/blob/main/README.md">English Doc</a>
  |
  <a href="https://github.com/zh-lx/webpack-vue-debug/blob/main/docs/README-ZH.md">中文文档</a>
</p>

[![NPM version](https://img.shields.io/npm/v/webpack-vue-debug.svg)](https://www.npmjs.com/package/webpack-vue-debug)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/webpack-vue-debug.svg)](https://github.com/zh-lx/webpack-vue-debug)
[![MIT-license](https://img.shields.io/npm/l/webpack-vue-debug.svg)](https://opensource.org/licenses/MIT)

<p>点击页面元素，该插件会唤起 vscode 并自动跳转至元素所对应的源代码。</p>
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

如果你使用 MAC，需要执行一下操作:

- 在项目根目录添加一个名为 `.env.local` 的文件，并在 `.env.local` 中写入以下内容：<br>
  ```
  # editor
  VUE_EDITOR=code
  ```
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
