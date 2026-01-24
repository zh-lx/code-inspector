# 功能大全

本篇介绍 `code-inspector-plugin` 提供了所有功能。

## 功能设置

可以通过 [behavior](../api/advance.html#behavior) 参数来设置功能开关，默认参数如下：

```js
codeInspectorPlugin({
  behavior: {
    locate: true,
    copy: false,
    target: '',
  },
}),
```

### 代码定位

`behavior.locate` 用于设置代码定位功能是否开启，默认值为 `true`。点击时可以自动打开代码编辑器并将光标定位到元素对应的代码位置。

### 复制路径

`behavior.copy` 用于设置是否复制路径到剪贴板，默认值为 `false`。对于 vibe coding 的开发者来说这个功能非常有用，可以直接将复制元素信息的 `{file}:{line}:{column}` 复制到剪贴板。

### 自定义 target

`behavior.target` 用于设置点击元素跳转的连接，可以通过此参数在点击元素时跳转到指定的连接，如 github、gitlab 的仓库代码地址等。

### 完全自定义行为

`code-inspector-plugin` 在点击元素遮罩层时内部会触发如下事件，因此你可以通过在代码中自定义 `code-inspector:trackCode` 事件去控制对应的表现。

```js
window.addEventListener('code-inspector:trackCode', () => {
  sendLog('trackCode');
});
```

## 切换功能

按下组合键 + Z（例如：`Option + Shift + Z`）可以弹出功能开关的控制弹窗，可以在运行时快速切换功能。

![switch](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/switch.jpg)

## 快速选择元素

目前选择元素的方式有两种:

### 方式一(推荐)

在页面上按住组合键时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，点击一下将自动打开 IDE 并将光标定位到元素对应的代码位置。 (Mac 系统默认组合键是 `Option + Shift`；Window 的默认组合键是 `Alt + Shift`，在浏览器控制台会输出相关组合键提示)
![image](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/console-success.png)

### 方式二(移动端推荐)

当插件参数中配置了 `showSwitch: true` 时，会在页面显示一个`代码审查开关按钮`，点击可切换`代码审查模式`开启/关闭，`代码审查模式`开启后使用方式同方式一中按住组合键。当开关的颜色为彩色时，表示`代码审查模式`开启 <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block;" />；当开关颜色为黑白时，表示`代码审查模式`关闭 <img src="https://user-images.githubusercontent.com/73059627/230129864-e2813188-8d49-4a8e-a6bc-dda19c79b491.png" width="20" style="display: inline-block;" />。

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/demo.gif)

## 滚轮切换父子元素

按住组合键时，通过滚轮可以切换父子元素：
- 向上滚动：切换至父元素
- 向下滚动：切换至子元素

![wheel](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/wheel.gif)

## DOM 树选择元素

按住组合键时，右键点击元素，会打开 DOM 树选择元素，选择后会自动打开代码编辑器并将光标定位到选中的元素对应的代码位置。

![dom-tree](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/dom-tree.gif)