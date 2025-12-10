# 快速开始

`code-inspector-plugin` 支持在以 `webpack/vite/rspack/rsbuild/esbuild/farm/mako` 作为打包器的项目中使用，支持 `vue/react/preact/solid/qwik/svelte/astro/nextjs/nuxt/umijs` 等框架，请参考如下的接入教程。

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

根据你的打包工具，完成对应的配置方式。

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

module.exports = {
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

::: details 点击展开查看 rsbuild 项目配置

```js
// rsbuild.config.js
import { defineConfig } from '@rsbuild/core';
import { codeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig({
  // ...other config
  tools: {
    rspack: {
      plugins: [
        codeInspectorPlugin({
          bundler: 'rspack',
        }),
      ],
    },
  },
});
```

:::

::: details 点击展开查看 esbuild 项目配置

```js
// esbuild.config.js
const esbuild = require('esbuild');
const { codeInspectorPlugin } = require('code-inspector-plugin');

esbuild.build({
  // other configs...

  // [注意] esbuild 中使用时，dev 函数的返回值需自己根据环境判断，本地开发的环境返回 true，线上打包返回 false
  plugins: [codeInspectorPlugin({ bundler: 'esbuild', dev: () => true })],
});
```

:::

::: details 点击展开查看 farm 项目配置

```js
// farm.config.js
import { defineConfig } from '@farmfe/core';
import { codeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig({
  vitePlugins: [
    codeInspectorPlugin({
      bundler: 'vite',
    }),
    // ...other code
  ],
});
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

- nuxt3.x :

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

- nuxt2.x :

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

- next <= 14.x :

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

- next 15.0.x ~ 15.2.x :

  ```js
  // next.config.js
  import type { NextConfig } from 'next';
  import { codeInspectorPlugin } from 'code-inspector-plugin';

  const nextConfig: NextConfig = {
    experimental: {
      turbo: {
        rules: codeInspectorPlugin({
          bundler: 'turbopack',
        }),
      },
    },
  };

  export default nextConfig;
  ```

- next >= 15.3.x :

  ```js
  // next.config.js
  import type { NextConfig } from 'next';
  import { codeInspectorPlugin } from 'code-inspector-plugin';

  const nextConfig: NextConfig = {
    turbopack: {
      rules: codeInspectorPlugin({
        bundler: 'turbopack',
      }),
    },
  };

  export default nextConfig;
  ```

:::

::: details 点击展开查看 umi.js 项目配置

- With webpack:

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

- With mako:

  ```ts
  // .umirc.ts
  import { defineConfig } from 'umi';
  import { codeInspectorPlugin } from 'code-inspector-plugin';

  export default defineConfig({
    // other config...
    mako: {
      plugins: [
        codeInspectorPlugin({
          bundler: 'mako',
        }),
      ],
    },
  });
  ```

:::

::: details 点击展开查看 astro 项目配置

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

## 使用

目前使用 DOM 源码定位功能的方式有两种:

### 方式一(推荐)

在页面上按住组合键时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，点击一下将自动打开 IDE 并将光标定位到元素对应的代码位置。 (Mac 系统默认组合键是 `Option + Shift`；Window 的默认组合键是 `Alt + Shift`，在浏览器控制台会输出相关组合键提示)
![image](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/console-success.png)

### 方式二(移动端推荐)

当插件参数中配置了 `showSwitch: true` 时，会在页面显示一个`代码审查开关按钮`，点击可切换`代码审查模式`开启/关闭，`代码审查模式`开启后使用方式同方式一中按住组合键。当开关的颜色为彩色时，表示`代码审查模式`开启 <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block;" />；当开关颜色为黑白时，表示`代码审查模式`关闭 <img src="https://user-images.githubusercontent.com/73059627/230129864-e2813188-8d49-4a8e-a6bc-dda19c79b491.png" width="20" style="display: inline-block;" />。

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/demo.gif)
