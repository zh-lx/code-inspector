# 自定义跳转链接

Target 功能可以在触发时按模板拼接链接并打开新页面，常用于跳转 GitHub/GitLab 等代码托管平台。

## 快速开启

通过 `behavior.target` 设置链接模板：

```js
codeInspectorPlugin({
  behavior: {
    target: 'https://github.com/user/repo/blob/main/{file}#L{line}',
  },
}),
```

可用占位符：
- `{file}`：文件路径
- `{line}`：行号
- `{column}`：列号

## 触发方式

:::tip 注意
方式 1 和方式 2 需要先确保 Open Target 功能已开启。按 `插件组合键 + Z` 可查看状态。<img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/target.png" width="240" />
:::

### 方式 1：组合键 + 鼠标左键

按住组合键（Mac 默认 `Option + Shift`，Windows 默认 `Alt + Shift`），鼠标移动到元素后左键点击，即可打开自定义链接。

### 方式 2：功能开关 + 鼠标左键

当 `showSwitch: true` 且开关处于开启状态时，鼠标移动到元素后左键点击，即可打开自定义链接。

### 方式 3：组合键 + 数字 `3`

按住组合键并将鼠标移动到目标元素后，按 `3` 可快捷打开自定义链接。

此方式不受 Open Target 开关状态影响，可直接触发。
