---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'Code Inspector'
  # text: 'A Magic Tool for Developing'
  # tagline: Click the dom on the page, it can locate the dom's source code in the IDE
  text: '页面开发提效的神器'
  tagline: 点击页面上的 DOM 元素，它能自动打开 IDE 并将光标定位至 DOM 的源代码位置
  image:
    src: /logo.svg
    alt: ChoDocs
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/start
    - theme: alt
      text: 加入用户群
      link: /more/feedback

features:
  - icon: 🚀
    title: 开发提效
    details: 点击页面上的 DOM 元素，它能自动打开 IDE 并将光标定位至 DOM 的源代码位置，大幅提升开发体验和效率
  - icon: 📖
    title: 简单易用
    details: 对源代码无任何侵入，只需要在打包工具中引入就能够生效，整个接入过程如喝水般一样简单
  - icon: 🎨
    title: 适配性强
    details: 支持在 webpack/vite/rspack/nextjs/nuxt/umijs 中使用，支持 vue/react/preact/solid/qwik/svelte/astro 等多个框架
---
