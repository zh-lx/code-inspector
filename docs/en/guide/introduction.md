# Introduction

`code-inspector-plugin` is a tool designed to enhance development efficiency based on `webpack/vite/rspack/nextjs/nuxt/umijs plugin`. By clicking on the DOM elements in your web page, it automatically opens your IDE and positions the cursor at the corresponding source code location.

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/demo.gif)

## Motive

In web development, to modify a module code, we first need to find the corresponding code file for the module. For some large projects with a large number of code files and deep file levels, it is not easy to quickly find the corresponding code files. Especially for developers who are new to a project, searching for the code corresponding to the module is often time-consuming and laborious.

Therefore, we yearn for a way for developers to quickly locate the code corresponding to the module, and `code-inspector-plugin` has emerged. With just one click of the mouse, you can directly locate the corresponding code of the DOM, greatly improving the experience and efficiency of developers.

## Advantages

Compared to similar tools on the market, `code-inspector-plugin` has some obvious leading advantages:

### Improve Efficiency

Click on a DOM element on the page, and it automatically opens your IDE, positioning the cursor to the source code location of the DOM. This greatly enhances the development experience and efficiency.

### User-Friendly

No intrusion into the source code, effective by simply including it in the bundler, the entire integration process is as easy as drinking water.

### Strong Adaptability

Supports usage in `webpack/vite/rspack/rsbuild/farm/nextjs/nuxt/umijs`, and supports multiple frameworks such as `Vue/React/Preact/Solid/Qwik/Svelte/Astro`.
