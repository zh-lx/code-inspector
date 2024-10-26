# Changelog

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
