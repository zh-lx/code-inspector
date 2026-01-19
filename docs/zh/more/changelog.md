# 更新日志

## 1.3.6

- 【fix】修复 Windows 系统中关于 `Module not found` 的错误 [#453](https://github.com/zh-lx/code-inspector/pull/453)

## 1.3.5

- 【feat】新增 `launchType` 参数，对于 MacOS 上的部分 editor 可以通过 `open` 指令快速定位文件 [#452](https://github.com/zh-lx/code-inspector/pull/452)
- 【fix】修复了 `Nextjs` 中部分情况会出现 `Module not found` 的错误 [#451](https://github.com/zh-lx/code-inspector/pull/451)

## 1.3.4

- 【feat】支持 `Kiro` IDE 的识别 [#447](https://github.com/zh-lx/code-inspector/pull/447)

## 1.3.3

- 【fix】兼容了无写文件权限时 server 无法正常启动的问题 [#445](https://github.com/zh-lx/code-inspector/pull/445)

## 1.3.2

- 【feat】支持了通过 `code-inspector-ignore` 或 `code-inspector-disable` 注释来忽略某些文件 [#443](https://github.com/zh-lx/code-inspector/pull/443)
- 【fix】修复了在 nextjs 中使用时，当编译出错后 server 会退出并无法自动重启的问题 [#442](https://github.com/zh-lx/code-inspector/pull/442)

## 1.3.1

- 【fix】修复了在 `webpack` 中使用 `cache` 时，二次启动后请求失败的问题 [#438](https://github.com/zh-lx/code-inspector/pull/438)
- 【fix】修复了按下 `hotKeys` 会阻塞原本的 `keydown` 事件的问题 [#437](https://github.com/zh-lx/code-inspector/pull/437)

## 1.3.0

- 【feat】兼容了 `nextjs 16.x` 及以上版本的项目 [#401](https://github.com/zh-lx/code-inspector/pull/401)
- 【feat】支持使用时切换 `locate/copy/target` 等功能的状态 [#424](https://github.com/zh-lx/code-inspector/pull/424)
- 【feat】新增 `server` 参数以关闭本地 node server 的启动 [#424](https://github.com/zh-lx/code-inspector/pull/424)
- 【feat】增加了对 `Codebuddy CN` 和 `Antigravity` 编辑器的识别 [#427](https://github.com/zh-lx/code-inspector/pull/427)

## 1.2.10

- 【fix】增加了 `nextjs` 可识别的文件范围 [#399](https://github.com/zh-lx/code-inspector/pull/399)

## 1.2.9

- 【fix】修复了在 `turbopack` 中使用时与 `middleware` 不兼容的问题 [#398](https://github.com/zh-lx/code-inspector/pull/398)

## 1.2.8

- 【fix】修复了在关于 `Maximum call stack size exceeded` 的报错问题 [#396](https://github.com/zh-lx/code-inspector/pull/396)

## 1.2.7

- 【fix】修复了在有 `app.ts` 文件的 `mako` 项目中的使用报错问题 [#392](https://github.com/zh-lx/code-inspector/pull/392)
- 【fix】修复了在多 page 的 nextjs 项目中失效的问题 [#391](https://github.com/zh-lx/code-inspector/pull/391)

## 1.2.6

- 【fix】兼容了在 `turbopack` 中与其他 `loader` 共同使用的问题 [#386](https://github.com/zh-lx/code-inspector/pull/386)

## 1.2.5

- 【fix】重新修复了 `turbopack` 中 `address already in use` 的报错问题 [#384](https://github.com/zh-lx/code-inspector/pull/384)

## 1.2.4

- 【feat】优化了定位文件时打开 editor 的速度 [#381](https://github.com/zh-lx/code-inspector/pull/381)
- 【feat】支持 `Qoder` 编辑器的识别 [#381](https://github.com/zh-lx/code-inspector/pull/381)
- 【fix】修复了 `turbopack` 中 `client code` 重复注入多个文件的问题 [#380](https://github.com/zh-lx/code-inspector/pull/380)

## 1.2.3

- 【feat】增加了 `skipSnippets` 参数，支持用户自定义跳过注入的代码片段 [#375](https://github.com/zh-lx/code-inspector/pull/375)
- 【fix】兼容了 `.mjs` 格式的 `next.config.mjs` 文件 [#374](https://github.com/zh-lx/code-inspector/pull/374)
- 【fix】修复了 `turbopack` 中 `address already in use` 的报错问题 [#373](https://github.com/zh-lx/code-inspector/pull/373)

## 1.2.2

- 【fix】修复了在 turbopack 中 `Error: Cannot find module '@code-inspector/webpack/dist/loader.js'` 的报错问题 [#369](https://github.com/zh-lx/code-inspector/pull/369)

## 1.2.1

- 【fix】修复了在 turbopack 中 `Error: Cannot find module '@code-inspector/webpack/dist/loader.js'` 的报错问题 [#367](https://github.com/zh-lx/code-inspector/pull/367)

## 1.2.0

- 【feat】增加了关于 `vite` 中插件配置顺序不正确时的提示 [#365](https://github.com/zh-lx/code-inspector/pull/365)
- 【feat】触发 `trackCode` 功能时增加了 `code-inspector:trackCode` 的自定义事件 [#364](https://github.com/zh-lx/code-inspector/pull/364)

## 1.1.1

- 【fix】修复了安装报错的问题 [9694900bb](https://github.com/zh-lx/code-inspector/commit/9694900bbde7b254184532b8eda10a3cad105a91)

## 1.1.0

- 【feat】支持了 `mako` 作为 bundler 的项目 [#361](https://github.com/zh-lx/code-inspector/pull/361)

## 1.0.5

- 【fix】修复了 `nextjs` 中使用 `webpack` 作为 bundler 时，插件不生效的问题 [#359](https://github.com/zh-lx/code-inspector/pull/359)

## 1.0.4

- 【feat】支持了 `.env.local` 文件部分情况下读取失败的问题 [#356](https://github.com/zh-lx/code-inspector/pull/356)

## 1.0.3

- 【fix】再次修复了 `nextjs 15.x(turbopack)` 中，入口文件声明了 `use client` 的报错问题 [#355](https://github.com/zh-lx/code-inspector/pull/355)

## 1.0.2

- 【feat】支持了 codebuddy 编辑器的识别 [#354](https://github.com/zh-lx/code-inspector/pull/354)

## 1.0.1

- 【fix】修复了 `nextjs 15.x(turbopack)` 中，入口文件声明了 `use client` 的报错问题 [#352](https://github.com/zh-lx/code-inspector/pull/352)

## 1.0.0 🎉

经过长时间的迭代，目前 `code-inspector` 的功能已经足够完善且趋于稳定，因此我很高兴在今天发布 `1.0.0` 版本。此次更新主要内容如下：

- 【feat】增加对 `nextjs 15.x(turbopack)` 的支持 [#349](https://github.com/zh-lx/code-inspector/pull/349)
- 【feat】较为完善的右键节点树选择能力 [#347](https://github.com/zh-lx/code-inspector/pull/347)


## 0.20.17

- 【feat】增加 `behavior.target` 参数支持自定义跳转路径 [#342](https://github.com/zh-lx/code-inspector/pull/342)

## 0.20.16

- 【perf】支持通过 PID 识别用户当前使用的 IDE [#340](https://github.com/zh-lx/code-inspector/pull/340)
- 【feat】支持 `Comate` 编辑器的识别 [#340](https://github.com/zh-lx/code-inspector/pull/340)
- 【fix】修复了 `exclude` 参数在 `webpack/rspack` 中的表现与 `vite/esbuild` 中表现不一致的问题 [#339](https://github.com/zh-lx/code-inspector/pull/339)

## 0.20.15

- 【fix】修复了 `exclude` 参数在 vite 和 esbuild 中不生效的问题 [#331](https://github.com/zh-lx/code-inspector/pull/331)

## 0.20.14

- 【fix】修复了微前端主子应用不在同一仓库下， `pathType` 为 `absoulte` 时也无法打开子应用源码的问题 [#329](https://github.com/zh-lx/code-inspector/pull/329)

## 0.20.13

- 【fix】禁止打开不属于项目的文件 [#327](https://github.com/zh-lx/code-inspector/pull/327)

## 0.20.12

- 【fix】修复了 `vue` 项目中使用 `pug` 语法部分场景构建错误的问题 [#321](https://github.com/zh-lx/code-inspector/pull/321)

## 0.20.11

- 【feat】支持了 `vue` 文件中通过 `<template src="xxx.html">` 的方式引入的 `html` 文件的源码定位 [#319](https://github.com/zh-lx/code-inspector/pull/319)、[#320](https://github.com/zh-lx/code-inspector/pull/320)

## 0.20.10

- 【fix】兼容了使用了 typescript 和 less/scss 等语法的 svelte 代码 [#311](https://github.com/zh-lx/code-inspector/pull/311)
- 【fix】适配了 idea 在 linux 系统中无法识别的问题 [#312](https://github.com/zh-lx/code-inspector/pull/312)

## 0.20.9

- 【fix】修复了在 `trae CN` 版本无法识别的问题 [#308](https://github.com/zh-lx/code-inspector/pull/308)

## 0.20.8

- 【fix】修复了在 `rspack` 中使用 `persistent` 缓存且插件未设置 `cache: true` 时的报错问题 [#305](https://github.com/zh-lx/code-inspector/pull/305)

## 0.20.7

- 【fix】修复了在 `rspack` 中使用 `persistent` 缓存时，二次启动项目后通信失败的问题 [#304](https://github.com/zh-lx/code-inspector/pull/304)

## 0.20.6

- 【feat】支持了 Windows 系统中 `trae CN.exe` 中文版的识别 [#300](https://github.com/zh-lx/code-inspector/pull/300)

## 0.20.5

- 【feat】支持了 `trae` 中文版的识别 [#299](https://github.com/zh-lx/code-inspector/pull/299)

## 0.20.4

- 【fix】修复了 pug 语法在 HMR 后无法定位的问题，支持了类字面值、ID 字面值、`Case`、`Each`、`While`、`When`、`Code`、`Conditional` 等 pug 语法 [#297](https://github.com/zh-lx/code-inspector/pull/297)

## 0.20.3

- 【fix】修复了客户端组件重复注册卸载导致交互不生效的问题 [#295](https://github.com/zh-lx/code-inspector/pull/295)

## 0.20.2

- 【feat】新增 `cache` API，允许用户在 `webpack/rspack` 且使用了 `filesystem` 缓存的项目中复用缓存能力 [#292](https://github.com/zh-lx/code-inspector/pull/292)
- 【fix】修复了当宿主页面元素设置了 `mousemove` 事件且内部有 `stopPropagation` 时，会阻塞插件交互的问题 [#291](https://github.com/zh-lx/code-inspector/pull/291)

## 0.20.1

- 【fix】修复了在 webpack 中使用 vue pug 语法时，无法定位到源码的问题 [#284](https://github.com/zh-lx/code-inspector/pull/284)
- 【feat】支持了 Windows 系统中 Trae 编辑器的识别 [#287](https://github.com/zh-lx/code-inspector/pull/287)

## 0.20.0

- 【fix】修复了 webpack v5 版本以上关于 `Compilation.assets` 的告警问题 [#280](https://github.com/zh-lx/code-inspector/pull/280)
- 【feat】支持通过 `pathType` 参数指定 `data-insp-path` 属性的路径类型，默认使用相对路径，可选使用绝对路径 [#278](https://github.com/zh-lx/code-inspector/pull/278)
- 【feat】支持 [trae](https://www.trae.ai) 编辑器的识别 [#277](https://github.com/zh-lx/code-inspector/pull/277)
- 【feat】支持了右键筛选元素父组件的功能 [#272](https://github.com/zh-lx/code-inspector/pull/272)

## 0.19.2

- 【fix】修复了项目没有使用 `git` 时的编译报错问题 [#269](https://github.com/zh-lx/code-inspector/pull/269)

## 0.19.1

- 【feat】支持通过 `exclude` 参数指定不参与编译的文件 [#266](https://github.com/zh-lx/code-inspector/pull/266)

## 0.19.0

- 【feat】支持通过 `printServer` 参数指定是否在控制台中打印 server 的启动信息 [#265](https://github.com/zh-lx/code-inspector/pull/265)
- 【feat】支持通过 `port` 参数指定 server 的启动端口 [#260](https://github.com/zh-lx/code-inspector/pull/260)
- 【fix】修复了在 `nextjs` 项目中使用 `instrumentation.ts` 功能时报错或者插件不生效的问题 [#264](https://github.com/zh-lx/code-inspector/pull/264)
- 【fix】修复了修改 `vite.config.ts` 文件后服务端口会重复启动多个的问题 [#261](https://github.com/zh-lx/code-inspector/pull/261)
- 【perf】DOM 上的 `data-insp-path` 属性从绝对路径优化为相对路径 [#256](https://github.com/zh-lx/code-inspector/pull/256)

## 0.18.3

- 【feat】支持了 `Windsurf` 的识别 [#254](https://github.com/zh-lx/code-inspector/pull/254)

## 0.18.2

- 【perf】优化交互体验：优先显示组件被调用处的源码位置 [#248](https://github.com/zh-lx/code-inspector/pull/248)

## 0.18.1

- 【feat】增加 `mappings` 参数，支持用户自定义源码文件路径映射关系，作为 `include` 的补充 [#242](https://github.com/zh-lx/code-inspector/pull/242)

## 0.18.0

- 【feat】支持通过 `include` 指定 `node_modules` 中的包名以让其内部文件参与编译注入 `path` 信息 [#241](https://github.com/zh-lx/code-inspector/pull/241)

## 0.17.9

- 【perf】优化在移动端的交互体验 [#240](https://github.com/zh-lx/code-inspector/pull/240)
- 【perf】提升在 Windows 系统中 IDE 识别唤起的性能 [#239](https://github.com/zh-lx/code-inspector/pull/239)

## 0.17.8

- 【fix】修复了点击 `disabled` DOM 的子元素时不生效的问题 [#237](https://github.com/zh-lx/code-inspector/pull/237)

## 0.17.7

- 【fix】修复了在 webpack 部分版本中使用时，构建错误的问题 [#234](https://github.com/zh-lx/code-inspector/pull/234)

## 0.17.6

- 【fix】修复构建错误问题 [#232](https://github.com/zh-lx/code-inspector/pull/232)

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
