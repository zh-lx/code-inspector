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

## 配置及使用

### 1. 配置 vscode 命令行工具

::: tip Windows 或者其他 IDE 可跳过
仅当你的电脑为 Mac 且使用 vscode 作为 IDE 时需要配置此步，电脑为 Windows 或者使用其他 IDE 可以跳过此步。
:::

- 在 VSCode 中执行 `command + shift + p`(mac) 或 `ctrl + shift + p`(windows) 命令, 搜索 指令并点击 `Shell Command: Install 'code' command in PATH`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

- 如果出现如下弹窗，说明配置成功了:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

### 2. 配置 webpack 或者 vite

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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    CodeInspectorPlugin({
      bundler: 'vite',
    }),
  ],
});
```
