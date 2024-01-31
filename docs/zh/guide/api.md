# API

`codeInspectorPlugin` 的详细参数配置如下所示：

```typescript
import { codeInspectorPlugin } from 'code-inspector-plugin';

codeInspectorPlugin({
  bundler: 'vite',
  hotKeys: ['altKey', 'shiftKey'],
  showSwitch: false,
  autoToggle: false,
  needEnvInspector: false,
  hideConsole: false,
  editor: undefined,
});
```

## bundler

- 必传项
- 类型：`string`，可选值有 `vite/webpack/rspack`
- 说明：指定的打包工具类型

## hotKeys

- 可选项。默认值为 `['altKey', 'shiftKey']`
- 类型：`false` 或 `string[]`。类型为数组时，数组项的可选值为: `ctrlKey`、`altKey`、`metaKey`、`shiftKey`
- 说明：触发功能的组合键，为 `false` 或者空数组则关闭组合键触发功能。(`ctrlKey` 对应 Mac 中的 `control` 键；`altKey` 对应 Mac 中的 `option` 键；`metaKey` 对应 Mac 中的 `command` 键)

## showSwitch

- 可选项。默认值为 `false`
- 类型：`boolean`
- 说明: 是否在页面展示一个控制源码定位功能的开关，开关打开时和按住组合键的效果是相同的(更推荐使用组件键触发功能)

## autoToggle

- 可选项。默认值为 `true`
- 类型：`boolean`
- 说明：当配置了 `showSwitch: true, autoToggloe: true` 时，触发功能跳转 IDE 后，会自动将 `switch` 的功能关闭，主要是为了防止用户切会页面后鼠标点击直接误触发功能

## needEnvInspector

- 可选项。默认值为 `false`
- 类型：`boolean`
- 说明：对于大多数人可以忽略这个配置。为 `true` 时，仅当 `.env.local` 文件存在且其包含 `CODE_INSPECTOR=true` 时插件功能才生效。（主要是解决团队内有部分成员不想使用该插件功能的需求）

## hideConsole

- 可选项。默认值为 `false`
- 类型：`boolean`
- 说明：默认情况下，插件在项目首次启动时会在浏览器控制台打印一行组合键按键的提示，设置此项为 `true` 可以禁用打印

## editor

- 可选项。默认值为 `undefined`
- 类型：`string | undefined`，可选值有 `atom / code / code_insiders / idea / phpstorm / pycharm / webstorm / hbuilder`
- 说明：插件默认会自动识别当前系统中运行的 IDE，设置此项时，会打开指定的 IDE（对于指定 IDE 更推荐使用[指定 IDE](/guide/ide)章节的方式）

## enforcePre <Badge type="tip" text="0.4.0+" vertical="middle" />

- 可选项(仅对 `webpack/rspack` 生效)。默认值为 `true`
- 类型：`boolean`
- 说明：是否在转换时添加 `enforce: 'pre'`，默认值为 `true`。（若因该插件引起了 `eslint-plugin` 校验错误或者热跟新时 eslint 的重复校验，需要此项设置为 `false`）。

## injectTo <Badge type="tip" text="0.5.0+" vertical="middle" />

- 可选项。默认值为 `auto`
- 类型：`'auto' | 'all' | string`
- 说明：用于注入 DOM 筛选和点击跳转 vscode 的相关的 `client code` 代码的文件(必须为绝对路径且以 `.js/.ts/.mjs/.mts/.jsx/.tsx` 为结尾的文件)。为 `auto` 时会在符合上述条件的第一个文件注入 `client code`；为 `all` 时会在每个符合上述条件的文件中都注入 `client code`；也可自己指定一个绝对路径文件作为注入 `client code` 的文件(通常用于 SSR 项目中指定一个 client 端的文件)。

## dev <Badge type="tip" text="0.5.0+" vertical="middle" />

- 可选项
- 类型：`boolean | (() => boolean)`
- 说明：自定义 development 环境的判断。（插件内部会识别 `development` 环境以让插件生效，如果自动识别失败，需要手动指定）

## forceInjectCache <Badge type="danger" text="已废弃" vertical="middle" />

- 可选项(仅对 `webpack/rspack` 生效)。用于提升编译时性能
- 类型：`boolean`
- 说明：强制设置 `webpack/rspack` 交互注入逻辑的 loader 的缓存策略；为 true 时全缓存；为 false 时全不缓存；不设置则自动判断仅对入口文件不缓存，其余文件缓存。(设置此项为 `true` 时，可能导致无法启动 node server 引起的代码定位请求失败，慎用)。<b>升级到 `0.5.1` 版本后，优化了该缓存策略，不再需要设置此字段。</b>

## match <Badge type="tip" text="0.5.0+" vertical="middle" />

- 可选项。用于提升编译时性能
- 类型：`RegExp`
- 说明：仅对符合 `match` 正则表达式的文件会进行源码定位编译，以减少无效文件参与编译，默认为 `/\.(vue|jsx|tsx|js|ts|mjs|mts)$/`
