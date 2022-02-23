# webpack-vue-debug

[![NPM version](https://img.shields.io/npm/v/webpack-vue-debug.svg)](https://www.npmjs.com/package/webpack-vue-debug)
[![GITHUB star](https://img.shields.io/github/stars/zh-lx/webpack-vue-debug.svg)](https://github.com/zh-lx/webpack-vue-debug)
[![MIT-license](https://img.shields.io/npm/l/webpack-vue-debug.svg)](https://opensource.org/licenses/MIT)

点击页面上的 dom 元素，会自动打开 vscode 并跳转至 dom 对应的源代码。<br/>

## 安装

### 1. 安装 `webpack-vue-debug`

在项目根目录执行以下命令：

```
yarn add webpack-vue-debug -D
```

or

```
npm install webpack-vue-debug -D
```

### 2. 修改 `vue.config.js` 文件

在 `vue.config.js` 文件中，添加如下的 chainWebpack 配置<b>（注意需要判定一下环境，该功能只用于开发环境下）</b>：

```js
// vue.config.js
module.exports = {
  // ...other code
  chainWebpack: (config) => {
    // 添加如下代码，注意判别环境
    if (process.env.NODE_ENV === 'development') {
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

### 3. 添加环境配置（Mac）

Mac 环境下需要进行如下操作（windows 可以忽略这一步，如果不能正常唤醒 vscode 再尝试执行此步）

- 在项目根目录添加一个名为 `.env.local` 的文件夹，内容如下：<br>
  ```
  # editor
  VUE_EDITOR=code
  ```
- 在 vscode 中执行 `Command + Shift + P`, 输入 `shell Command: Install 'code' command in Path` 并点击该命令：

  <img src="https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png" width="60%" />

  出现以下弹窗表示设置成功：

  <img src="https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png" width="40%" />

## 使用及效果

如下图所示，点击页面中 V 的悬浮窗，变成绿色时代表功能开启。(再次点击可置灰关闭功能)<br>
鼠标移动至页面元素上会出现其信息，点击即可唤起 vscode 并跳转至其对应代码位置。
![](https://s3.bmp.ovh/imgs/2021/08/b71d54d5d9c29640.gif)

## 性能

经多个大中型项目测试，对打 build 及 rebuild 的性能影响可忽略不计。
