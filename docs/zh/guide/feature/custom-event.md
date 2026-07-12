# 自定义事件

`code-inspector-plugin` 在触发功能时会派发自定义事件 `code-inspector:trackCode`，你可以监听这个事件做埋点、日志或二次联动。

## 事件结构

事件类型：`CustomEvent`  
事件名：`code-inspector:trackCode`

`event.detail` 结构：
- `action`：当前触发的功能，通常是 `locate | copy | target | ai`
- `element`：当前元素的源码信息（如 `name`、`path`、`line`、`column`）

## 使用示例

```js
window.addEventListener('code-inspector:trackCode', (event) => {
  const { action, element } = event.detail || {};
  if (!element) return;

  const { name, path, line, column } = element;
  console.log(`[code-inspector] action: ${action}`);
  console.log(`[code-inspector] element: ${name} ${path}:${line}:${column}`);

  sendLog('trackCode', {
    action,
    name,
    path,
    line,
    column,
  });
});
```
