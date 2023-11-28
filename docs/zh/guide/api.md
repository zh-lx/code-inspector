# API

`CodeInspectorPlugin` 的详细参数配置如下所示：

```typescript
import { CodeInspectorPlugin } from 'code-inspector-plugin';

CodeInspectorPlugin({
  bundler: 'vite',
  showSwitch: false,
  hotKeys: ['altKey', 'shiftKey'],
  autoToggle: true,
  needEnvInspector: false,
  hideConsole: false,
});
```

## bundler

- 必传项
- 类型：`string`，可选值有 `vite` / `webpack` / `rspack`
- 说明：指定的打包工具类型

## showSwitch

- 可选项。默认值为 `false`
- 类型：`boolean`
- 说明: 是否在页面展示一个控制源码定位功能的开关(开关打开时和按住组合键的效果是相同的)

## hotKeys

- 可选项。默认值为 `['altKey', 'shiftKey']`
- 类型：`false` 或 `string[]`。类型为数组时，数组项为 `ctrlKey`、`altKey`、`metaKey`、`shiftKey` 中的一个或多个。
- 说明：触发源码定位功能的组合键，为 `false` 或者空数组则关闭组合键触发。(`ctrlKey` 对应 Mac 中的 `control` 键；`altKey` 对应 Mac 中的 `option` 键；`metaKey` 对应 Mac 中的 `command` 键)

## autoToggle

- 可选项。默认值为 `true`
- 类型：`boolean`
- 说明：`showSwitch` 为 `true` 的情况下，点击触发源码定位功能跳转 IDE 后是否自动关闭开关(主要是为了用户体验)

## needEnvInspector

- 可选项。默认值为 `false`
- 类型：`boolean`
- 说明：为 `true` 时，仅当 `.env.local` 文件存在且其包含 `CODE_INSPECTOR=true` 时插件生效。（主要是解决团队内有部分成员不想使用该插件的需求）

## hideConsole

- 可选项。默认值为 `false`
- 类型：`boolean`
- 说明：默认情况下，插件在项目首次启动时在控制台打印一行按键提示，设置此项为 `true` 可禁用打印
