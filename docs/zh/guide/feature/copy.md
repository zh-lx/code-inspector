# 复制元素路径

复制路径功能可以在点击元素时将源代码位置信息复制到剪贴板，对于 vibe coding 的开发者来说非常有用。

## 配置

通过 `behavior.copy` 设置是否开启，默认值为 `false`：

```js
codeInspectorPlugin({
  behavior: {
    copy: true,
  },
}),
```

开启后，点击元素会将 `{file}:{line}:{column}` 格式的源码位置信息复制到剪贴板。


## 使用方式

:::tip 注意事项
方式 1 和 方式 2 需要确保 Copy Path 功能是开启状态，按 `插件组合键 + Z` 可以查看功能是否开启。<img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/copy.png" width="240" /> 
:::

### 方式1: 组合键 + 单击鼠标左键

在页面上按住组合键 (Mac 系统默认为 `Option + Shift`；Window 的默认为是 `Alt + Shift`) 时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，此时单击鼠标左键会复制元素路径信息。

### 方式2: 功能开关 + 单击鼠标左键

当插件参数中配置了 `showSwitch: true` 且开关的颜色为打开状态(彩色) <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block; transform: translateY(5px);" /> 时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，此时单击鼠标左键会复制元素路径信息。

### 方式3: 组合键 + 2键

在页面上按住组合键 (Mac 系统默认为 `Option + Shift`；Window 的默认为是 `Alt + Shift`) 时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，此时再按 `数字2` 键，就可以快捷复制元素路径信息。<b>此方式无论 Copy Path 功能是否开启，都可以快速触发复制元素路径功能。</b>

## 自定义复制格式

`behavior.copy` 也可以设置为字符串来指定要复制的元素路径，以 claude code 中的所需要的代码路径格式为例，你可以设置为 `@{file}#{line}`：

```js
codeInspectorPlugin({
  behavior: {
    copy: '@{file}#{line}',
  },
}),
```
