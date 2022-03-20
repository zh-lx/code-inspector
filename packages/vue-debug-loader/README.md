<div align="center">
<img src="https://user-images.githubusercontent.com/73059627/159161041-8f721c6e-8840-45f4-bf34-658223933b9f.png" width=160px" style="margin-bottom: 12px;" />

<p align="center">
  <h2>webpack-vue-debug</h2>
  <a href="https://github.com/zh-lx/webpack-vue-debug/blob/main/README.md">English Doc</a>
  |
  <a href="https://github.com/zh-lx/webpack-vue-debug/blob/main/docs/README-ZH.md">中文文档</a>
</p>

[![NPM version](https://img.shields.io/npm/v/webpack-vue-debug.svg)](https://www.npmjs.com/package/webpack-vue-debug)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/webpack-vue-debug.svg)](https://github.com/zh-lx/webpack-vue-debug)
[![MIT-license](https://img.shields.io/npm/l/webpack-vue-debug.svg)](https://opensource.org/licenses/MIT)

<p>click the element on the page, it will automatically open the code editor and position the cursor to the source code of the element</p>
</div>

<hr />

## Install

### 1. install `webpack-vue-debug`

Execute the following command at the root of the project:

```perl
yarn add webpack-vue-debug -D
# or
npm install webpack-vue-debug -D
```

### 2. configure `vue.config.js`

Add the following configuration to the `vue.config.js`.<b>(Note that you need to determine the environment, this configuration is only used in the development environment)</b>:

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

### 3. configure device environment(Mac)

<b>windows can ignore this step</b>

If you use Mac and the editor is Vscode, you need to do the following:

- Execute `command + shift + p` command in vscode, search and click `shell Command: Install 'code' command in Path`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

  If the following popup window appears, your configuration is successful:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

## Use and effect

As shown in the figure below, click the floating window with V mark in the page. When it turns green, it means that the function is turned on. (click again to turn off the function)<br/>

When the function is turned on, the information will appear when the mouse moves to the page element. Click the element, it will open vscode and jump to the source code of element.

![](https://s3.bmp.ovh/imgs/2021/08/b71d54d5d9c29640.gif)

## Performance

Tested by several large and medium-sized projects, the impact on the performance of build and rebuild is negligible.

## List of supported editors

The list of editors currently supported by the plugin is as follows:

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

If you are using another code editor and want to use the plugin, please leave a message in issue, I will support it.
