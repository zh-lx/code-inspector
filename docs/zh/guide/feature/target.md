# 自定义跳转链接

自定义 Target 功能可以在点击元素时跳转到指定的链接，如 GitHub、GitLab 的仓库代码地址等。

## 配置

通过 `behavior.target` 设置跳转链接模板：

```js
codeInspectorPlugin({
  behavior: {
    target: 'https://github.com/user/repo/blob/main/{file}#L{line}',
  },
}),
```

链接中可以通过 `{file}`、`{line}`、`{column}` 模板代替源码位置信息，点击元素前会将模板替换为对应的值。

## 快捷键


:::tip 注意事项
方式 1 和 方式 2 需要确保 Open Target 功能是开启状态，按 `插件组合键 + Z` 可以查看功能是否开启。<img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/target.png" width="240" /> 
:::

### 方式1: 组合键 + 单击鼠标左键

在页面上按住组合键 (Mac 系统默认为 `Option + Shift`；Window 的默认为是 `Alt + Shift`) 时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，此时单击鼠标左键会跳转至自定义链接。

### 方式2: 功能开关 + 单击鼠标左键

当插件参数中配置了 `showSwitch: true` 且开关的颜色为打开状态(彩色) <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block; transform: translateY(5px);" /> 时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，此时单击鼠标左键会跳转至自定义链接。

### 方式3: 组合键 + 3键

在页面上按住组合键 (Mac 系统默认为 `Option + Shift`；Window 的默认为是 `Alt + Shift`) 时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，此时再按 `数字3` 键，就可以快捷跳转至自定义链接。<b>此方式无论 Open Target 功能是否开启，都可以快速触发自定义跳转链接功能。</b>
