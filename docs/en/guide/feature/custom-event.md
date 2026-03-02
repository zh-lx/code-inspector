# Custom Event

`code-inspector-plugin` dispatches a custom event `code-inspector:trackCode` whenever a feature is triggered. You can use it for analytics, logs, or custom integrations.

## Event Shape

Event type: `CustomEvent`  
Event name: `code-inspector:trackCode`

`event.detail` includes:
- `action`: triggered feature, usually `locate | copy | target | ai`
- `element`: source info of the current element (such as `name`, `path`, `line`, `column`)

## Example

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
