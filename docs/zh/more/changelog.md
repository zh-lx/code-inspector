# 更新日志

## 0.17.5

- 【perf】`injectTo` 参数支持传入数组，以支持同时注入多个文件 [#231](https://github.com/zh-lx/code-inspector/pull/231)
- 【feat】webpack 会向 html 文件也注入 client 代码，以支持部分 MPA 类型的项目 [#230](https://github.com/zh-lx/code-inspector/pull/230)

## 0.17.4

- 【fix】修复了在 MPA 项目中使用时，只会在第一个 html 页面中会生效的问题 [#229](https://github.com/zh-lx/code-inspector/pull/229)

## 0.17.3

- 【fix】修复了在 `无界` 这种 web component 方案中使用时，无法筛选 web component `ShadowRoot` 内部元素的问题 [#227](https://github.com/zh-lx/code-inspector/pull/227)
- 【fix】修复了在 Nextjs v15+ 项目中使用 `hideDomPathAttr` 属性时，控制台会打印 hydrate 警告的问题 [#226](https://github.com/zh-lx/code-inspector/pull/226)

## 0.17.2

- 【fix】修复 windows 系统中对于中文及特殊字符的兼容 [#225](https://github.com/zh-lx/code-inspector/pull/225)

## 0.17.1

- 【fix】修复 `console.warn` 及 `console.error` 前两个参数非 `string` 类型时的报错问题 [#223](https://github.com/zh-lx/code-inspector/pull/223)

## 0.17.0

- 【refactor】优化了 IDE 的识别逻辑，并支持更多 IDE 的识别 [#222](https://github.com/zh-lx/code-inspector/pull/222)

## 0.16.2

- 【fix】修复了在 Nextjs 项目中使用 `hideDomPathAttr` 属性时，控制台会打印 hydrate 警告的问题 [#219](https://github.com/zh-lx/code-inspector/pull/219)

## 0.16.1

- 【fix】修复了低版本浏览器不支持 `globalThis` 变量的问题 [#210](https://github.com/zh-lx/code-inspector/pull/210)
- 【refactor】优化判断 `development` 环境的代码 [#209](https://github.com/zh-lx/code-inspector/pull/209)

## 0.16.0

- 【feat】内置了 cursor IDE 的识别 [#207](https://github.com/zh-lx/code-inspector/pull/207)
- 【perf】优化客户端代码的注入逻辑，默认通过 `code` 方式注入，对于 Nextjs 项目会自动识别并通过 `file` 方式注入 [#203](https://github.com/zh-lx/code-inspector/pull/203)

## 0.15.2

- 【perf】优化控制台提示 [#199](https://github.com/zh-lx/code-inspector/pull/199)

## 0.15.1

- 【fix】修复 Next.js 中编译后偶尔不生效的问题 [#198](https://github.com/zh-lx/code-inspector/pull/198)

## 0.15.0

- 【fix】修复指定 IDE 完整路径时代码定位无法精确到行/列的问题 [#191](https://github.com/zh-lx/code-inspector/pull/191)、[#193](https://github.com/zh-lx/code-inspector/pull/193)
- 【feat】支持在 esbuild 中使用 [#189](https://github.com/zh-lx/code-inspector/pull/189)

## 0.14.2

- 【fix】修复了交互代码会重复注入到多个文件中的问题
- 【fix】修复了交互代码文件 `append-code-{port}.js` 缓存导致 web component 组件配置不生效的问题

## 0.14.1

- 【feat】增加 `importClient` 属性，支持用户自定义注入的客户端代码的方式
- 【perf】优化隐藏 `data-insp-path` 属性的逻辑

## 0.14.0

- 【refactor】重构交互逻辑写入逻辑，完美解决 `nextjs` 等部分纯服务端渲染的 SSR 场景交互逻辑注入失败的问题

## 0.13.0

- 【feat】支持使用了 `pug` 语法的 Vue 文件的元素定位功能
- 【feat】支持通过 ip 地址的方式向 node server 发送请求

## 0.12.2

- 【perf】优化隐藏 `data-insp-path` 的逻辑

## 0.12.1

- 【fix】修复默认会隐藏 `data-insp-path` 属性的问题

## 0.12.0

- 【feat】新增 `hideDomPathAttr` 以隐藏 dom 上的 `data-insp-path` 属性，提升 DOM 筛查的效率
- 【feat】移除 Windows 系统中的文件路径校验

## 0.11.0

- 【feat】新增 `escapeTags` 属性，支持自定义不注入 `data-insp-path` 的标签
- 【feat】优化请求方式为先 `http` 请求，后 `img` 请求

## 0.10.1

- 【fix】优化关于 `data-insp-path` 的告警问题

## 0.10.0

- 【feat】增加 hooks 回调函数配置
- 【fix】修复 `hotKeys` 配置不生效的问题

## 0.9.3

- 【feat】优化在 windows 系统上同时打开多个 IDE 时唤起的优先级
- 【fix】修复 windows 上 IDE 路径存在中文时，无法自动识别打开的问题

## 0.9.2

- 【fix】修复在 stackblitz 中无法打开源代码的问题

## 0.9.1

- 【perf】优化 node server 请求方式

## 0.9.0

- 【feat】支持在以 `astro` 为框架的项目中使用

## 0.8.1

- 【fix】修复了在 windows 中运行多个 IDE 时，指定 IDE 为 `code` 无法打开 vscode 的问题
- 【fix】修复了当 `body` 设置了 `transform` 样式时，遮罩层出现的位置错误的问题
- 【fix】修复了代码中使用 `debugger` 调试时，debugger 位置指向错误的问题

## 0.8.0

- 【feat】增加 `pathFormat` 参数，支持自定义打开 IDE 时的命令格式
- 【feat】增加 `openIn` 参数，支持打开 IDE 窗口时复用当前窗口还是在新窗口打开
- 【fix】修复在 vue 中报 `Extraneous non-props attributes` 的警告
- 【fix】修复非 https 中使用 `behavior.copy` 失败的问题

## 0.7.0

- 【feat】增加 `behavior` 参数支持自定义点击时的行为

## 0.6.5

- 【fix】修复 `net::ERR_ADDRESS_INVALID` 的问题

## 0.6.4

- 【fix】优化 vite 项目中客户端代码的注入逻辑

## 0.6.3

- 【fix】修复 `webpack` 的缓存策略为 `type: filesystem` 时，二次冷启动时 node server 启动失败导致 `net::ERR_CONNECTION_REFUSED` 的报错

## 0.6.2

- 【fix】修复 `showSwitch: true` 模式在移动端点击不生效的问题

## 0.6.1

- 【fix】修复某些场景下 `XHR` 跨域导致的代码定位请求失败问题

## 0.6.0

- 【feat】支持在以 `svelte` 为框架的项目中使用
- 【fix】修复文件路径上有 `+&` 等特殊字符时无法打开的问题

## 0.5.2

- 【fix】修复 `disabled` 的元素无法触发点击定位的问题
- 【fix】修复设置了 `NODE_OPTIONS` 时 `spawn` 执行指令会报错的问题

## 0.5.1

- 【perf】优化 `webpack` 中 inject loader 的缓存策略，大幅提升热更新性能

## 0.5.0

- 【perf】设置 `injectTo` 选项时，`webpakc/rspack` 的交互逻辑的注入 loader 仅对 `injectTo` 文件生效
- 【feat】新增 `dev` 参数，支持用户自定义开发环境的判断逻辑
- 【feat】新增 `forceInjectCache` 参数，支持用户强制设置`webpakc/rspack` 的交互逻辑的注入 loader 的缓存策略
- 【feat】新增 `match` 参数，支持用户指定参与源码定位编译的文件类型以减少无关文件的编译

## 0.4.6

- 【fix】修复 windows 系统中 vscode 安装路径存在中文时，无法打开 vscode 对应代码的问题
- 【perf】优化 `webpack/rspack` 中 `inject-loader` 的缓存逻辑

## 0.4.5

- 【fix】修复 vue 框架中使用关于 `[Vue warn]: Extraneous non-props attributes (data-insp-path)` 的警告

## 0.4.4

- 【fix】修复插件在 Windows 不生效的问题

## 0.4.3

- 【fix】修复插件在微前端框架中使用时子应用不生效的问题

## 0.4.2

- 【fix】修复缓存引起的 server 未启动问题以及 `net::ERR_CONNECTION_REFUSED` 错误

## 0.4.1

- 【feat】支持以 ESM 方式引入 webpack 插件

## 0.4.0

- 【feat】支持了 SSR、Umijs 等所有以 `webpack、vite、rspack` 为底层打包工具的项目

## 0.3.2

- 【fix】修复在部分 linux 系统中执行 `ps aux xxx` 命令以获取运行程序失败的问题
- 【fix】修复部分情况下 vite 项目中使用时获取 `rootPath` 失败的问题

## 0.3.1

- 【fix】修复在 webpack 中与 `eslint-loader` 插件使用不兼容的问题
- 【fix】修复在 macOS 系统中无法自动识别 `code-insiders` IDE 的问题

## 0.3.0

- 【feat】支持在以 `solid` or `preact` 为框架的项目中使用
- 【feat】将注入 dom 中的属性 `vc-path` 重命名为 `data-insp-path`
- 【style】优化 dom 筛选框的样式
- 【fix】兼容用户使用 `sudo` 启动项目开发的场景

## 0.2.0

- 【feat】支持在 `rspack` 作为打包工具的项目中使用

## 0.1.13

- 【fix】修复在 `Fragment` 元素上注入 `data-insp-path` 属性报错问题

## 0.1.12

- 【feat】增加 `hideConsole` 和 `editor` 参数

## 0.1.11

- 【chore】优化依赖项版本

## 0.1.10

- 【fix】修复 react 内置组件注入路径信息会在控制台报错问题

## 0.1.9

- 【perf】移除 windows 系统的文件路径校验

## 0.1.8

- 【feat】新增 `needEnvInspector` 可选配置项
- 【fix】修复在 webpack 中使用会导致热更新时页面全量刷新的问题

## 0.1.7

【fix】修复 jsx 语法定位列位置会前移一格的问题

## 0.1.6

【fix】代码定位功能排除掉对于 node_modules 中的文件编译与识别

## 0.1.5

【feat】增加对于 `.js`，`.ts` 文件中 jsx 语法的定位

## 0.1.4

【fix】兼容在 webpack 中使用时对于开发环境的判断

## 0.1.3

【docs】更新 README 的文档内容

## 0.1.2

【perf】优化 Mac 系统、Windows 系统中浏览器控制台的按键提示功能

## 0.1.1

【types】优化使用时 `bundler` 参数的 typescript 提示

## 0.1.0

【feat】首次发布
