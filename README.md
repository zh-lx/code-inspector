<div align="center">
<img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width=160px" style="margin-bottom: 12px;" />

<p align="center">
  <h2>code-inspector</h2>
  <span>English Doc</span> | <a href="https://github.com/zh-lx/code-inspector/blob/main/docs/README-ZH.md">中文文档</a> | <a href="https://inspector.fe-dev.cn/en">Read Docs for More</a>
</p>

[![NPM version](https://img.shields.io/npm/v/code-inspector-plugin.svg)](https://www.npmjs.com/package/code-inspector-plugin)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/code-inspector.svg)](https://github.com/zh-lx/code-inspector)
[![MIT-license](https://img.shields.io/npm/l/code-inspector.svg)](https://opensource.org/licenses/MIT)

</div>

<hr />

## 📖 Introduction

Click the element on the page, it can automatically open the code editor and position the cursor to the source code of the element.

![code-inspector](https://github.com/zh-lx/code-inspector/assets/73059627/ad7974e6-e8b5-4bda-a005-d8387108e997)

## 💻 Try it out online

- [vue online demo](https://stackblitz.com/edit/vitejs-vite-4pseos?file=vite.config.ts)
- [react online demo](https://stackblitz.com/edit/vitejs-vite-svtwrr?file=vite.config.ts)
- [preact online demo](https://stackblitz.com/edit/vitejs-vite-iyawbf?file=vite.config.ts)
- [solid online demo](https://stackblitz.com/edit/solidjs-templates-6u76jn?file=vite.config.ts)
- [svelte online demo](https://stackblitz.com/edit/vitejs-vite-zoncqr?file=vite.config.ts)

## 🎨 Support

The following are which compilers, web frameworks and editors we supported now:

- The following bundlers are currently supported:<br />
  ✅ webpack<br />
  ✅ vite<br />
  ✅ rspack<br />
  ✅ Next.js / Nuxt / Umi.js eg.<br />
- The following Web frameworks are currently supported:<br />
  ✅ vue2<br />
  ✅ vue3<br />
  ✅ react<br />
  ✅ preact<br />
  ✅ solid<br />
  ✅ svelte
- The following code editors are currently supported:<br />
  [VSCode](https://code.visualstudio.com/) | [Visual Studio Code - Insiders](https://code.visualstudio.com/insiders/) | [WebStorm](https://www.jetbrains.com/webstorm/) | [Atom](https://atom.io/) | [HBuilderX](https://www.dcloud.io/hbuilderx.html) | [PhpStorm](https://www.jetbrains.com/phpstorm/) | [PyCharm](https://www.jetbrains.com/pycharm/) | [IntelliJ IDEA](https://www.jetbrains.com/idea/)

## 🚀 Install

```perl
npm i code-inspector-plugin -D
# or
yarn add code-inspector-plugin -D
# or
pnpm add code-inspector-plugin -D
```

## 🌈 Usage

Please check here for complete access and usage information: [code-inspector-plugin configuration](https://en.inspector.fe-dev.cn/guide/start.html#configuration)

### 1. Configuring Build Tools

<details>
  <summary>Click to expand: Webpack Project Configuration</summary>

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
  <summary>Click to expand: Vite Project Configuration</summary>

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
  <summary>Click to expand: Rspack Project Configuration</summary>

```js
// rspack.config.js
const { CodeInspectorPlugin } = require('code-inspector-plugin');

module.exports = {
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
  <summary>Click to expand: Vue-CLI Project Configuration</summary>

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
  <summary>Click to expand: Nuxt Project Configuration</summary>

For nuxt3.x :

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

For nuxt2.x :

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
  <summary>Click to expand: Next.js Project Configuration</summary>

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
  <summary>Click to expand: Umi.js Project Configuration</summary>

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

### 2. Configuring VSCode Command Line Tool

> **Tip:** Skip for Windows or other IDEs <br />
> This step is only required for Mac with vscode as IDE. Skip this step if your computer is Windows or if you use another IDE.

- In VSCode, press `command + shift + p`, search for and click `Shell Command: Install 'code' command in PATH`:
  ![image](https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png)
- If you see the dialog box below, the configuration was successful:
  ![image](https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png)

### 3. Usage

When pressing the combination keys on the page, moving the mouse over the page will display a mask layer on the DOM with relevant information. Clicking will automatically open the IDE and position the cursor to the corresponding code location. (The default combination keys for Mac are `Option + Shift`; for Windows, it's `Alt + Shift`, and the browser console will output related combination key prompts)
![image](https://github.com/zh-lx/code-inspector/assets/73059627/a6c72278-d312-45b2-ab76-076a9837439e)

## 👨‍💻 Contributors

Special thanks to the contributors of this project:<br />
<img src="https://contrib.rocks/image?repo=zh-lx/code-inspector" />

## 📧 Communication and Feedback

For any usage issues, please leave a message below my [Twitter](https://twitter.com/zhulxing312147) post or [submit an issue](https://github.com/zh-lx/code-inspector/issues) on Github.

For Chinese users, you can you can join the QQ group `769748484` add the author's WeiXin account `zhoulx1688888` for consultation and feedback:

<div style="display: flex; column-gap: 16px; row-gap: 16px; flex-wrap: wrap;">
  <img src="https://github.com/zh-lx/code-inspector/assets/73059627/6f0c8197-21e3-48d7-b9db-ffeb0e0d4ba7" width="200" height="272" />
  <img src="https://github.com/zh-lx/code-inspector/assets/73059627/28ebb97a-a114-4598-a6f2-0e45103284cc" width="200" height="272" />
</div>
