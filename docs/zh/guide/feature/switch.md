# 切换功能

按下组合键 + Z（例如：`Option + Shift + Z`）可以弹出功能开关的控制弹窗，可以在运行时快速切换功能。

![switch](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/switch.jpg)

## 默认功能

通过 `behavior.defaultAction` 可以设置默认激活的功能模式：

```js
codeInspectorPlugin({
  behavior: {
    defaultAction: 'locate', // 'locate' | 'copy' | 'target' | 'claudeCode'
  },
}),
```

默认优先级为 `locate > copy > target > claudeCode`，即哪个功能先开启则默认使用哪个。
