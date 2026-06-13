# 代码定位

代码定位是 `code-inspector-plugin` 的核心功能：点击页面元素后，自动打开编辑器并定位到对应源码位置。

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/demo.gif)

## 快速开启

通过 `behavior.locate` 控制是否开启，默认值为 `true`（通常可不配置）：

```js
codeInspectorPlugin({
  behavior: {
    locate: true,
  },
}),
```

如果你只想临时关闭定位功能，可以设置为 `false`。

## 触发方式

:::tip 注意
方式 1 和方式 2 需要先确保 Locate Code 功能已开启。按 `插件组合键 + Z` 可查看状态。<img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/locate.png" width="240" />
:::

### 方式 1：组合键 + 鼠标左键

按住组合键（Mac 默认 `Option + Shift`，Windows 默认 `Alt + Shift`），鼠标移动到元素后左键点击，即可触发代码定位。

### 方式 2：功能开关 + 鼠标左键

当 `showSwitch: true` 且开关处于开启状态时，鼠标移动到元素后左键点击，即可触发代码定位。

### 方式 3：组合键 + 数字 `1`

按住组合键并将鼠标移动到目标元素后，按 `1` 可快捷触发代码定位。

此方式不受 Locate Code 开关状态影响，可直接触发。
