<div align="center">
<img src="https://user-images.githubusercontent.com/73059627/230129140-6e7a7eb7-4c78-4a58-b4aa-fcb7c2a6c95f.png" width=160px" style="margin-bottom: 12px;" />

<p align="center">
  <h2>webpack-code-inspector-plugin</h2>
  <span>中文文档</span>
  |
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/webpack-plugin/README-EN.md">English Doc</a>
  |
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/vite-plugin/README.md">vite-code-inspector-plugin</a>
</p>

[![NPM version](https://img.shields.io/npm/v/webpack-code-inspector-plugin.svg)](https://www.npmjs.com/package/webpack-code-inspector-plugin)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/code-inspector.svg)](https://github.com/zh-lx/code-inspector)
[![MIT-license](https://img.shields.io/npm/l/code-inspector.svg)](https://opensource.org/licenses/MIT)

</div>

<hr />

## 📖 介绍

点击页面上的元素，能够自动打开你的代码编辑器并将光标定位到元素对应的代码位置。

![code-inspector](https://user-images.githubusercontent.com/73059627/227070438-6e40e112-6f1d-4f67-9f26-53986bff77c3.gif)

## 🚀 安装

```perl
npm i webpack-code-inspector-plugin -D
# or
yarn add webpack-code-inspector-plugin -D
# or
pnpm add webpack-code-inspector-plugin -D
```

## 🌈 使用

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

### 2. 使用代码审查

目前是有代码审查功能的方式有两种:

1. 【推荐】同时持续按住组合键进行代码审查。 (Mac 系统默认组合键是 `Option + Shift`；Window 的默认组合键是 `Alt + Shift`)
2. 点击页面上的 Code Inspector 开关按钮。当开关的颜色变成彩色时，表示代码审查模式打开 <img src="https://user-images.githubusercontent.com/73059627/230129140-6e7a7eb7-4c78-4a58-b4aa-fcb7c2a6c95f.png" width="20" />；当开关颜色变成黑白时，表示代码审查模式关闭 <img src="https://user-images.githubusercontent.com/73059627/230129864-e2813188-8d49-4a8e-a6bc-dda19c79b491.png" width="20" />。（Code Inspector 开关按钮 <img src="https://user-images.githubusercontent.com/73059627/230129140-6e7a7eb7-4c78-4a58-b4aa-fcb7c2a6c95f.png" width="20" /> 默认隐藏，需要配置 `showSwitch: true` 才会在页面显示。）

当代码审查模式打开时，点击页面上的元素，将自动打开你的代码编辑器并将光标定位到元素对应的代码位置。

### 3. 配置命令行工具(仅当 Mac + Vscode 需要配置此步)

如果你的编辑器是 VSCode 且系统为 MacOS，需要进行如下配置:

- 在 VSCode 中执行 `command + shift + p`(mac) 或 `ctrl + shift + p`(windows) 命令, 搜索 指令并点击 `shell Command: Install 'code' command in Path`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

- 如果出现如下弹窗，说明配置成功了:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

## 🎨 可选配置

| 参数       | 描述                                                       | 类型                | 可选值                                                               | 默认值                   |
| ---------- | ---------------------------------------------------------- | ------------------- | -------------------------------------------------------------------- | ------------------------ |
| showSwitch | 是否展示功能开关                                           | `boolean`           | `true/false`                                                         | `false`                  |
| hotKeys    | 组合键触发功能，为 `false` 或者空数组则关闭组合键触发      | `string[] \| false` | Array<`'ctrlKey'`\|`'altKey'`\|`'metaKey'`\|`'shiftKey'`> \| `false` | `['altKey', 'shiftKey']` |
| autoToggle | 打开功能开关的情况下，点击触发跳转编辑器时是否自动关闭开关 | `boolean`           | `true/false`                                                         | `true`                   |

```js
// webpack.config.js
const WebpackCodeInspectorPlugin = require('webpack-code-inspector-plugin');

module.exports = (env = {}) => ({
  plugins: [
    new WebpackCodeInspectorPlugin({
      showSwitch: false,
      hotKeys: ['altKey', 'shiftKey'],
      autoToggle: true,
    }),
  ],
});
```

## 🎯 指定 IDE

默认情况下，`webpack-code-inspector-plugin` 会自动识别当前系统运行中的 IDE 程序并按照优先级打开识别到的第一个。如果你有多种不同的 IDE，你可以指定要打开的 IDE，在项目根目录添加一个名为 `.env.local` 的文件并添加： `CODE_EDITOR=[IDE编码名称]`。

以 vscode 为例，它的`IDE编码名称`是 `code`，则对应在 `.env.local` 中添加如下内容：

```perl
# 指定 IDE 为 vscode
CODE_EDITOR=code
```

IDE 及对应的`IDE编码名称`对照表如下：

<table>
    <tr>
        <th>IDE</th>
        <th>IDE编码名称</th>
    </tr>
    <tr>
        <td>Visual Studio Code（vscode）</td>
        <td>code</td>
    </tr>
    <tr>
        <td>Visual Studio Code - Insiders（vscode 内部版）</td>
        <td>code_insiders</td>
    </tr>
    <tr>
        <td>WebStorm</td>
        <td>webstorm</td>
    </tr>
    <tr>
        <td>Atom</td>
        <td>atom</td>
    </tr>
    <tr>
        <td>HBuilderX</td>
        <td>hbuilderx</td>
    </tr>
    <tr>
        <td>HBuilder</td>
        <td>hbuilder</td>
    </tr>
    <tr>
        <td>Sublime Text</td>
        <td>sublime_text</td>
    </tr>
    <tr>
        <td>PhpStorm</td>
        <td>phpstorm</td>
    </tr>
    <tr>
        <td>Brackets</td>
        <td>brackets</td>
    </tr>
    <tr>
        <td>RubyMine</td>
        <td>rubymine</td>
    </tr>
</table>

## 📧 交流与反馈

任何使用问题可以加入 QQ 群 `769748484` 或者添加作者微信 `zhoulx1688888` 进行咨询与反馈:

<div style="display: flex;">
  <img src="https://github.com/zh-lx/code-inspector/assets/73059627/b107aac0-0582-4392-b2c5-c375ccc4fedc" width="200" />
  <img src="https://user-images.githubusercontent.com/73059627/226233691-848b2a40-f1a9-414e-a80f-3fc6c6209eb1.png" width="200" />
</div>
