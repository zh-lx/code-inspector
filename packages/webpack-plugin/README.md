<div align="center">
<img src="https://t4.wodetu.cn/2023/03/19/cbea9d31e70a335d4494cf9699c0ab97.png" width=160px" style="margin-bottom: 12px;" />

<p align="center">
  <h2>webpack-code-inspector-plugin</h2>
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

## Usage

### 1. install `webpack-code-inspector-plugin`

Execute the following command at the root of your project:

```perl
npm i webpack-code-inspector-plugin -D
# or
yarn add webpack-code-inspector-plugin -D
# or
pnpm add webpack-code-inspector-plugin -D
```

### 2. configure `vue.config.js`

- If you use `vue.config.js`, add the following configuration:

  ```js
  // vue.config.js
  const WebpackCodeInspectorPlugin = require('webpack-code-inspector-plugin');

  module.exports = {
    // ...other code
    chainWebpack: (config) => {
      // add this configuration in the development environment
      config
        .plugin('webpack-code-inspector-plugin')
        .use(new WebpackCodeInspectorPlugin({}));
    },
  };
  ```

- If you use `webpack.config.js`, add the following configuration:

  ```js
  // webpack.config.js
  const WebpackCodeInspectorPlugin = require('webpack-code-inspector-plugin');

  module.exports = (env = {}) => ({
    plugins: [new WebpackCodeInspectorPlugin({})],
  });
  ```

### 3. configure device environment(Mac)

<b>windows can ignore this step</b>

If you use Mac and the editor is Vscode, you need to do the following:

- Execute `command + shift + p` command in vscode, search and click `shell Command: Install 'code' command in Path`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

- If the following popup window appears, your configuration is successful:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

- If the editor doesn't open automatically when you click on a page element with the plugin enabled, it could be because of system permissions or other issues that prevent the plugin from reading the programs currently running on your computer. Please add a file named `.env.local` to your project root directory, the contents of the file are as follows:

  ```perl
  # editor

  VUE_EDITOR=code
  ```

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
