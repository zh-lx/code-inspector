# Copy Element Path

The copy path feature copies the source code location to your clipboard when you click an element. This is especially useful for vibe coding developers.

## Configuration

Set `behavior.copy` to enable this feature. Default is `false`:

```js
codeInspectorPlugin({
  behavior: {
    copy: true,
  },
}),
```

When enabled, clicking an element copies the source code location in `{file}:{line}:{column}` format to your clipboard.


## Usage

:::tip Note
Methods 1 and 2 require the Copy Path feature to be enabled. Press `hotKeys + Z` to check if it is enabled. <img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/copy.png" width="240" />
:::

### Method 1: HotKeys + Left Click

Hold the combination key on the page (default is `Option + Shift` on Mac; `Alt + Shift` on Windows), move the mouse over the page and a mask layer will appear on DOM elements. Left click to copy the element path info.

### Method 2: Switch + Left Click

When `showSwitch: true` is configured and the switch is in the on state (colored) <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block; transform: translateY(5px);" />, move the mouse over the page and a mask layer will appear on DOM elements. Left click to copy the element path info.

### Method 3: HotKeys + Key 2

Hold the combination key on the page (default is `Option + Shift` on Mac; `Alt + Shift` on Windows), move the mouse over the page and a mask layer will appear on DOM elements. Press the `2` key to quickly copy the element path info. <b>This method works regardless of whether the Copy Path feature is enabled.</b>

## Custom Copy Format

`behavior.copy` can also be set to a string to specify a custom format. For example, to use the path format required by Claude Code, you can set it to `@{file}#{line}`:

```js
codeInspectorPlugin({
  behavior: {
    copy: '@{file}#{line}',
  },
}),
```
