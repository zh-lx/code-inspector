# 功能开关

按下 `组合键 + Z`（例如 `Option + Shift + Z`）可打开功能控制面板，在运行时快速切换 `locate / copy / target / ai`。

![switch](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/switch.jpg)

## 默认功能

通过 `behavior.defaultAction` 指定默认激活功能：

```js
codeInspectorPlugin({
  behavior: {
    defaultAction: ['locate', 'copy'], // 也可以传单个值
  },
}),
```

传入数组时会同时启用数组中可用的功能。未设置 `defaultAction`，或传入单个值时，会按 `locate > copy > target > ai` 的优先级启用第一个可用功能。

当 `behavior` 中有多个可用能力，功能面板支持同时勾选多个功能；只有一个可用能力时，功能面板保持单选。

## 自定义面板快捷键

功能面板快捷键中的字母键默认为 `Z`，可通过 `modeKey` 自定义：

```js
codeInspectorPlugin({
  modeKey: 'x',
})
```

此时打开面板的按键为 `组合键 + X`。
