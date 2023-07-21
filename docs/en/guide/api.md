# API

## Parameters

`CodeInspectorPlugin` receiving a parameter named `options`:

```typescript
import { CodeInspectorPlugin } from 'code-inspector-plugin';

CodeInspectorPlugin(options);
```

The attributes and descriptions of `options` are shown in the table below:

| Parameter        | Description                                                                                                        | Required | Type                | Optional Values                                                      | Default Value            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ | -------- | ------------------- | -------------------------------------------------------------------- | ------------------------ |
| bundler          | Specify your bundler                                                                                               | required | -                   | `webpack/vite`                                                       |
| showSwitch       | The combination keys that triggers the DOM locating function                                                       | optional | `boolean`           | `true/false`                                                         | `false`                  |
| hotKeys          | The combination keys that triggers the DOM positioning function                                                    | optional | `string[] \| false` | Array<`'ctrlKey'`\|`'altKey'`\|`'metaKey'`\|`'shiftKey'`> \| `false` | `['altKey', 'shiftKey']` |
| autoToggle       | When opening the function switch, whether automatically close the switch when triggering the jump editor function. | optional | `boolean`           | `true/false`                                                         | `true`                   |
| needEnvInspector | When the value is `true`, the plugin only takes effect when `CODE_INSPECTOR=true` is configured in `.local.env`    | optional | `boolean`           | `true/false`                                                         | `false`                  |
