# 自定义事件

`code-inspector-plugin` 在触发任一功能的同时，也会触发一个名为 `code-inspector:trackCode` 的自定义事件，因此你可以通过在代码中自定义 `code-inspector:trackCode` 事件的回调函数去控制对应的表现。

例如我想在触发功能时上报一个日志：

```js
window.addEventListener('code-inspector:trackCode', (event) => {
  const { action, element = { name, line, column, path } } = event.detail;
  console.log(`触发的行为是: ${action}`);
  console.log(`触发的元素信息: 名称-${name} 所在行-${line} 所在行-${column} 所在文件-${path}`)
  sendLog('trackCode');
});
```