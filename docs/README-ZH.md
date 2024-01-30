<div align="center">
<img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width=160px" style="margin-bottom: 12px;" />

<p align="center">
  <h2>code-inspector-plugin</h2>
  <span>中文文档</span> |
  <a href="https://github.com/zh-lx/code-inspector/blob/main/README.md">English Doc</a> | 
  <a href="https://inspector.fe-dev.cn">完整文档</a>
</p>

[![NPM version](https://img.shields.io/npm/v/code-inspector-plugin.svg)](https://www.npmjs.com/package/code-inspector-plugin)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/code-inspector.svg)](https://github.com/zh-lx/code-inspector)
[![MIT-license](https://img.shields.io/npm/l/code-inspector.svg)](https://opensource.org/licenses/MIT)

</div>

<hr />

## 📖 介绍

点击页面上的元素，能够自动打开你的代码编辑器并将光标定位到元素对应的代码位置。

![code-inspector](https://github.com/zh-lx/code-inspector/assets/73059627/ad7974e6-e8b5-4bda-a005-d8387108e997)

## 💻 在线体验

- [vue online demo](https://stackblitz.com/edit/vitejs-vite-4pseos?file=vite.config.ts)
- [react online demo](https://stackblitz.com/edit/vitejs-vite-svtwrr?file=vite.config.ts)
- [preact online demo](https://stackblitz.com/edit/vitejs-vite-iyawbf?file=vite.config.ts)
- [solid online demo](https://stackblitz.com/edit/solidjs-templates-6u76jn?file=vite.config.ts)
- [svelte online demo](https://stackblitz.com/edit/vitejs-vite-zoncqr?file=vite.config.ts)

## 🎨 支持列表

当前支持的编译器、web 框架以及 IDE 如下:

- 当前支持以下打包工具<br />
  ✅ webpack<br />
  ✅ vite<br />
  ✅ rspack<br />
  ✅ next.js / Nuxt / Umijs 等
- 当前支持以下 Web 框架<br />
  ✅ vue2<br />
  ✅ vue3<br />
  ✅ react<br />
  ✅ preact<br />
  ✅ solid<br />
  ✅ svelte
- 当前支持以下代码编辑器<br />
  [VSCode](https://code.visualstudio.com/) | [Visual Studio Code - Insiders](https://code.visualstudio.com/insiders/) | [WebStorm](https://www.jetbrains.com/webstorm/) | [Atom](https://atom.io/) | [HBuilderX](https://www.dcloud.io/hbuilderx.html) | [PhpStorm](https://www.jetbrains.com/phpstorm/) | [PyCharm](https://www.jetbrains.com/pycharm/) | [IntelliJ IDEA](https://www.jetbrains.com/idea/)

## 🚀 安装

```perl
npm i code-inspector-plugin -D
# or
yarn add code-inspector-plugin -D
# or
pnpm add code-inspector-plugin -D
```

## 🌈 使用

完整的接入及使用方式请查看：[code-inspector-plugin 配置](https://inspector.fe-dev.cn/guide/start.html#%E9%85%8D%E7%BD%AE)

### 1. 配置打包工具

<div style="margin-left: 16px;">

<details>
  <summary>点击展开查看 <b>webpack</b> 项目配置</summary>

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

</details>

<details>
  <summary>点击展开查看 <b>vite</b> 项目配置</summary>

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

</details>

<details>
  <summary>点击展开查看 <b>rspack</b> 项目配置</summary>

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

</details>

<details>
  <summary>点击展开查看 <b>vue-cli</b> 项目配置</summary>

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

</details>

<details>
  <summary>点击展开查看 <b>nuxt</b> 项目配置</summary>

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

</details>

<details>
  <summary>点击展开查看 <b>next.js</b> 项目配置</summary>

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

</details>

<details>
  <summary>点击展开查看 <b>umi.js</b> 项目配置</summary>

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

</details>

</div>

### 2. 配置 vscode 命令行工具

<div style="margin-left: 16px;">

> **Tip:** Windows 或者其他 IDE 可跳过 <br />
> 仅当你的电脑为 Mac 且使用 vscode 作为 IDE 时需要配置此步，电脑为 Windows 或者使用其他 IDE 可以跳过此步。

在 VSCode 中执行 `command + shift + p` 命令, 搜索并点击 `Shell Command: Install 'code' command in PATH`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="400px" />

如果出现如下弹窗，说明配置成功了:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="300px" />

</div>

### 3. 使用功能

<div style="margin-left: 16px;">

在页面上按住组合键时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，点击一下将自动打开 IDE 并将光标定位到元素对应的代码位置。 (Mac 系统默认组合键是 `Option + Shift`；Window 的默认组合键是 `Alt + Shift`，在浏览器控制台会输出相关组合键提示)

<img src="https://github.com/zh-lx/code-inspector/assets/73059627/a6c72278-d312-45b2-ab76-076a9837439e" width="700px" />

</div>

## 👨‍💻 Contributors

特别鸣谢本项目的贡献者：<br />
<img src="https://contrib.rocks/image?repo=zh-lx/code-inspector" />

## 📧 交流与反馈

任何使用问题可以加入 QQ 群 `769748484`、微信群或者添加作者微信 `zhoulx1688888` 进行咨询与反馈:

<div style="display: flex; column-gap: 16px; row-gap: 16px; flex-wrap: wrap;">
  <img src="https://github.com/zh-lx/code-inspector/assets/73059627/6f0c8197-21e3-48d7-b9db-ffeb0e0d4ba7" width="200" height="272" />
  <img src="https://github.com/zh-lx/code-inspector/assets/73059627/acd7dafb-b47a-480c-8ab0-93801f39477f" width="200" height="272" />
  <img src="https://github.com/zh-lx/code-inspector/assets/73059627/28ebb97a-a114-4598-a6f2-0e45103284cc" width="200" height="272" />
</div>
