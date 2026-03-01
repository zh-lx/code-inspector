# Custom Event

`code-inspector-plugin` triggers a custom event named `code-inspector:trackCode` whenever any feature is triggered. You can listen to this event to implement custom behavior.

For example, to report a log when a feature is triggered:

```js
window.addEventListener('code-inspector:trackCode', (event) => {
  const { action, element = { name, line, column, path } } = event.detail;
  console.log(`Triggered action: ${action}`);
  console.log(`Element info: name-${name} line-${line} column-${column} file-${path}`)
  sendLog('trackCode');
});
```
