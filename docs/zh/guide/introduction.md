# 介绍

`code-inspector-plugin` 是一款基于 `webpack/vite/rspack/nextjs/nuxt/umijs plugin` 的提升开发效率的工具，点击页面上的 DOM，它能够自动打开你的 IDE 并将光标定位到 DOM 对应的源代码位置。

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/demo.gif)

## 动机

在 web 开发中，当我们要修改一个组件的代码时，首先需要找到组件对应的代码位置。对于一些大型项目，代码文件数量多、文件层级深，要快速找到对应的代码位置并不是一件容易的事情。尤其是对于一个新接触项目的开发者来说，查找组件对应的代码位置往往费时费力。

因此，我们渴望有一种方式能让开发者快速定位到组件对应的代码，`code-inspector-plugin` 便应运而生了。只需要鼠标点击页面上的元素，就能够自动打开你的 IDE 并将光标定位到 DOM 对应的源代码位置，这样可以大幅提升开发者的体验和效率。

## 优点

### 开发提效

点击页面上的 DOM 元素，它能自动打开 IDE 并将光标定位至 DOM 的源代码位置，大幅提升开发体验和效率

### 简单易用

对源代码无任何侵入，只需要在打包工具中引入就能够生效，整个接入过程如喝水般一样简单

### 适配性强

支持在 `webpack/vite/rspack/rsbuild/esbuild/farm/nextjs/nuxt/umijs` 中使用，支持 `vue/react/preact/solid/qwik/svelte/astro` 等多个框架
