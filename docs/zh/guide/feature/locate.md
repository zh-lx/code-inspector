# 代码定位

代码定位是 `code-inspector-plugin` 的核心功能，点击页面元素时可以自动打开代码编辑器并将光标定位到元素对应的代码位置。

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/demo.gif)

## 配置

通过 `behavior.locate` 设置是否开启，默认值为 `true`，可不需要手动配置此项：

```js
codeInspectorPlugin({
  behavior: {
    locate: true,
  },
}),
```

## 使用方式

:::tip 注意事项
方式 1 和 方式 2 需要确保 Locate Code 功能是开启状态，按 `插件组合键 + Z` 可以查看功能是否开启。<img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/locate.png" width="240" /> 
:::

### 方式1: 组合键 + 单击鼠标左键

在页面上按住组合键 (Mac 系统默认为 `Option + Shift`；Window 的默认为是 `Alt + Shift`) 时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，此时单击鼠标左键会触发代码定位功能。

### 方式2: 功能开关 + 单击鼠标左键

当插件参数中配置了 `showSwitch: true` 且开关的颜色为打开状态(彩色) <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block; transform: translateY(5px);" /> 时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，此时单击鼠标左键会触发代码定位功能。

### 方式3: 组合键 + 1键

在页面上按住组合键 (Mac 系统默认为 `Option + Shift`；Window 的默认为是 `Alt + Shift`) 时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，此时再按 `数字1` 键，就可以快捷触发代码定位功能。<b>此方式无论 Locate Code 功能是否开启，都可以快速触发代码定位功能。</b>