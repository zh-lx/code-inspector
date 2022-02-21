# webpack-vue-debug

开发环境下向 vue 项目编译后的 dom 上注入其对应编译前的代码在编辑器中位置信息，在页面上以调试模式点击 dom 元素，会自动打开 vscode 并跳转至 dom 对应的 vscode 中的源代码。<br/>

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

### 3. 添加环境配置

Mac 环境下需要进行如下操作（部分 windows 环境也需要，可以先忽略这部测试一下能否正常使用，不能的化再执行这一步）

- 在项目根目录添加一个名为 `.env.local` 的文件夹，内容如下：<br>
  ```
  # editor
  VUE_EDITOR=code
  ```
- 在 vscode 中执行 `Command + Shift + P`, 输入 `shell Command: Install 'code' command in Path` 并点击该命令：

  ![](https://s3.bmp.ovh/imgs/2021/08/a99ec7b8e93f55fd.png)
  出现以下弹窗表示设置成功：
  ![](https://s3.bmp.ovh/imgs/2021/08/c3d00a8efbb20feb.png)

## 使用及效果

如下图所示，点击页面中 V 的悬浮窗，变成绿色时代表功能开启。(再次点击可置灰关闭功能)<br>
鼠标移动至页面元素上会出现其信息，点击即可唤起 vscode 并跳转至其对应代码位置。
![](https://s3.bmp.ovh/imgs/2021/08/b71d54d5d9c29640.gif)

## 性能

经多个大中型项目测试，对打 build 及 rebuild 的性能影响可忽略不计。
