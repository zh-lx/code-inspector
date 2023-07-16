# API

## Configuration Item

The type definition of `CodeInspectorPlugin` is as follows:

```typescript
type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';

interface CodeInspectorPluginOptions {
  bundler: 'vite' | 'webpack';
  hotKeys?: HotKey[] | false;
  showSwitch?: boolean;
  autoToggle?: boolean;
}

function CodeInspectorPlugin(options: CodeInspectorPluginOptions) {
  // ...
}
```

The attributes and descriptions of `options` are shown in the table below:

| Parameter  | Description                                                                                                               | Required | Type                | OptionValue                                                          | Default                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------- | -------------------------------------------------------------------- | ------------------------ |
| bundler    | Specify your bundler                                                                                                      | required | -                   | `webpack/vite`                                                       |
| showSwitch | Whether show the switch button of this function                                                                           | optional | `boolean`           | `true/false`                                                         | `false`                  |
| hotKeys    | Combination keys for triggering this function.When the value is `false` or `[]`, the function can't be triggered by keys. | optional | `string[] \| false` | Array<`'ctrlKey'`\|`'altKey'`\|`'metaKey'`\|`'shiftKey'`> \| `false` | `['altKey', 'shiftKey']` |
| autoToggle | After opening the function switch, whether automatically close the switch when triggering the jump editor function.       | optional | `boolean`           | `true/false`                                                         | `true`                   |
