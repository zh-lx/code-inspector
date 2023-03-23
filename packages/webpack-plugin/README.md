<div align="center">
<img src="https://t4.wodetu.cn/2023/03/19/cbea9d31e70a335d4494cf9699c0ab97.png" width=160px" style="margin-bottom: 12px;" />

<p align="center">
  <h2>webpack-code-inspector-plugin</h2>
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/webpack-plugin/README.md">English Doc</a>
  |
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/webpack-plugin/README-ZH.md">中文文档</a>
  |
  <a href="https://github.com/zh-lx/code-inspector/blob/main/packages/vite-plugin/README.md">vite-code-inspector-plugin</a>
</p>

[![NPM version](https://img.shields.io/npm/v/webpack-code-inspector-plugin.svg)](https://www.npmjs.com/package/webpack-code-inspector-plugin)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/code-inspector.svg)](https://github.com/zh-lx/code-inspector)
[![MIT-license](https://img.shields.io/npm/l/code-inspector.svg)](https://opensource.org/licenses/MIT)

</div>

<hr />

## 📜Introduction

Click the element on the page, it will automatically open the code editor and position the cursor to the source code of the element.

![code-inspector](https://user-images.githubusercontent.com/73059627/227070438-6e40e112-6f1d-4f67-9f26-53986bff77c3.gif)

## 🚀Install

```perl
npm i webpack-code-inspector-plugin -D
# or
yarn add webpack-code-inspector-plugin -D
# or
pnpm add webpack-code-inspector-plugin -D
```

## 📦Usage

### 1. configure `vue.config.js` or `webpack.config.js`

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
        .use(new WebpackCodeInspectorPlugin());
    },
  };
  ```

- If you use `webpack.config.js`, add the following configuration:

  ```js
  // webpack.config.js
  const WebpackCodeInspectorPlugin = require('webpack-code-inspector-plugin');

  module.exports = (env = {}) => ({
    plugins: [new WebpackCodeInspectorPlugin()],
  });
  ```

### 2. Configure Vscode Command

If your editor is Vscode, you need to do the following:

- Execute `command + shift + p`(mac) or `ctrl + shift + p`(windows) command in vscode, search and click `shell Command: Install 'code' command in Path`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

- If the following popup window appears, your configuration is successful:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

### 3. Use Code Inspector

You can perform code inspector mode by turning on the switch or simultaneously pressing and holding hotKeys(default mac is 【Option + Shift】 and windows is 【Alt + Shift】). In this mode, click the element on the page, it will automatically open the code editor and position the cursor to the source code of the element.

## 🎨Options

| Parameter  | Description                                                                                                               | Type                | OptionValue                                                          | Default                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------- | ------------------------ |
| hideSwitch | Whether hide the button of this function                                                                                  | `boolean`           | `true/false`                                                         | `false`                  |
| hotKeys    | Combination keys for triggering this function.When the value is `false` or `[]`, the function can't be triggered by keys. | `string[] \| false` | Array<`'ctrlKey'`\|`'altKey'`\|`'metaKey'`\|`'shiftKey'`> \| `false` | `['altKey', 'shiftKey']` |
| autoToggle | After opening the function switch, whether automatically close the switch when triggering the jump editor function.       | `boolean`           | `true/false`                                                         | `true`                   |

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

## ❓FAQ

- <b>Editor doesn't open automatically</b><br>
  If your editor doesn't open automatically when you click on a page element, it could be because of system permissions or other issues that prevent the plugin from reading the programs currently running on your computer. Please add a file named `.env.local` to your project root directory, add the following content:
  ```perl
  # editor
  CODE_EDITOR=code
  ```
