# Code Location

Code location is the core feature of `code-inspector-plugin`. When you click on a page element, it automatically opens your code editor and moves the cursor to the corresponding code position.

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/demo.gif)

## Configuration

Set `behavior.locate` to enable or disable this feature. Default is `true`, no manual configuration needed:

```js
codeInspectorPlugin({
  behavior: {
    locate: true,
  },
}),
```

## Usage

:::tip Note
Methods 1 and 2 require the Locate Code feature to be enabled. Press `hotKeys + Z` to check if it is enabled. <img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/locate.png" width="240" />
:::

### Method 1: HotKeys + Left Click

Hold the combination key on the page (default is `Option + Shift` on Mac; `Alt + Shift` on Windows), move the mouse over the page and a mask layer will appear on DOM elements with related information. Left click to trigger the code location feature.

### Method 2: Switch + Left Click

When `showSwitch: true` is configured and the switch is in the on state (colored) <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block; transform: translateY(5px);" />, move the mouse over the page and a mask layer will appear on DOM elements. Left click to trigger the code location feature.

### Method 3: HotKeys + Key 1

Hold the combination key on the page (default is `Option + Shift` on Mac; `Alt + Shift` on Windows), move the mouse over the page and a mask layer will appear on DOM elements. Press the `1` key to quickly trigger the code location feature. <b>This method works regardless of whether the Locate Code feature is enabled.</b>
