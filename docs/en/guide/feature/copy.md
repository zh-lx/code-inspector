# Copy Element Path

Copy Path copies an element's source location to your clipboard, which is useful for IDE jumps, chats, and issue reports.

## Quick Start

Enable with `behavior.copy`. Default is `false`:

```js
codeInspectorPlugin({
  behavior: {
    copy: true,
  },
}),
```

Default copied format is `{file}:{line}:{column}`.

## Trigger Methods

:::tip Note
Methods 1 and 2 require the Copy Path feature to be enabled. Press `hotKeys + Z` to check the current state. <img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/copy.png" width="240" />
:::

### Method 1: HotKeys + Left Click

Hold the combination key (`Option + Shift` on Mac, `Alt + Shift` on Windows), move to an element, and left click to copy the path.

### Method 2: Switch + Left Click

When `showSwitch: true` and the switch is on, move to an element and left click to copy the path.

### Method 3: HotKeys + Key `2`

Hold the combination key, move to the target element, then press `2` to copy quickly.

This method works even when Copy Path is turned off.

## Custom Copy Format

`behavior.copy` can also be a string template.

Available placeholders:
- `{file}`: file path
- `{line}`: line number
- `{column}`: column number

Example for a Claude Code-style path: `@{file}#{line}`

```js
codeInspectorPlugin({
  behavior: {
    copy: '@{file}#{line}',
  },
}),
```
