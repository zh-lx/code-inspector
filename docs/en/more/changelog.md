# Changelog

## 1.2.5

- 【fix】Re-fixed the `address already in use` error issue in `turbopack` [#384](https://github.com/zh-lx/code-inspector/pull/384)

## 1.2.4

- 【feat】Optimized the speed of opening editor when locating files [#381](https://github.com/zh-lx/code-inspector/pull/381)
- 【feat】Support `Qoder` editor recognition [#381](https://github.com/zh-lx/code-inspector/pull/381)
- 【fix】Fixed the issue where `client code` was injected into multiple files in `turbopack` [#380](https://github.com/zh-lx/code-inspector/pull/380)

## 1.2.3

- 【feat】Added `skipSnippets` parameter, support user-defined code snippet injection skipping [#375](https://github.com/zh-lx/code-inspector/pull/375)
- 【fix】Compatible with `.mjs` format `next.config.mjs` file [#374](https://github.com/zh-lx/code-inspector/pull/374)
- 【fix】Fixed the error issue `address already in use` in `turbopack` [#373](https://github.com/zh-lx/code-inspector/pull/373)

## 1.2.2

- 【fix】Fixed the error issue `Error: Cannot find module '@code-inspector/webpack/dist/loader.js'` in `nextjs 15.x(turbopack)` [#369](https://github.com/zh-lx/code-inspector/pull/369)

## 1.2.1

- 【fix】Fixed the error issue `Error: Cannot find module '@code-inspector/webpack/dist/loader.js'` in `nextjs 15.x(turbopack)` [#367](https://github.com/zh-lx/code-inspector/pull/367)

## 1.2.0

- 【feat】Added a warning about incorrect plugin configuration order in `vite` [#365](https://github.com/zh-lx/code-inspector/pull/365)
- 【feat】Added a custom event `code-inspector:trackCode` when triggering the `trackCode` function [#364](https://github.com/zh-lx/code-inspector/pull/364)

## 1.1.1

- 【fix】Fixed the issue where the installation failed [9694900bb](https://github.com/zh-lx/code-inspector/commit/9694900bbde7b254184532b8eda10a3cad105a91)

## 1.1.0

- 【feat】Supported project using `mako` as the bundler [#361](https://github.com/zh-lx/code-inspector/pull/361)

## 1.0.5

- 【fix】Fixed the issue where the plugin did not work when using `webpack` as the bundler in `nextjs` [#359](https://github.com/zh-lx/code-inspector/pull/359)

## 1.0.4

- 【feat】Support reading `.env.local` file in some cases [#356](https://github.com/zh-lx/code-inspector/pull/356)

## 1.0.3

- 【fix】Fixed the issue where the error occurred in `nextjs 15.x(turbopack)` when the entry file declares `use client` [#355](https://github.com/zh-lx/code-inspector/pull/355) again

## 1.0.2

- 【feat】Add support for `codebuddy` editor recognition [#354](https://github.com/zh-lx/code-inspector/pull/354)

## 1.0.1

- 【fix】Fixed the error issue when entry file declares `use client` in `nextjs 15.x(turbopack)` [#352](https://github.com/zh-lx/code-inspector/pull/352)

## 1.0.0 🎉

After a long period of iteration, the current `code-inspector` has already reached a sufficient level of completeness and stability, so I am happy to release the `1.0.0` version today. The main content of this update is as follows:

- 【feat】Add support for `nextjs 15.x(turbopack)` [#349](https://github.com/zh-lx/code-inspector/pull/349)
- 【feat】Add more comprehensive right-click node tree selection capabilities [#347](https://github.com/zh-lx/code-inspector/pull/347)

## 0.20.17

- 【feat】Add the `behavior.target` parameter to support custom jump paths [#342](https://github.com/zh-lx/code-inspector/pull/342)

## 0.20.16

- 【perf】Support identifying the user's currently active IDE via PID [#340](https://github.com/zh-lx/code-inspector/pull/340)
- 【feat】Add recognition support for the `Comate` code editor [#340](https://github.com/zh-lx/code-inspector/pull/340)
- 【fix】Resolve inconsistent behavior of the `exclude` parameter between `webpack/rspack` and `vite/esbuild` configurations [#339](https://github.com/zh-lx/code-inspector/pull/339)

## 0.20.15

- 【fix】Fixed the issue where the `exclude` parameter did not work in `vite` and `esbuild` [#331](https://github.com/zh-lx/code-inspector/pull/331)

## 0.20.14

- 【fix】Fixed the issue where the source code of the sub-application could not be opened when the main and sub-applications were not in the same repository and the `pathType` was `absolute` [#329](https://github.com/zh-lx/code-inspector/pull/329)

## 0.20.13

- 【fix】Forbid opening files outside the project [#327](https://github.com/zh-lx/code-inspector/pull/327)

## 0.20.12

- 【fix】Fixed the issue of building error in `vue` project using `pug` syntax [#321](https://github.com/zh-lx/code-inspector/pull/321)

## 0.20.11

- 【feat】Support source code location for `<template src="xxx.html">` in `vue` files [#319](https://github.com/zh-lx/code-inspector/pull/319)、[#320](https://github.com/zh-lx/code-inspector/pull/320)

## 0.20.10

- 【fix】Fixed compatibility with Svelte code using TypeScript and Less/SCSS [#311](https://github.com/zh-lx/code-inspector/pull/311)
- 【fix】Fixed the issue that `idea` cannot be recognized in the Linux system [#312](https://github.com/zh-lx/code-inspector/pull/312)

## 0.20.9

- 【fix】Fixed the issue that `trae CN` can't be recognized [#308](https://github.com/zh-lx/code-inspector/pull/308)

## 0.20.8

- 【fix】Fixed the issue where the error occurred in `rspack` with `persistent` cache and the plugin was not set to `cache: true` [#305](https://github.com/zh-lx/code-inspector/pull/305)

## 0.20.7

- 【fix】Fixed the issue where requests failed after the project was restarted in `rspack` with `persistent` cache [#304](https://github.com/zh-lx/code-inspector/pull/304)

## 0.20.6

- 【feat】Support recognition for `trae CN.exe` Chinese version on Windows [#300](https://github.com/zh-lx/code-inspector/pull/300)

## 0.20.5

- 【feat】Support recognition for `trae` Chinese version [#299](https://github.com/zh-lx/code-inspector/pull/299)

## 0.20.4

- 【fix】Fixed the issue where pug syntax could not be located after HMR, supports class literal, ID literal, `Case`, `Each`, `While`, `When`, `Code`, `Conditional` and other pug syntax [#297](https://github.com/zh-lx/code-inspector/pull/297)

## 0.20.3

- 【fix】Fixed the issue where the client component was repeatedly registered and unloaded, causing the interaction to fail [#295](https://github.com/zh-lx/code-inspector/pull/295)

## 0.20.2

- 【feat】Added `cache` API, allowing users to reuse cache capabilities in `webpack/rspack` projects that use `filesystem` caching [#292](https://github.com/zh-lx/code-inspector/pull/292)
- 【fix】Fixed an issue where plugin interaction would be blocked when host page elements had `mousemove` events with `stopPropagation` [#291](https://github.com/zh-lx/code-inspector/pull/291)

## 0.20.1

- 【fix】Fixed the issue where the `data-insp-path` attribute was not correctly injected into the `pug` template file [#284](https://github.com/zh-lx/code-inspector/pull/284)
- 【feat】Support recognition for [trae](https://www.trae.ai) editor on Windows [#287](https://github.com/zh-lx/code-inspector/pull/287)

## 0.20.0

- 【fix】Fixed the warning issue about `Compilation.assets` in webpack v5+ [#280](https://github.com/zh-lx/code-inspector/pull/280)
- 【feat】Support specifying the path type of the `data-insp-path` attribute through the `pathType` parameter, defaulting to relative path, optionally using absolute path [#278](https://github.com/zh-lx/code-inspector/pull/278)
- 【feat】Support recognition for [trae](https://www.trae.ai) editor [#277](https://github.com/zh-lx/code-inspector/pull/277)
- 【feat】Support filtering parent components of elements by right-clicking [#272](https://github.com/zh-lx/code-inspector/pull/272)

## 0.19.2

- 【fix】Fixed the compilation error when the project does not use `git` [#269](https://github.com/zh-lx/code-inspector/pull/269)

## 0.19.1

- 【feat】Support specifying files not to be compiled through the `exclude` parameter [#266](https://github.com/zh-lx/code-inspector/pull/266)

## 0.19.0

- 【feat】Support specifying the server port through the `port` parameter [#260](https://github.com/zh-lx/code-inspector/pull/260)
- 【feat】Support specifying whether to print server startup information in the console through the `printServer` parameter [#265](https://github.com/zh-lx/code-inspector/pull/265)
- 【fix】Fixed the issue where the `instrumentation.ts` file was not compiled in `nextjs` projects [#264](https://github.com/zh-lx/code-inspector/pull/264)
- 【fix】Fixed the issue where the server port would be repeatedly started when modifying the `vite.config.ts` file [#261](https://github.com/zh-lx/code-inspector/pull/261)
- 【perf】Optimized the `data-insp-path` attribute on the DOM from absolute path to relative path [#256](https://github.com/zh-lx/code-inspector/pull/256)

## 0.18.3

- 【feat】Supported recognition for `Windsurf` [#254](https://github.com/zh-lx/code-inspector/pull/254)

## 0.18.2

- 【perf】Optimized interaction experience: prioritize displaying the source code location of the component call [#248](https://github.com/zh-lx/code-inspector/pull/248)

## 0.18.1

- 【feat】Add `mappings` parameter, support user-defined source code file path mapping relationship, as a supplement to `include` [#242](https://github.com/zh-lx/code-inspector/pull/242)

## 0.18.0

- 【feat】Support specifying package names in `node_modules` through the `include` parameter to allow internal files to participate in compilation and inject `path` information [#241](https://github.com/zh-lx/code-inspector/pull/241)

## 0.17.9

- 【perf】Optimized the interaction experience on mobile devices [#240](https://github.com/zh-lx/code-inspector/pull/240)
- 【perf】Improved the performance of IDE recognition and invocation on Windows systems [#239](https://github.com/zh-lx/code-inspector/pull/239)

## 0.17.8

- 【fix】Fixed the issue where clicking a `disabled` DOM's child element would not work [#237](https://github.com/zh-lx/code-inspector/pull/237)

## 0.17.7

- 【fix】Fixed the issue about building error when used in a few versions of webpack [#234](https://github.com/zh-lx/code-inspector/pull/234)

## 0.17.6

- 【fix】Fix the issue about building error [#232](https://github.com/zh-lx/code-inspector/pull/232)

## 0.17.5

- 【perf】The `injectTo` parameter now supports passing an array to allow injecting multiple files simultaneously [#231](https://github.com/zh-lx/code-inspector/pull/231)
- 【feat】Webpack will also inject client code into HTML files to support some MPA-type projects [#230](https://github.com/zh-lx/code-inspector/pull/230)

## 0.17.4

- 【fix】Fixed the issue where it only worked on the first HTML page when used in MPA projects [#229](https://github.com/zh-lx/code-inspector/pull/229)

## 0.17.3

- 【fix】Fixed the issue where elements inside the `ShadowRoot` of a web component could not be hovered when using the `无界` web component solution [#227](https://github.com/zh-lx/code-inspector/pull/227).
- 【fix】Fixed the issue where a hydrate warning would be printed in the console when using the `hideDomPathAttr` attribute in Next.js v15+ projects [#226](https://github.com/zh-lx/code-inspector/pull/226).

## 0.17.2

- 【fix】Fix compatibility issues with Chinese and special characters in Windows systems [#225](https://github.com/zh-lx/code-inspector/pull/225)

## 0.17.1

- 【fix】Fix the error issue when the first two parameters of console.warn and console.error are not of string type. [#223](https://github.com/zh-lx/code-inspector/pull/223)

## 0.17.0

- 【refactor】Optimized the recognition logic for IDEs and added support for more IDEs [#222](https://github.com/zh-lx/code-inspector/pull/222)

## 0.16.2

- 【fix】Fixed the issue when using `hideDomPathAttr` in Nextjs, browser console will print hydrate warning [#219](https://github.com/zh-lx/code-inspector/pull/219)

## 0.16.1

- 【fix】Fixed the issue where lower version browsers do not support the `globalThis` variable. [#210](https://github.com/zh-lx/code-inspector/pull/210)
- 【refactor】Optimized the code for checking the `development` environment. [#209](https://github.com/zh-lx/code-inspector/pull/209)

## 0.16.0

- 【feat】Built-in recognition of cursor IDE. [#207](https://github.com/zh-lx/code-inspector/pull/207)
- 【perf】Optimize the injection logic of the client code. By default, inject using the `code` method, and for Next.js projects, it will automatically recognize and inject using the `file` method. [#203](https://github.com/zh-lx/code-inspector/pull/203).

## 0.15.2

- 【perf】Optimized console messages [#199](https://github.com/zh-lx/code-inspector/pull/199)

## 0.15.1

- 【fix】Fixed the issue where it occasionally did not work after compilation in Next.js [#198](https://github.com/zh-lx/code-inspector/pull/198)

## 0.15.0

- 【fix】Fixed the issue where code location could not be accurately pinpointed to the line/column when specifying the full path of the IDE [#191](https://github.com/zh-lx/code-inspector/pull/191), [#193](https://github.com/zh-lx/code-inspector/pull/193)
- 【feat】Added support for use in esbuild [#189](https://github.com/zh-lx/code-inspector/pull/189)

## 0.14.2

- 【fix】Fixed the issue where interaction code was being injected into multiple files repeatedly.
- 【fix】Fixed the issue where caching of the interaction code file `append-code-{port}.js` caused web component configurations to not take effect.

## 0.14.1

- 【feat】Added `importClient` property to support user-defined methods for injecting client code.
- 【perf】Optimized the logic for hiding the `data-insp-path` attribute.

## 0.14.0

- 【Refactor】Refactor the interaction and writing logic to perfectly solve the issue of interaction code injection failure in pure server-side rendering (SSR) scenarios such as `Next.js`.

## 0.13.0

- 【feat】Added support for element positioning in Vue files using pug syntax.
- 【feat】Added support for sending requests to the node server via IP address.

## 0.12.2

- 【perf】优化隐藏 `data-insp-path` 的逻辑

## 0.12.1

- 【fix】Fixed the issue where `data-insp-path` attribute is hidden by default.

## 0.12.0

- 【feat】Added `hideDomPathAttr` to hide the `data-insp-path` attribute on the DOM, improving DOM screening efficiency.
- 【feat】Removed file path validation in Windows systems.

## 0.11.0

- 【feat】Added `escapeTags` property to support custom tags without injecting `data-insp-path`
- 【feat】Optimized request method to prioritize `http` requests over `img` requests

## 0.10.1

- 【fix】Optimized the warning issue regarding `data-insp-path`.

## 0.10.0

- 【feat】Added configuration for hooks callback functions.
- 【fix】Fixed the issue of the `hotKeys` configuration not taking effect.
- 【fix】Optimized the warning issue regarding `data-insp-path`.

## 0.9.3

- 【feat】Optimized IDE prioritization for simultaneously opening multiple IDEs on Windows
- 【fix】Fixed the issue of failure to automatically recognize IDE path with Chinese Characters on Windows

## 0.9.2

- 【fix】Fixed the issue of being unable to open the source code in StackBlitz.

## 0.9.1

- 【perf】optimize the request for node server

## 0.9.0

- 【feat】Support usage in projects based on the `Astro` framework.

## 0.8.1

- 【fix】Fixed the issue where specifying IDE as `code` cannot open VSCode when running multiple IDEs in Windows.
- 【fix】Fixed the issue where the position of the overlay appears incorrectly when the `body` is styled with a `transform` property.
- 【fix】Fixed the issue where the debugger position points to the wrong location when using `debugger` for debugging in the code.

## 0.8.0

- 【feat】Added `pathFormat` parameter to support customizing the command format when opening the IDE.
- 【feat】Added `openIn` parameter to support reusing the current IDE window or opening in a new window.
- 【fix】Resolved warning about `Extraneous non-props attributes` in Vue.
- 【fix】Fixed issue where `behavior.copy` failed in non-HTTPS environments.

## 0.7.0

- 【feat】Added support for the `behavior` parameter to customize behavior when clicked.

## 0.6.5

- 【fix】Fixed the issue about `net::ERR_ADDRESS_INVALID`

## 0.6.4

- 【fix】Optimize the injection logic of client-side code in Vite projects.

## 0.6.3

- 【fix】Fixed the issue where the Node server fails to start during the second cold start due to `net::ERR_CONNECTION_REFUSED` error when using `webpack` with cache strategy set to `type: filesystem`.

## 0.6.2

- 【fix】Fixed the issue where clicking was not effective in `showSwitch: true` mode on mobile devices.

## 0.6.1

- 【fix】Fixed the issue of code location requests failing due to `XHR` cross-origin in certain scenarios.

## 0.6.0

- 【feat】Support usage in projects based on the `Svelte` framework.
- 【fix】Fix the issue where files with special characters such as `+&` in the file path couldn't be opened.

## 0.5.2

- 【fix】Fixed the issue where `disabled` elements couldn't trigger click events.
- 【fix】Resolved the problem causing errors when executing commands with `spawn` while `NODE_OPTIONS` were set.

## 0.5.1

- 【perf】Enhance the cache strategy for injecting loader in `webpack`, significantly improving the performance of HMR.

## 0.5.0

- 【perf】When the `injectTo` option is set, the injection loader of the interaction logic in `webpack/rspack` only takes effect for files specified in `injectTo`.
- 【feat】Added `dev` parameter, allowing users to customize the logic for determining the development environment.
- 【feat】Added `forceInjectCache` parameter, allowing users to enforce the caching strategy for the injection loader of the interaction logic in `webpack/rspack`.
- 【feat】Added `match` parameter, allowing users to specify the file types participating in source code location compilation to reduce the compilation of irrelevant files.

## 0.4.6

- 【fix】Resolved the issue where opening the corresponding code in VSCode was not possible on Windows systems when the installation path of VSCode contained Chinese characters.
- 【perf】Improved the caching logic of `inject-loader` in `webpack/rspack`.

## 0.4.5

- 【fix】Fix the warning in the Vue framework related to `[Vue warn]: Extraneous non-props attributes (data-insp-path)`.

## 0.4.4

- 【fix】Fix the issue of plugins not working on Windows.

## 0.4.3

- 【fix】Fixed the issue of plugin in sub-applications not work in micro-frontends framework.

## 0.4.2

- 【fix】Fix the issue of server not starting and `net::ERR_CONNECTION_REFUSED` error caused by caching.

## 0.4.1

- 【feat】Support importing webpack plugin in ESM format.

## 0.4.0

- 【feat】Add support for SSR, Umijs, and all projects using `webpack, vite, rspack` as the underlying bundlers.

## 0.3.2

- 【fix】Fix the issue of failure to execute the `ps aux xxx` command on certain Linux systems to obtain running processes.
- 【fix】Fix the issue of failing to retrieve `rootPath` in some scenarios when used in Vite projects.

## 0.3.1

- 【fix】Fix the issue of incompatible use of the plugin with `eslint-loader` in webpack
- 【fix】Fix the issue of being able to recognizing the `code-insiders` IDE in macOS system

## 0.3.0

- 【feat】Support using in project whose framework is `solid` or `preact`
- 【feat】Rename the dom attribute `vc-path` to `data-insp-path`
- 【style】Optimize the style of inspect overlay
- 【fix】Compatible with users using `sudo` to start the dev service

## 0.2.0

- 【feat】Support using in project whose bundler is `rspack`

## 0.1.13

- 【fix】Invalid prop `data-insp-path` supplied to `Fragment`

## 0.1.12

- 【feat】Add parameters: `hideConsole` and `editor`

## 0.1.11

- 【chore】Optimize dependencies version

## 0.1.10

- 【fix】Fix the issue of injecting path information into the React built-in component, which will cause an error to be reported on the console

## 0.1.9

- 【perf】Removing file path verification for Windows systems

## 0.1.8

- 【feat】Added the `needEnvInspector` parameter to support scenarios where the plugin only takes effect when `CODE_INSPECTOR=true` is configured in `.local.env`
- 【fix】Fix the issue of full page refresh during hot updates when used in webpack

## 0.1.7

【fix】Fix the issue where the position of the jsx syntax positioning column will move forward one grid

## 0.1.6

【fix】The code locate function eliminates the compilation and recognition for nodes_modules

## 0.1.5

【feat】Add the locating of jsx syntax in ``.js' and '.ts' files

## 0.1.4

【fix】Optimizing the judgment criteria for the development environment when used in webpack

## 0.1.3

【docs】Update content of Readme

## 0.1.2

【perf】Optimize the combination key prompt function in the browser console on Mac and Windows systems

## 0.1.1

【types】Optimize typescript prompts for the `bundle` parameter during use

## 0.1.0

【feat】First Release!
