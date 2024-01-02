# Changelog

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

- 【optimize】Optimize dependencies version

## 0.1.10

- 【fix】Fix the issue of injecting path information into the React built-in component, which will cause an error to be reported on the console

## 0.1.9

- 【optimize】Removing file path verification for Windows systems

## 0.1.8

- 【feature】Added the `needEnvInspector` parameter to support scenarios where the plugin only takes effect when `CODE_INSPECTOR=true` is configured in `.local.env`
- 【fix】Fix the issue of full page refresh during hot updates when used in webpack

## 0.1.7

【fix】Fix the issue where the position of the jsx syntax positioning column will move forward one grid

## 0.1.6

【fix】The code locate function eliminates the compilation and recognition for nodes_modules

## 0.1.5

【feature】Add the locating of jsx syntax in ``.js' and '.ts' files

## 0.1.4

【fix】Optimizing the judgment criteria for the development environment when used in webpack

## 0.1.3

【docs】Update content of Readme

## 0.1.2

【feature】Optimize the combination key prompt function in the browser console on Mac and Windows systems

## 0.1.1

【types】Optimize typescript prompts for the `bundle` parameter during use

## 0.1.0

【feature】First Release!
