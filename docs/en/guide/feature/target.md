# Custom Target Link

The custom target feature allows you to navigate to a specified URL when clicking an element, such as a repository code address on GitHub or GitLab.

## Configuration

Set `behavior.target` to define the URL template:

```js
codeInspectorPlugin({
  behavior: {
    target: 'https://github.com/user/repo/blob/main/{file}#L{line}',
  },
}),
```

Use `{file}`, `{line}`, and `{column}` templates in the URL. They will be replaced with the actual source code location values when clicked.

## Usage


:::tip Note
Methods 1 and 2 require the Open Target feature to be enabled. Press `hotKeys + Z` to check if it is enabled. <img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/target.png" width="240" />
:::

### Method 1: HotKeys + Left Click

Hold the combination key on the page (default is `Option + Shift` on Mac; `Alt + Shift` on Windows), move the mouse over the page and a mask layer will appear on DOM elements. Left click to navigate to the custom link.

### Method 2: Switch + Left Click

When `showSwitch: true` is configured and the switch is in the on state (colored) <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block; transform: translateY(5px);" />, move the mouse over the page and a mask layer will appear on DOM elements. Left click to navigate to the custom link.

### Method 3: HotKeys + Key 3

Hold the combination key on the page (default is `Option + Shift` on Mac; `Alt + Shift` on Windows), move the mouse over the page and a mask layer will appear on DOM elements. Press the `3` key to quickly navigate to the custom link. <b>This method works regardless of whether the Open Target feature is enabled.</b>
