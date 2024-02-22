# Get Started

`code-inspector-plugin` supports usage in projects using `webpack/vite/rspack/nextjs/nuxt/umijs` as bundlers and works with frameworks such as `vue/react/preact/solid/svelte/astro`. Please refer to the integration tutorial below.

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

::: details Click to expand configuration about: webpack

```js
// webpack.config.js
const { codeInspectorPlugin } = require('code-inspector-plugin');

module.exports = () => ({
  plugins: [
    codeInspectorPlugin({
      bundler: 'webpack',
    }),
  ],
});
```

:::

::: details Click to expand configuration about: vite

```js
// vite.config.js
import { defineConfig } from 'vite';
import { codeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig({
  plugins: [
    codeInspectorPlugin({
      bundler: 'vite',
    }),
  ],
});
```

:::

::: details Click to expand configuration about: rspack

```js
// rspack.config.js
const { codeInspectorPlugin } = require('code-inspector-plugin');

module.exports =  = {
  // other config...
  plugins: [
    codeInspectorPlugin({
      bundler: 'rspack',
    }),
    // other plugins...
  ],
};
```

:::

::: details Click to expand configuration about: vue-cli

```js
// vue.config.js
const { codeInspectorPlugin } = require('code-inspector-plugin');

module.exports = {
  // ...other code
  chainWebpack: (config) => {
    config.plugin('code-inspector-plugin').use(
      codeInspectorPlugin({
        bundler: 'webpack',
      })
    );
  },
};
```

:::

::: details Click to expand configuration about: nuxt

nuxt3.x :

```js
// nuxt.config.js
import { codeInspectorPlugin } from 'code-inspector-plugin';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  vite: {
    plugins: [codeInspectorPlugin({ bundler: 'vite' })],
  },
});
```

nuxt2.x :

```js
// nuxt.config.js
import { codeInspectorPlugin } from 'code-inspector-plugin';

export default {
  build: {
    extend(config) {
      config.plugins.push(codeInspectorPlugin({ bundler: 'webpack' }));
      return config;
    },
  },
};
```

:::

::: details Click to expand configuration about: next.js

```js
// next.config.js
const { codeInspectorPlugin } = require('code-inspector-plugin');

const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    config.plugins.push(codeInspectorPlugin({ bundler: 'webpack' }));
    return config;
  },
};

module.exports = nextConfig;
```

:::

::: details Click to expand configuration about: umi.js

```js
// umi.config.js or umirc.js
import { defineConfig } from '@umijs/max';
import { codeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig({
  chainWebpack(memo) {
    memo.plugin('code-inspector-plugin').use(
      codeInspectorPlugin({
        bundler: 'webpack',
      })
    );
  },
  // other config
});
```

:::

::: details Click to expand configuration about: astro

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { codeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig({
  vite: {
    plugins: [codeInspectorPlugin({ bundler: 'vite' })],
  },
});
```

:::

### 2.Config VSCode

::: tip For Windows or other IDEs, you can skip this step
This step is only necessary if your computer is a Mac, and you are using VSCode as your IDE. You can skip this step if your computer is Windows or you use another IDE.
:::

- Execution `command + shift + p` in vscode, search and click `Shell Command: Install 'code' command in PATH`:

  <img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/vscode-command-line.png" width="400px" />

- If the prompt window appears as shown below, the configuration is successful:

  <img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/command-line-success.png" width="300px" />

## Usage

Currently, there are two ways to use the DOM source code positioning feature:

### Method1(Recommend)

When holding down the specified shortcut keys on the page, a mask layer will appear on the DOM with relevant information as you move the mouse on the page. Clicking it will automatically open the IDE and position the cursor to the code location corresponding to the element. (The default shortcut keys for Mac are `Option + Shift`; for Windows, the default shortcut keys are `Alt + Shift`, and relevant shortcut key prompts will be output in the browser console.)
![image](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/console-success.png)

### Method2

When the `showSwitch: true` option is configured in the plugin parameters, a `Code Inspection Switch Button` will be displayed on the page. Clicking it will toggle the `Code Inspection Mode` on/off. When `Code Inspection Mode` is enabled, use it the same way as in <b>Method1</b> by holding down the shortcut keys. When the switch is in color <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block;" /> , `Code Inspection Mode` is enabled; when the switch is colorless <img src="https://user-images.githubusercontent.com/73059627/230129864-e2813188-8d49-4a8e-a6bc-dda19c79b491.png" width="20" style="display: inline-block;" />, `Code Inspection Mode` is disabled.

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/demo.gif)
