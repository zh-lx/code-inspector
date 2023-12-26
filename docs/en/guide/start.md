# Get Started

`code-inspector-plugin` supports usage in projects using `webpack/vite/rspack` as bundlers and works with frameworks such as `vue/react/preact/solid`. Please refer to the integration tutorial below.

## Installation

- Use npm：

```shell
npm install code-inspector-plugin -D
```

- Use yarn：

```shell
yarn add code-inspector-plugin -D
```

- Use pnpm：

```shell
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

::: tip For Windows or other IDEs, you can skip this step
This step is only necessary if your computer is a Mac, and you are using VSCode as your IDE. You can skip this step if your computer is Windows or you use another IDE.
:::

- Execution `command + shift + p` in vscode, search and click `Shell Command: Install 'code' command in PATH`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

- If the prompt window appears as shown below, the configuration is successful:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

## Usage

Currently, there are two ways to use the DOM source code positioning feature:

### Method1(Recommend)

When holding down the specified shortcut keys on the page, a mask layer will appear on the DOM with relevant information as you move the mouse on the page. Clicking it will automatically open the IDE and position the cursor to the code location corresponding to the element. (The default shortcut keys for Mac are `Option + Shift`; for Windows, the default shortcut keys are `Alt + Shift`, and relevant shortcut key prompts will be output in the browser console.)
![image](https://github.com/zh-lx/code-inspector/assets/73059627/a6c72278-d312-45b2-ab76-076a9837439e)

### Method2

When the `showSwitch: true` option is configured in the plugin parameters, a `Code Inspection Switch Button` will be displayed on the page. Clicking it will toggle the `Code Inspection Mode` on/off. When `Code Inspection Mode` is enabled, use it the same way as in <b>Method1</b> by holding down the shortcut keys. When the switch is in color <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block;" /> , `Code Inspection Mode` is enabled; when the switch is colorless <img src="https://user-images.githubusercontent.com/73059627/230129864-e2813188-8d49-4a8e-a6bc-dda19c79b491.png" width="20" style="display: inline-block;" />, `Code Inspection Mode` is disabled.

![code-inspector](https://github.com/zh-lx/code-inspector/assets/73059627/ad7974e6-e8b5-4bda-a005-d8387108e997)
