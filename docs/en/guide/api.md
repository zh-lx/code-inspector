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
- Type: `string`, options: `vite` / `webpack` / `rspack`
- Description: specify your bundler

## hotKeys

- Optional. Default value is `['altKey', 'shiftKey']`
- Type: `false` or `string[]`. When the type is `string[]`, the optional values for array items are: `ctrlKey`、`altKey`、`metaKey`、`shiftKey`.
- Description: The combination of keys that trigger the functionality. Set to `false` or `[]` to disable the combination key triggering. (`ctrlKey` corresponds to the `control` key on Mac; `altKey` corresponds to the `option` key on Mac; `metaKey` corresponds to the `command` key on Mac)

## showSwitch

- Optional. Default value is `false`
- Type: `boolean`
- Description: Whether to display a switch on the page to control the source code positioning feature. When the switch is on, the effect is the same as holding down the combination keys. (it is more recommended to use the combination key triggering feature).

## autoToggle

- Optional. Default value is `true`
- Type: `boolean`
- Description: When configured with `showSwitch: true, autoToggle: true`, after triggering the functionality and switching to the IDE, the switch functionality will be automatically turned off to prevent the user from accidentally triggering the functionality by clicking after switching back to the page.

## needEnvInspector

- Optional. Default value is `false`
- Type: `boolean`
- Description: This configuration can be ignored for most users. When set to true, the plugin functionality will only take effect when the `.env.local` file exists and it contains `CODE_INSPECTOR=true`. (Mainly to address the need of some team members who do not want to use the plugin functionality)

## hideConsole

- Optional. Default value is `false`
- Type: `boolean`
- Description: By default, the code-inspector-plugin will print a line of hotKeys prompts on the console when the project is first launched. Set this to 'true' to disable printing

## editor

- Optional. Default value is `undefined`
- Type: `string | undefined`, options: `atom / code / code_insiders / idea / phpstorm / pycharm / webstorm / hbuilder`
- Description: The plugin will automatically recognize the IDE running on the current system. When this option is set, it will open the specified IDE (for specifying IDE, it is more recommended to use the method in the [Specify IDE](/guide/ide) section).

## enforcePre <Badge type="tip" text="0.4.0+" vertical="middle" />

- Optional(Only effective for `webpack/rspack`). Default value is `true`
- Type: `boolean`
- Description: Whether to add `enforce: 'pre'` during the transformation, default value is `true`. (If this plugin causes `eslint-plugin` validation errors or duplicate ESLint validation during hot updates, set this option to `false`)

## injectTo <Badge type="tip" text="0.5.0+" vertical="middle" />

- Optional. Default value is `auto`
- Type`'auto' | 'all' | string`
- Description: A file used for injecting `client code` related to DOM filtering and click navigation in VSCode. The file must be an absolute path and end with `.js/.ts/.mjs/.mts/.jsx/.tsx`. When set to `auto`, the `client code` will be injected into the first file that meets the aforementioned conditions. When set to `all`, the `client code` will be injected into every file that meets the aforementioned conditions. Alternatively, you can specify an absolute path to a file for injecting the `client code` (typically used for specifying a client-side file in SSR projects).

## dev <Badge type="tip" text="0.5.0+" vertical="middle" />

- Optional
- Type: `boolean | (() => boolean)`
- Description: Customize the determination logic for the development environment. (The plugin internally recognizes the `development` environment to make the plugin effective. If automatic recognition fails, manual specification is required.)

## forceInjectCache <Badge type="tip" text="0.5.0+" vertical="middle" />

- Optional (Effective only for `webpack/rspack`). Used to improve compilation performance.
- Type: `boolean`
- Description: Forcefully set the caching strategy for the injection loader of the interaction logic in `webpack/rspack`; when true, fully cache; when false, do not cache; if not set, automatically determine to cache only the entry file and not cache other files. (Setting this to `true` may lead to failure in locating code requests caused by the inability to start the node server. Use with caution.)

## match <Badge type="tip" text="0.5.0+" vertical="middle" />

- Optional. Used to improve compilation performance.
- Type: `RegExp`
- Description: Only files that match the `match` regular expression will undergo source code location compilation to reduce the involvement of invalid files in compilation. Default is `/\.(vue|jsx|tsx|js|ts|mjs|mts)$/`.
