# 基础配置

`codeInspectorPlugin` 的详细参数配置如下所示：

```typescript
import { codeInspectorPlugin } from 'code-inspector-plugin';

codeInspectorPlugin({
  bundler: 'vite',
  editor: 'cursor',
  // 其他属性见下方说明...
});
```

## bundler

- 必选项。
- 类型：`string`
- 可选值：`vite / webpack / rspack / esbuild`
- 说明：指定当前项目使用的打包工具

## editor

- 可选项。
- 类型：`string`
- 可选值：`code / cursor / webstorm / appcode / atom / atom-beta / brackets / code-insiders / codium / colin / emacs / goland / hbuilder / idea / notepad / phpstorm / pycharm / rider / rubymine / sublime / vim / zed`
- 说明：`code-inspector-plugin` 默认会根据当前系统中运行的进程，自动识别你所使用的 IDE 并打开。当你的系统中同时运行多个类别的 IDE 时，`code-inspector-plugin` 所打开的 IDE 可能不是你所想打开的那个，此时，你可以通过设置 `editor` 参数来指定打开的 IDE。更多细节可以参考 [IDE](http://localhost:5173/guide/ide.html) 一节

## dev <Badge type="tip" text="0.5.0+" vertical="middle" />

- 可选项
- 类型：`boolean | (() => boolean)`
- 说明：`code-inspector-plugin` 内部会根据打包器的信息自动判断当前的环境且仅在 `development` 环境下生效。在某些情况下如老版本 `webpack` 或者用户自定义了环境变量，可能会判断 `development` 环境失败而导致 `code-inspector-plugin` 不生效。此时，你可以通过设置 `dev` 参数来手动添加判断是否为 `development` 环境的逻辑以让 `code-inspector-plugin` 生效。

## enforcePre <Badge type="tip" text="0.4.0+" vertical="middle" />

- 可选项。默认值为 `true`
- 类型：`boolean`
- 说明：是否为 `code-inspector-plugin` 添加 `enforce: 'pre'` 配置。某些项目(特别是 `vue-cli` 创建的项目)会内置 `eslint-loader`，如果 `code-inspector-plugin` 的编译逻辑在 `eslint-loader` 的校验逻辑之前执行，可能会导致 `eslint-loader` 抛出错误。此时，需要设置此项为 `false` 以让 `code-inspector-plugin` 的编译逻辑在 `eslint-loader` 校验逻辑之后执行。

## hotKeys

- 可选项。默认值为 `['altKey', 'shiftKey']`
- 类型：`('ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey')[]`
- 说明：触发源码定位功能的组合键，为空数组则会关闭组合键触发功能。(`ctrlKey` 对应 Mac 中的 `control` 键；`altKey` 对应 Mac 中的 `option` 键；`metaKey` 对应 Mac 中的 `command` 键)

## showSwitch

- 可选项。默认值为 `false`
- 类型：`boolean`
- 说明：是否在页面展示一个开关以开启和关闭源码定位功能。移动端使用时，组合键触发功能可能不太方便，此时更推荐使用此开关来开启和关闭源码定位功能。

## autoToggle

- 可选项。默认值为 `true`
- 类型：`boolean`
- 说明：配合 `showSwitch: true` 使用，触发了跳转 IDE 功能后，会自动将 `switch` 的功能关闭。（主要是为了防止用户切回页面后，页面聚焦时会直接误触发源码定位功能。）
