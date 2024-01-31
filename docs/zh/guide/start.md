# 快速开始

`code-inspector-plugin` 支持在以 `webpack/vite/rspack/nextjs/nuxt/umijs` 作为打包器的项目中使用，支持 `vue/react/preact/solid/svelte` 等框架，请参考如下的接入教程。

## 安装

- 使用 npm 安装：

```shell
npm install code-inspector-plugin -D
```

- 使用 yarn 安装：

```shell
yarn add code-inspector-plugin -D
```

- 使用 pnpm 安装：

```shell
pnpm add code-inspector-plugin -D
```

## 配置

### 1. 配置打包工具

::: details 点击展开查看 webpack 项目配置

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

::: details 点击展开查看 vite 项目配置

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

::: details 点击展开查看 rspack 项目配置

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

::: details 点击展开查看 vue-cli 项目配置

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

::: details 点击展开查看 nuxt 项目配置

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

::: details 点击展开查看 next.js 项目配置

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

::: details 点击展开查看 umi.js 项目配置

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

### 2. 配置 vscode 命令行工具

::: tip Windows 或者其他 IDE 可跳过
仅当你的电脑为 Mac 且使用 vscode 作为 IDE 时需要配置此步，电脑为 Windows 或者使用其他 IDE 可以跳过此步。
:::

- 在 VSCode 中执行 `command + shift + p` 命令, 搜索并点击 `Shell Command: Install 'code' command in PATH`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="400px" />

- 如果出现如下弹窗，说明配置成功了:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="300px" />

## 使用

目前使用 DOM 源码定位功能的方式有两种:

### 方式一（推荐）

在页面上按住组合键时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，点击一下将自动打开 IDE 并将光标定位到元素对应的代码位置。 (Mac 系统默认组合键是 `Option + Shift`；Window 的默认组合键是 `Alt + Shift`，在浏览器控制台会输出相关组合键提示)
![image](https://github.com/zh-lx/code-inspector/assets/73059627/a6c72278-d312-45b2-ab76-076a9837439e)

### 方式二

当插件参数中配置了 `showSwitch: true` 时，会在页面显示一个`代码审查开关按钮`，点击可切换`代码审查模式`开启/关闭，`代码审查模式`开启后使用方式同方式一中按住组合键。当开关的颜色为彩色时，表示`代码审查模式`开启 <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block;" />；当开关颜色为黑白时，表示`代码审查模式`关闭 <img src="https://user-images.githubusercontent.com/73059627/230129864-e2813188-8d49-4a8e-a6bc-dda19c79b491.png" width="20" style="display: inline-block;" />。

![code-inspector](https://github.com/zh-lx/code-inspector/assets/73059627/ad7974e6-e8b5-4bda-a005-d8387108e997)
