# Get Started

`code-inspector-plugin` supports use in projects with `webpack`、`rspack` or `vite` as bundler, and supports frameworks such as `vue2/vue3/react/preact/solid`. Please refer to the following tutorial to install it.

## Installation

- Use npm：

```perl
npm install code-inspector-plugin -D
```

- Use yarn：

```perl
yarn add code-inspector-plugin -D
```

- Use pnpm：

```perl
pnpm add code-inspector-plugin -D
```

## Configuration

### 1.Config bundler

Use in webpack：

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

Use in vite：

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

Use in rspack：

```js
// rspack.config.js
const { CodeInspectorPlugin } = require('code-inspector-plugin');

module.exports =  = {
  // other config...
  plugins: [
    CodeInspectorPlugin({
      bundler: 'rspack',
    }),
    // other plugins...
  ],
};
```

### 2.Config VSCode

::: tip Windows or other IDE can skip this step
This step only needs to be configured if your computer system is Mac and you use vscode as the IDE. If your computer system is Windows or you use another IDE, you can skip this step.
:::

- Execution `command + shift + p`(mac) or `ctrl + shift + p`(windows) in vscode , search and click `Shell Command: Install 'code' command in PATH`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

- If the following window appears, it means successful configuration:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

## Usage

There are currently two methods to use the function of locating DOM source code:

### Method1(Recommend)

When holding down the combination key on the page and moving the mouse on the page, a mask layer will appear on the DOM and display relevant information about the dom. Clicking the mask layer will automatically open the IDE and locate the cursor to the corresponding code position of the DOM. (The default combination key for Mac system is `Option + Shift` and for Windows is `Alt + Shift`, and the browser console will output relevant combination key prompts.)
![image](https://github.com/zh-lx/code-inspector/assets/73059627/a6c72278-d312-45b2-ab76-076a9837439e)

### Method2

When `showSwitch: true` is configured in the plugin parameters, a `code-inspector switch button` will be displayed on the page, click to switch the `code-inspector mode` on/off. After the `code-inspector mode` is turned on, the function is the same as holding down the combination key in Method1. When the color of the switch is colored, it means that the `code-inspector mode` is on <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block;" />; and when the switch color is monochrome, it means that `code-inspector mode` is off <img src="https://user-images.githubusercontent.com/73059627/230129864-e2813188-8d49-4a8e-a6bc-dda19c79b491.png" width="20" style="display: inline-block;" />。

![code-inspector](https://user-images.githubusercontent.com/73059627/227070438-6e40e112-6f1d-4f67-9f26-53986bff77c3.gif)
