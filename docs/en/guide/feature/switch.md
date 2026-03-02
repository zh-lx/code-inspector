# Feature Switch

Press `hotKeys + Z` (for example, `Option + Shift + Z`) to open the runtime switch panel and toggle `locate / copy / target / ai` quickly.

![switch](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/switch.jpg)

## Default Feature

Set default active feature via `behavior.defaultAction`:

```js
codeInspectorPlugin({
  behavior: {
    defaultAction: 'locate', // 'locate' | 'copy' | 'target' | 'ai'
  },
}),
```

Default priority is `locate > copy > target > ai`.
If `defaultAction` is not set, the first available feature in this order is activated.

## Customize Panel Shortcut Key

The panel key defaults to `Z`, and can be customized via `modeKey`:

```js
codeInspectorPlugin({
  modeKey: 'x',
})
```

Then use `hotKeys + X` to open the panel.
