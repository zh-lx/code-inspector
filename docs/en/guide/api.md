# API

## Parameters

The parameters of `CodeInspectorPlugin` are as follows:

```typescript
import { CodeInspectorPlugin } from 'code-inspector-plugin';

CodeInspectorPlugin({
  bundler: 'vite',
  showSwitch: false,
  hotKeys: ['altKey', 'shiftKey'],
  autoToggle: true,
  needEnvInspector: false,
  hideConsole: false,
});
```

## bundler

- Required
- Type: `string`, the optional value includes `vite` / `webpack`
- Description: specify your bundler

## showSwitch

- Optional. Default value is `false`
- Type: `boolean`
- Description: Whether display a switch on the page that controls the source code positioning function (the effect is the same as holding down the combination key when the switch is turned on)

## hotKeys

- Optional. Default value is `['altKey', 'shiftKey']`
- Type: `false` or `string[]`. When the type is `string[]`, the item of the array belongs to one or more of `ctrlKey`、`altKey`、`metaKey`、`shiftKey`.
- Description: The combination keys that triggers the source code positioning function. When the value is `false` or `[]`，the function will be closed.(`ctrlKey` corresponds to `control` in Mac；`altKey` corresponds to `option` in Mac；`metaKey` corresponds to `command` in Mac,)

## autoToggle

- Optional. Default value is `true`
- Type: `boolean`
- Description: When `showSwitch` is `true`, whether to automatically turn off the switch after triggering the source code positioning function and jump to the IDE.(mainly for user experience)

## needEnvInspector

- Optional. Default value is `false`
- Type: `boolean`
- Description: When the value is `true`, the plugin only takes effect when `CODE_INSPECTOR=true` is configured in `.local.env`

## hideConsole

- Optional. Default value is `false`
- Type: `boolean`
- Description: By default, the code-inspector-plugin will print a line of hotKeys prompts on the console when the project is first launched. Set this to 'true' to disable printing
