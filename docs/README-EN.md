<div align="center">
<img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width=160px" style="margin-bottom: 12px;" />

<p align="center">
  <h2>code-inspector</h2>
  <a href="https://github.com/zh-lx/code-inspector/blob/main/README.md">中文文档</a>
  | <span>English Doc</span>
</p>

[![NPM version](https://img.shields.io/npm/v/code-inspector-plugin.svg)](https://www.npmjs.com/package/code-inspector-plugin)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/code-inspector.svg)](https://github.com/zh-lx/code-inspector)
[![MIT-license](https://img.shields.io/npm/l/code-inspector.svg)](https://opensource.org/licenses/MIT)

</div>

<hr />

## 📖 Introduction

Click the element on the page, it can automatically open the code editor and position the cursor to the source code of the element.

![code-inspector](https://user-images.githubusercontent.com/73059627/227070438-6e40e112-6f1d-4f67-9f26-53986bff77c3.gif)

## 🚀 Install

```perl
npm i webpack-code-inspector-plugin -D
# or
yarn add webpack-code-inspector-plugin -D
# or
pnpm add webpack-code-inspector-plugin -D
```

## 🌈 Usage

This tool supports use as a `webpack` or `vite` plugin. Please refer to the following for details:

### 1. configure `webpack` or `vite`

- <b>In webpack</b>, configure `vue.config.js` or `webpack.config.js`:

  `vue.config.js`：

  ```js
  // vue.config.js
  const { CodeInspectorPlugin } = require('code-inspector-plugin');

  module.exports = {
    // ...other code
    chainWebpack: (config) => {
      config.plugin('code-inspector-plugin').use(
        CodeInspectorPlugin({
          bundler: 'webpack',
        })
      );
    },
  };
  ```

  `webpack.config.js`：

  ```js
  // webpack.config.js
  const { CodeInspectorPlugin } = require('code-inspector-plugin');

  module.exports = (env = {}) => ({
    plugins: [
      CodeInspectorPlugin({
        bundler: 'webpack',
      }),
    ],
  });
  ```

- <b>In vite</b>, add the following configuration in `vite.config.js`:

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

### 2. Configure Vscode Command

If your editor is Vscode, you need to do the following:

- Execute `command + shift + p`(mac) or `ctrl + shift + p`(windows) command in vscode, search and click `shell Command: Install 'code' command in Path`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

- If the following popup window appears, your configuration is successful:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

### 3. Use Code Inspector

There are two ways to use code inspector:

1. 【Recommend】Simultaneously pressing and holding combo keys to open the inspecting mode. (Default value of hotkeys in mac is `Option + Shift` and in windows is `Alt + Shift`)
2. Click the code inspector switch suspending on the page. When the color of the switch is colored, it means that inspecting mode is on <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" />; and when the color of the switch is gray, it means that inspecting mode is off <img src="https://user-images.githubusercontent.com/73059627/230129864-e2813188-8d49-4a8e-a6bc-dda19c79b491.png" width="20" />.（The Code Inspector switch button <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" /> is hidden by default, you need to configure `showSwitch: true` to display it on the page.）

When the inspecting mode is on, click the element on the page, it will automatically open the code editor and position the cursor to the source code of the element.

## 🎨 Options

| Parameter  | Description                                                                                                               | Required | Type                | OptionValue                                                          | Default                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------- | -------------------------------------------------------------------- | ------------------------ |
| bundler    | Specify your bundler                                                                                                      | required | -                   | `webpack/vite`                                                       |
| showSwitch | Whether show the switch button of this function                                                                           | optional | `boolean`           | `true/false`                                                         | `false`                  |
| hotKeys    | Combination keys for triggering this function.When the value is `false` or `[]`, the function can't be triggered by keys. | optional | `string[] \| false` | Array<`'ctrlKey'`\|`'altKey'`\|`'metaKey'`\|`'shiftKey'`> \| `false` | `['altKey', 'shiftKey']` |
| autoToggle | After opening the function switch, whether automatically close the switch when triggering the jump editor function.       | optional | `boolean`           | `true/false`                                                         | `true`                   |

```js
// vite.config.js
import { defineConfig } from 'vite';
import { ViteCodeInspectorPlugin } from 'vite-code-inspector-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    ViteCodeInspectorPlugin({
      showSwitch: false,
      hotKeys: ['altKey', 'shiftKey'],
      autoToggle: true,
    }),
  ],
});
```

## 🎯 Specify IDE

By default, `webpack-code-inspector-plugin` automatically identifies the IDE program currently running on the system and opens the first identified program according to priority. If you have multiple different IDEs, you can specify which one to open. Add a file named `.env.local` to the root of the project root and add `CODE_EDITOR=[IDE encoding name]` to the file.

Taking vscode as an example, its `IDE encoding name` is `code`, so the following content should be added in `.env.local`:

```perl
# specify the IDE is vscode
CODE_EDITOR=code
```

The comparison table of IDE and its corresponding `IDE encoding name` is as follows:

<table>
    <tr>
        <th>IDE</th>
        <th>IDE encoding name</th>
    </tr>
    <tr>
        <td>Visual Studio Code</td>
        <td>code</td>
    </tr>
    <tr>
        <td>Visual Studio Code - Insiders</td>
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
        <td>hbuilder</td>
    </tr>
    <tr>
        <td>PhpStorm</td>
        <td>phpstorm</td>
    </tr>
    <tr>
        <td>Pycharm</td>
        <td>pycharm</td>
    </tr>
    <tr>
        <td>IntelliJ IDEA</td>
        <td>idea</td>
    </tr>
</table>

## 🎨 Support

The following are which compilers, web frameworks and editors we supported now:

- The following bundlers are currently supported:<br />
  ✅ webpack(4.x/5.x)<br />
  ✅ vite
- The following Web frameworks are currently supported:<br />
  ✅ vue2<br />
  ✅ vue3<br />
  ✅ react
- The following code editors are currently supported:<br />
  [VSCode](https://code.visualstudio.com/) | [Visual Studio Code - Insiders](https://code.visualstudio.com/insiders/) | [WebStorm](https://www.jetbrains.com/webstorm/) | [Atom](https://atom.io/) | [HBuilderX](https://www.dcloud.io/hbuilderx.html) | [PhpStorm](https://www.jetbrains.com/phpstorm/) | [PyCharm](https://www.jetbrains.com/pycharm/) | [IntelliJ IDEA](https://www.jetbrains.com/idea/)

## 📧 Communication and Feedback

For any usage issues, you can join the QQ group `769748484` or add the author's WeChat account `zhoulx1688888` for consultation and feedback:

<div style="display: flex;">
  <img src="https://github.com/zh-lx/code-inspector/assets/73059627/b107aac0-0582-4392-b2c5-c375ccc4fedc" width="200" />
  <img src="https://user-images.githubusercontent.com/73059627/226233691-848b2a40-f1a9-414e-a80f-3fc6c6209eb1.png" width="200" />
</div>
