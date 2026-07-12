# 复制元素路径

复制路径功能会在触发时将元素对应的源码位置信息复制到剪贴板，便于快速粘贴到 IDE、聊天窗口或提交记录中。

## 快速开启

通过 `behavior.copy` 开启，默认值为 `false`：

```js
codeInspectorPlugin({
  behavior: {
    copy: true,
  },
}),
```

默认复制格式为 `{file}:{line}:{column}`。

## 触发方式

:::tip 注意
方式 1 和方式 2 需要先确保 Copy Path 功能已开启。按 `插件组合键 + Z` 可查看状态。<img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/copy.png" width="240" />
:::

### 方式 1：组合键 + 鼠标左键

按住组合键（Mac 默认 `Option + Shift`，Windows 默认 `Alt + Shift`），鼠标移动到元素后左键点击，即可复制路径。

### 方式 2：功能开关 + 鼠标左键

当 `showSwitch: true` 且开关处于开启状态时，鼠标移动到元素后左键点击，即可复制路径。

### 方式 3：组合键 + 数字 `2`

按住组合键并将鼠标移动到目标元素后，按 `2` 可快捷复制路径。

此方式不受 Copy Path 开关状态影响，可直接触发。

## 自定义复制格式

`behavior.copy` 也可以直接传字符串模板。

可用占位符：
- `{file}`：文件路径
- `{line}`：行号
- `{column}`：列号

例如配置为 Claude Code 常用格式 `@{file}#{line}`：

```js
codeInspectorPlugin({
  behavior: {
    copy: '@{file}#{line}',
  },
}),
```
