---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'Code Inspector'
  # text: 'A Magic Tool for Developing'
  # tagline: Click the dom on the page, it can locate the dom's source code in the IDE
  text: '一个开发提效的神器'
  tagline: 点击页面上的 DOM 元素，它能自动打开 IDE 并定位到 DOM 对应源代码位置
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
    title: 提效神器
    details: 鼠标一点即能快速定位到源代码，大幅提升开发体验和效率
  - icon: 📖
    title: 简单易用
    details: 安装、配置及使用步骤都十分简洁，一分钟时间即可接入并使用
  - icon: 🎨
    title: 通用性强
    details: 支持在 webpack/vite 中使用，支持 vue/react 等多个框架
---
