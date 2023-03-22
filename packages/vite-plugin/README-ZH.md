<div align="center">
<img src="https://t4.wodetu.cn/2023/03/19/cbea9d31e70a335d4494cf9699c0ab97.png" width=160px" style="margin-bottom: 12px;" />

<p align="center">
  <h2>vite-code-inspector-plugin</h2>
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/vite-plugin/README.md">English Doc</a>
  |
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/vite-plugin/README-ZH.md">中文文档</a>
  |
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/webpack-plugin/README-ZH.md">webpack-code-inspector-plugin</a>
</p>

[![NPM version](https://img.shields.io/npm/v/vite-code-inspector-plugin.svg)](https://www.npmjs.com/package/vite-code-inspector-plugin)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/code-inspector.svg)](https://github.com/zh-lx/code-inspector)
[![MIT-license](https://img.shields.io/npm/l/code-inspector.svg)](https://opensource.org/licenses/MIT)

<p>点击页面上的元素，将自动打开你的代码编辑器并将光标定位到元素对应的代码位置</p>
</div>

<hr />

## 使用

### 1. 安装 `vite-code-inspector-plugin`

在项目的根目录终端中执行以下命令:

```perl
npm i vite-code-inspector-plugin -D
# or
yarn add vite-code-inspector-plugin -D
# or
pnpm add vite-code-inspector-plugin -D
```

### 2. 配置 `vite.config.js`

- 在 `vite.config.js` 中添加如下配置:

  ```js
  // vite.config.js
  import { defineConfig } from 'vite';
  import { ViteCodeInspectorPlugin } from 'vite-code-inspector-plugin';

  // https://vitejs.dev/config/
  export default defineConfig({
    plugins: [ViteCodeInspectorPlugin()],
  });
  ```

### 3. 配置 VSCode

如果你的编辑器是 VSCode，需要进行如下配置:

- 在 VSCode 中执行 `command + shift + p`(mac) 或 `ctrl + shift + p`(windows) 命令, 搜索 指令并点击 `shell Command: Install 'code' command in Path`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

- 如果出现如下弹窗，说明配置成功了:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

## 常见问题

- <b>代码编辑器无法自动打开</b><br>
  如果你点击页面元素时无法自动打开代码编辑器，可能是因为系统权限或其他原因导致无法找到正在运行的代码编辑器。在项目根目录添加一个名为 `.env.local` 的文件并添加如下内容:
  ```perl
  # editor
  CODE_EDITOR=code
  ```
