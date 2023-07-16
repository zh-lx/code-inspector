# API

## 配置项

`CodeInspectorPlugin` 的类型定义如下：

```typescript
type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';

interface CodeInspectorPluginOptions {
  bundler: 'vite' | 'webpack';
  hotKeys?: HotKey[] | false;
  showSwitch?: boolean;
  autoToggle?: boolean;
}

function CodeInspectorPlugin(options: CodeInspectorPluginOptions) {
  // ...
}
```

`options` 的属性及说明如下表：

| 参数       | 描述                                                       | 是否必传        | 类型                | 可选值                                                               | 默认值                   |
| ---------- | ---------------------------------------------------------- | --------------- | ------------------- | -------------------------------------------------------------------- | ------------------------ |
| bundler    | 指定的打包工具                                             | 是　　　.　　　 | `string`            | `vite/webpack`                                                       | -                        |
| showSwitch | 是否在页面展示功能开关按钮                                 | 否              | `boolean`           | `true/false`                                                         | `false`                  |
| hotKeys    | 触发功能的组合键，为 `false` 或者空数组则关闭组合键触发    | 否              | `string[] \| false` | Array<`'ctrlKey'`\|`'altKey'`\|`'metaKey'`\|`'shiftKey'`> \| `false` | `['altKey', 'shiftKey']` |
| autoToggle | 打开功能开关的情况下，点击触发跳转编辑器时是否自动关闭开关 | 否              | `boolean`           | `true/false`                                                         | `true`                   |
