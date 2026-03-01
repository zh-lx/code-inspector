# Switch Features

Press the combination key + Z (e.g., `Option + Shift + Z`) to open the feature switch control panel, allowing you to quickly switch features at runtime.

![switch](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/switch.jpg)

## Default Feature

Set the default active feature mode via `behavior.defaultAction`:

```js
codeInspectorPlugin({
  behavior: {
    defaultAction: 'locate', // 'locate' | 'copy' | 'target' | 'claudeCode'
  },
}),
```

The default priority is `locate > copy > target > claudeCode` — whichever feature is enabled first becomes the default.
