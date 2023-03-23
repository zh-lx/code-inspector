<div align="center">
<img src="https://t4.wodetu.cn/2023/03/19/cbea9d31e70a335d4494cf9699c0ab97.png" width=160px" style="margin-bottom: 12px;" />

<p align="center">
  <h2>webpack-code-inspector-plugin</h2>
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/webpack-plugin/README.md">English Doc</a>
  |
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/webpack-plugin/README-ZH.md">中文文档</a>
  |
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/vite-plugin/README-ZH.md">vite-code-inspector-plugin</a>
</p>

[![NPM version](https://img.shields.io/npm/v/webpack-code-inspector-plugin.svg)](https://www.npmjs.com/package/webpack-code-inspector-plugin)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/code-inspector.svg)](https://github.com/zh-lx/code-inspector)
[![MIT-license](https://img.shields.io/npm/l/code-inspector.svg)](https://opensource.org/licenses/MIT)

</div>

<hr />

## 📜 介绍

点击页面上的元素，将自动打开你的代码编辑器并将光标定位到元素对应的代码位置。

![code-inspector](https://user-images.githubusercontent.com/73059627/227070438-6e40e112-6f1d-4f67-9f26-53986bff77c3.gif)

## 🚀 安装

```perl
npm i webpack-code-inspector-plugin -D
# or
yarn add webpack-code-inspector-plugin -D
# or
pnpm add webpack-code-inspector-plugin -D
```

## 📦 使用

### 1. 配置 `vue.config.js` 或 `webpack.config.js`

- 如果你使用的是 `vue.config.js`, 添加如下配置:

  ```js
  // vue.config.js
  const WebpackCodeInspectorPlugin = require('webpack-code-inspector-plugin');

  module.exports = {
    // ...other code
    chainWebpack: (config) => {
      // add this configuration in the development environment
      config
        .plugin('webpack-code-inspector-plugin')
        .use(new WebpackCodeInspectorPlugin());
    },
  };
  ```

- 如果你使用的是 `webpack.config.js`, 添加如下配置:

  ```js
  // webpack.config.js
  const WebpackCodeInspectorPlugin = require('webpack-code-inspector-plugin');

  module.exports = (env = {}) => ({
    plugins: [new WebpackCodeInspectorPlugin()],
  });
  ```

### 2. 配置 VSCode

如果你的编辑器是 VSCode，需要进行如下配置:

- 在 VSCode 中执行 `command + shift + p`(mac) 或 `ctrl + shift + p`(windows) 命令, 搜索 指令并点击 `shell Command: Install 'code' command in Path`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

- 如果出现如下弹窗，说明配置成功了:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

### 3. 使用代码审查

你可以通过打开开关或者同时按住 hotKeys（默认 mac 是【Option + Shift】，window 是【Alt + Shift】） 进行代码审查模式。在代码审查模式下，点击页面上的元素，将自动打开你的代码编辑器并将光标定位到元素对应的代码位置。

## 🎨 可选配置

| 参数       | 描述                                                                                                      | 类型                | 可选值                                                               | 默认值                   |
| ---------- | --------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------- | ------------------------ |
| hideSwitch | 是否隐藏功能开关                                                                                          | `boolean`           | `true/false`                                                         | `false`                  |
| hotKeys    | 组合键触发功能，为 `false` 或者空数组则关闭组合键触发                                                     | `string[] \| false` | Array<`'ctrlKey'`\|`'altKey'`\|`'metaKey'`\|`'shiftKey'`> \| `false` | `['altKey', 'shiftKey']` |
| autoToggle | After opening the function button, whether automatically close the button when triggering the jump editor | `boolean`           | `true/false`                                                         | `true`                   |

```js
// webpack.config.js
const WebpackCodeInspectorPlugin = require('webpack-code-inspector-plugin');

module.exports = (env = {}) => ({
  plugins: [
    new WebpackCodeInspectorPlugin({
      hideSwitch: false,
      hotKeys: ['altKey', 'shiftKey'],
      autoToggle: true,
    }),
  ],
});
```

## ❓ 常见问题

- <b>代码编辑器无法自动打开</b><br>
  如果你点击页面元素时无法自动打开代码编辑器，可能是因为系统权限或其他原因导致无法找到正在运行的代码编辑器。在项目根目录添加一个名为 `.env.local` 的文件并添加如下内容:
  ```perl
  # editor
  CODE_EDITOR=code
  ```
