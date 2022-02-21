# vnode-plugin

用于向 vue 项目编译后的 dom 上注入其对应编译前的代码在编辑器中位置信息的 webpack loader。<br/>

配合 [vnode-loader](https://github.com/zh-lx/vnode-loader) 一起使用

## 安装

### 1. 安装 `vnode-loader` 和 `vnode-plugin`

在项目根目录执行以下命令：

```
yarn add vnode-loader vnode-plugin -D
```

or

```
npm install vnode-loader vnode-plugin -D
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
      const VNodePlugin = require('vnode-plugin');
      config.module
        .rule('vue')
        .test(/\.vue$/)
        .use('vnode-loader')
        .loader('vnode-loader')
        .end();
      config.plugin('vnode-plugin').use(new VNodePlugin());
    }
  },
};
```

### 3. 添加环境配置

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

经多个大中型项目测试，对打 build 及 rebuild 的性能影响可忽略不计，可放心食用。
