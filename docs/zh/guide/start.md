# 快速开始

`code-inspector-plugin` 支持在以 `webpack` 或 `vite` 作为打包器的项目中使用，支持 `vue2/vue3/react` 等框架，请参考如下的接入教程。

## 安装

- 使用 npm 安装：

```perl
npm install code-inspector-plugin -D
```

- 使用 yarn 安装：

```perl
yarn add code-inspector-plugin -D
```

- 使用 pnpm 安装：

```perl
pnpm add code-inspector-plugin -D
```

## 配置

### 1. 配置 webpack 或者 vite

在 webpack 中使用：

```js
// webpack.config.js
const { CodeInspectorPlugin } = require('code-inspector-plugin');

module.exports = () => ({
  plugins: [
    CodeInspectorPlugin({
      bundler: 'webpack',
    }),
  ],
});
```

在 vite 中使用：

```js
// vite.config.js
import { defineConfig } from 'vite';
import { CodeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig({
  plugins: [
    CodeInspectorPlugin({
      bundler: 'vite',
    }),
  ],
});
```

### 2. 配置 vscode 命令行工具

::: tip Windows 或者其他 IDE 可跳过
仅当你的电脑为 Mac 且使用 vscode 作为 IDE 时需要配置此步，电脑为 Windows 或者使用其他 IDE 可以跳过此步。
:::

- 在 VSCode 中执行 `command + shift + p`(mac) 或 `ctrl + shift + p`(windows) 命令, 搜索 指令并点击 `Shell Command: Install 'code' command in PATH`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

- 如果出现如下弹窗，说明配置成功了:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

## 使用

目前使用 DOM 源码定位功能的方式有两种:

### 方式一（推荐）

在页面上按住组合键时，鼠标在页面移动即会在 DOM 上出现蓝色半透明遮罩层并显示相关信息，点击一下将自动打开 IDE 并将光标定位到元素对应的代码位置。 (Mac 系统默认组合键是 `Option + Shift`；Window 的默认组合键是 `Alt + Shift`，浏览器控制台会输出相关组合键提示)
![image](https://github.com/zh-lx/code-inspector/assets/73059627/a6c72278-d312-45b2-ab76-076a9837439e)

### 方式二

当插件参数中配置 `showSwitch: true` 时，会在页面显示一个`代码审查开关按钮`，点击可切换`代码审查模式`开启/关闭，`代码审查模式`开启后使用方式同方式一中按住组合键。当开关的颜色为彩色时，表示`代码审查模式`开启 <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block;" />；当开关颜色为黑白时，表示`代码审查模式`关闭 <img src="https://user-images.githubusercontent.com/73059627/230129864-e2813188-8d49-4a8e-a6bc-dda19c79b491.png" width="20" style="display: inline-block;" />。

![code-inspector](https://user-images.githubusercontent.com/73059627/227070438-6e40e112-6f1d-4f67-9f26-53986bff77c3.gif)
