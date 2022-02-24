<div align="center">
<img src="https://user-images.githubusercontent.com/73059627/155552101-5df77d46-e852-4007-9983-7e7c093b88b5.png" width="360px" style="margin-bottom: 12px;" />

<p align="center">
  <a href="https://github.com/zh-lx/webpack-vue-debug/blob/main/README.md">English Doc</a>
  |
  <a href="https://github.com/zh-lx/webpack-vue-debug/blob/main/docs/README-ZH.md">中文文档</a>
</p>

[![NPM version](https://img.shields.io/npm/v/webpack-vue-debug.svg)](https://www.npmjs.com/package/webpack-vue-debug)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/webpack-vue-debug.svg)](https://github.com/zh-lx/webpack-vue-debug)
[![MIT-license](https://img.shields.io/npm/l/webpack-vue-debug.svg)](https://opensource.org/licenses/MIT)

<p>click the element of the page, it will open the vscode and jump to the source code of the element automatically.</p>
</div>

<hr />

## Install

### 1. install `webpack-vue-debug`

Execute the following command at the root of the project:

```perl
yarn add webpack-vue-debug -D
# or
npm install webpack-vue-debug -D
```

### 2. configure `vue.config.js`

Add the following configuration to the `vue.config.js`.<b>(Note that you need to determine the environment, this configuration is only used in the development environment)</b>:

```js
// vue.config.js
module.exports = {
  // ...other code
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === 'development') {
      // add this configuration in the development environment
      const DebugPlugin = require('webpack-vue-debug-plugin');
      config.module
        .rule('vue')
        .test(/\.vue$/)
        .use('webpack-vue-debug-loader')
        .loader('webpack-vue-debug-loader')
        .end();
      config.plugin('webpack-vue-debug-plugin').use(new DebugPlugin());
    }
  },
};
```

### 3. configure device environment(Mac)

If you use Mac, you need to do the following:

- Add a file named `.env.local` under the root directory of the project, and write the following contents to the `.env.local`:<br>
  ```
  # editor
  VUE_EDITOR=code
  ```
- Execute `command + shift + p` command in vscode, search and click `shell Command: Install 'code' command in Path`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

  If the following popup window appears, your configuration is successful:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

## Use and effect

As shown in the figure below, click the floating window with V mark in the page. When it turns green, it means that the function is turned on. (click again to turn off the function)<br/>

When the function is turned on, the information will appear when the mouse moves to the page element. Click the element, it will open vscode and jump to the source code of element.

![](https://s3.bmp.ovh/imgs/2021/08/b71d54d5d9c29640.gif)

## Performance

Tested by several large and medium-sized projects, the impact on the performance of build and rebuild is negligible.

<div align="center">
<img src="https://user-images.githubusercontent.com/73059627/155552101-5df77d46-e852-4007-9983-7e7c093b88b5.png" width="360px" style="margin-bottom: 12px;" />

<p align="center">
  <a href="https://github.com/zh-lx/webpack-vue-debug/blob/main/README.md">English Doc</a>
  |
  <a href="https://github.com/zh-lx/webpack-vue-debug/blob/main/docs/README-ZH.md">中文文档</a>
</p>

[![NPM version](https://img.shields.io/npm/v/webpack-vue-debug.svg)](https://www.npmjs.com/package/webpack-vue-debug)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/webpack-vue-debug.svg)](https://github.com/zh-lx/webpack-vue-debug)
[![MIT-license](https://img.shields.io/npm/l/webpack-vue-debug.svg)](https://opensource.org/licenses/MIT)

<p>click the element of the page, it will open the vscode and jump to the source code of the element automatically.</p>
</div>

<hr />

## Install

### 1. install `webpack-vue-debug`

Execute the following command at the root of the project:

```perl
yarn add webpack-vue-debug -D
# or
npm install webpack-vue-debug -D
```

### 2. configure `vue.config.js`

Add the following configuration to the `vue.config.js`.<b>(Note that you need to determine the environment, this configuration is only used in the development environment)</b>:

```js
// vue.config.js
module.exports = {
  // ...other code
  chainWebpack: (config) => {
    if (process.env.NODE_ENV === 'development') {
      // add this configuration in the development environment
      const DebugPlugin = require('webpack-vue-debug-plugin');
      config.module
        .rule('vue')
        .test(/\.vue$/)
        .use('webpack-vue-debug-loader')
        .loader('webpack-vue-debug-loader')
        .end();
      config.plugin('webpack-vue-debug-plugin').use(new DebugPlugin());
    }
  },
};
```

### 3. configure device environment(Mac)

If you use Mac, you need to do the following:

- Add a file named `.env.local` under the root directory of the project, and write the following contents to the `.env.local`:<br>
  ```
  # editor
  VUE_EDITOR=code
  ```
- Execute `command + shift + p` command in vscode, search and click `shell Command: Install 'code' command in Path`:

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

  If the following popup window appears, your configuration is successful:

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

## Use and effect

As shown in the figure below, click the floating window with V mark in the page. When it turns green, it means that the function is turned on. (click again to turn off the function)<br/>

When the function is turned on, the information will appear when the mouse moves to the page element. Click the element, it will open vscode and jump to the source code of element.

![](https://s3.bmp.ovh/imgs/2021/08/b71d54d5d9c29640.gif)

## Performance

Tested by several large and medium-sized projects, the impact on the performance of build and rebuild is negligible.
