# API

`codeInspectorPlugin` 的详细参数配置如下所示：

```typescript
import { codeInspectorPlugin } from 'code-inspector-plugin';

const options = {
  bundler: 'vite',
};

codeInspectorPlugin(options);

interface CodeInspectorOptins {
  bunlder: 'vite' | 'webpack' | 'rspack';
  // 其他属性见下方说明...
}
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

## behavior <Badge type="tip" text="0.7.0+" vertical="middle" />

- 可选项。指定插件功能触发的行为
- 类型及说明如下：
  ```ts
  type Behavior = {
    /*
     * 是否启用点击跳转 IDE 定位代码的功能(默认为 true)
     */
    locate?: boolean;
    /*
     * 是否启动点击复制源代码位置信息(默认为 true)
     * 也可以设置字符串并通过 {file}、{line}、{column} 模版去指定要复制的信息格式
     * 默认值 true 相当于 "{file}:{line}:{column}" 的字符串格式
     */
    copy?: boolean | string;
  };
  ```

## editor

- 可选项。默认值为 `undefined`
- 类型：`string | undefined`，可选值有 `atom / code / code-insiders / idea / phpstorm / pycharm / webstorm / hbuilder`
- 说明：插件默认会自动识别当前系统中运行的 IDE，设置此项时，会打开指定的 IDE（对于指定 IDE 更推荐使用[指定 IDE](/guide/ide)章节的方式）

## injectTo <Badge type="tip" text="0.5.0+" vertical="middle" />

- 可选项。默认值为 `auto`
- 类型：`string | string[]`
- 说明：用于注入 DOM 筛选和点击跳转 vscode 的相关的 `client code` 代码的文件(必须为绝对路径且以 `.js/.ts/.mjs/.mts/.jsx/.tsx` 为结尾的文件)。(通常用于 SSR 项目中指定一个 client 端的文件)。`string[]` 类型仅在 `0.17.5` 及以上版本支持。

## dev <Badge type="tip" text="0.5.0+" vertical="middle" />

- 可选项
- 类型：`boolean | (() => boolean)`
- 说明：自定义 development 环境的判断。（插件内部会识别 `development` 环境以让插件生效，如果自动识别失败，需要手动指定）

## enforcePre <Badge type="tip" text="0.4.0+" vertical="middle" />

- 可选项(仅对 `webpack/rspack` 生效)。默认值为 `true`
- 类型：`boolean`
- 说明：是否在转换时添加 `enforce: 'pre'`，默认值为 `true`。（若因该插件引起了 `eslint-plugin` 校验错误或者热跟新时 eslint 的重复校验，需要此项设置为 `false`）。

## match <Badge type="tip" text="0.5.0+" vertical="middle" />

- 可选项。用于提升编译时性能
- 类型：`RegExp`
- 说明：仅对符合 `match` 正则表达式的文件会进行源码定位编译，以减少无效文件参与编译，默认为 `/\.(vue|jsx|tsx|js|ts|mjs|mts)$/`

## pathFormat <Badge type="tip" text="0.8.0+" vertical="middle" />

> 团队协作时推荐在 `.env.local` 中使用 `CODE_INSPECTOR_FORMAT_PATH` 定义本功能，避免影响其他人使用

- 可选项
- 类型：`string | string[]`
- 说明：指定打开 IDE 文件时的命令格式，默认值为 `{file}:{line}:{column}`，其中， `{file}`、`{line}`、`{column}` 会作为模版被动态替换。例如文件的源代码在 `/root/my-project/index.ts` 的第 `5` 行第 `11` 列，默认 vscode 执行的命令为 `code -g /root/my-project/index.ts:5:11`；如果我想只定位到对应的文件，不需要具体行列，且在文件最前面加上 `/Users` 参数，则应该设置此项值为 `"/Users{file}"`；如果我要额外添加 vscode 的参数去在新窗口打开，则设置此项值为 `["-n", "/Users{file}"]`。

## openIn <Badge type="tip" text="0.8.0+" vertical="middle" />

- 可选项
- 类型：`'reuse' | 'new'`
- 说明：指定打开 IDE 窗口的方式，默认会自动复用当前窗口，传 `reuse` 则复用当前窗口；传 `new` 则打开新窗口。

## needEnvInspector <Badge type="danger" text="已废弃" vertical="middle" />

- 可选项。默认值为 `false`
- 类型：`boolean`
- 说明：对于大多数人可以忽略这个配置。为 `true` 时，仅当 `.env.local` 文件存在且其包含 `CODE_INSPECTOR=true` 时插件功能才生效。（主要是解决团队内有部分成员不想使用该插件功能的需求）

## hideConsole

- 可选项。默认值为 `false`
- 类型：`boolean`
- 说明：默认情况下，插件在项目首次启动时会在浏览器控制台打印一行组合键按键的提示，设置此项为 `true` 可以禁用打印

## forceInjectCache <Badge type="danger" text="已废弃" vertical="middle" />

- 可选项(仅对 `webpack/rspack` 生效)。用于提升编译时性能
- 类型：`boolean`
- 说明：强制设置 `webpack/rspack` 交互注入逻辑的 loader 的缓存策略；为 true 时全缓存；为 false 时全不缓存；不设置则自动判断仅对入口文件不缓存，其余文件缓存。(设置此项为 `true` 时，可能导致无法启动 node server 引起的代码定位请求失败，慎用)。<b>升级到 `0.5.1` 版本后，优化了该缓存策略，不再需要设置此字段。</b>

## hooks <Badge type="tip" text="0.10.0+" vertical="middle" />

- 可选项。默认值为 `null`
- 类型如下：
  ```ts
  type SourceInfo = {
    file: string;
    line: number;
    column: number;
  };
  type Hooks = {
    /*
     * server 端接收到 DOM 源代码定位请求后的钩子函数
     */
    afterInspectRequest?: (
      options: CodeInspectorOptions,
      source: SourceInfo
    ) => void;
  };
  // 例如
  codeInspectorPlugin({
    bundler: 'vite',
    hooks: {
      afterInspectRequest: (options, source) => {
        console.log(source);
      },
    },
  });
  ```
- 说明：设置 `code-inspector-plugin` 某些生命周期的 hooks 回调

## escapeTags <Badge type="tip" text="0.11.0+" vertical="middle" />

- 可选项
- 类型：`(string | RegExp)[]`
- 说明：满足上述数组的标签，不会在编译时注入 `data-insp-path` 属性，以用于解决某些场景的告警问题。

## hideDomPathAttr <Badge type="tip" text="0.12.0+" vertical="middle" />

- 可选项
- 类型：`boolean`。默认值 `false`
- 说明：是否隐藏 DOM 元素上的 `data-insp-path` 属性

## ip <Badge type="tip" text="0.13.0+" vertical="middle" />

- 可选项
- 类型：`boolean | string`。默认值 `false`
- 说明：是否通过 ip 的方式向 node server 发送请求。默认值为 `false`，通过 `localhost` 发送请求；设置为 `true` 时，会自动检测本地的 ip，通过 ip 发送请求；指定为 `string` 类型时，通过指定的值发送请求

## importClient <Badge type="tip" text="0.14.1+" vertical="middle" />

- 可选项
- 类型：`string`。引入客户端交互代码的方式: file 为通过文件引入交互代码; code 为直接将交互代码注入页面。`0.16.x` 及之后的版本值默认为 `code`, `0.15.x` 之前的版本默认值为 `file`。
- 说明：引入客户端交互代码的方式: `file` 为引入交互代码所在的文件; `code` 为直接将交互代码注入页面。

## include <Badge type="tip" text="0.18.0+" vertical="middle" />

- 可选项
- 类型：`string | RegExp | (string | RegExp)[]`
- 说明：指定 `node_modules` 中的包名以让其内部文件参与编译注入 `path` 信息(多用于部分 monorepo 项目场景)
