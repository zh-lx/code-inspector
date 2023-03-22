<div align="center">
<img src="https://t4.wodetu.cn/2023/03/19/cbea9d31e70a335d4494cf9699c0ab97.png" width=160px" style="margin-bottom: 12px;" />

<p align="center">
  <h2>vite-code-inspector-plugin</h2>
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/vite-plugin/README.md">English Doc</a>
  |
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/vite-plugin/README-ZH.md">中文文档</a>
  |
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/webpack-plugin/README.md">webpack-code-inspector-plugin</a>
</p>

[![NPM version](https://img.shields.io/npm/v/vite-code-inspector-plugin.svg)](https://www.npmjs.com/package/vite-code-inspector-plugin)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/code-inspector.svg)](https://github.com/zh-lx/code-inspector)
[![MIT-license](https://img.shields.io/npm/l/code-inspector.svg)](https://opensource.org/licenses/MIT)

<p>click the element on the page, it will automatically open the code editor and position the cursor to the source code of the element</p>
</div>

<hr />

## Usage

### 1. install `vite-code-inspector-plugin`

Execute the following command at the root of your project:

```perl
npm i vite-code-inspector-plugin -D
# or
yarn add vite-code-inspector-plugin -D
# or
pnpm add vite-code-inspector-plugin -D
```

### 2. configure `vite.config.js`

- Add the following configuration in `vite.config.js`:

  ```js
  // vite.config.js
  import { defineConfig } from 'vite';
  import { ViteCodeInspectorPlugin } from 'vite-code-inspector-plugin';

  // https://vitejs.dev/config/
  export default defineConfig({
    plugins: [ViteCodeInspectorPlugin()],
  });
  ```

### 3. Configure Vscode Command

If your editor is Vscode, you need to do the following:

- Execute `command + shift + p`(mac) or `ctrl + shift + p`(windows) command in vscode, search and click `shell Command: Install 'code' command in Path`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

- If the following popup window appears, your configuration is successful:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

## FAQ

- <b>Editor doesn't open automatically</b><br>
  If your editor doesn't open automatically when you click on a page element, it could be because of system permissions or other issues that prevent the plugin from reading the programs currently running on your computer. Please add a file named `.env.local` to your project root directory, add the following content:
  ```perl
  # editor
  CODE_EDITOR=code
  ```
