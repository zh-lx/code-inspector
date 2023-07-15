# 介绍

`code-inspector-plugin` 是一款基于 `webpack/vite plugin` 的开发提效工具，点击页面上的元素，便能够自动打开你的代码编辑器并将光标定位到元素对应的代码位置。

![code-inspector](https://user-images.githubusercontent.com/73059627/227070438-6e40e112-6f1d-4f67-9f26-53986bff77c3.gif)

## 为什么需要 code-inspector-plugin

在 web 开发中，我们要修改一个模块代码，首先需要找到模块对应的代码文件。对于一些大型项目，代码文件数量多、文件层级深，要快速找到对应的代码文件并不是一件容易的事情。尤其是对应新接触一个项目的开发者，查找模块对应的代码往往比较费时费力。

因此，我们渴望有一种方式能让开发者快速定位到模块对应的代码，`code-inspector-plugin` 便应运而生了。只需要鼠标一点，就能直接定位到对应代码，大幅提升开发者的体验和效率。

## code-inspector-plugin 的优势

与市面上类似的工具相比，`code-inspector-plugin` 具有一些较为明显的领先优势：

- <b>准确的定位精度</b>：市面上工具如 `vue-devtools` 也具有类似的代码定位功能，但是由于 vue 编译的限制，`vue-devtools` 只能对每个 vue 文件的 Root DOM 进行定位，且只能定位到文件级别。与之相比，`code-inspector-plugin` 可以对所以源代码中的标签节点对应 DOM 进行定位，且能够精确到对应代码的每一行和每一列。
- <b>广泛的支持性</b>：`code-inspector-plugin` 对于多个打包器和前端框架进行了兼容，支持在 `webpack/vite` 中使用，且支持 `vue2/3`、`react` 等前端框架。
- <b>极致的使用体验</b>：在页面 DOM 筛选方面，`code-inspector-plugin` 内部通过实现一个 web component 组件将代码审查的 `html/js/css` 相关的逻辑封装在内，与宿主代码隔离的同时，带给了使用者极致的交互体验。
