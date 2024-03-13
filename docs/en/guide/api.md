# API

The parameters of `codeInspectorPlugin` are as follows:

```typescript
import { codeInspectorPlugin } from 'code-inspector-plugin';

const options = {
  bundler: 'vite',
};

codeInspectorPlugin(options);

interface CodeInspectorOptins {
  bunlder: 'vite' | 'webpack' | 'rspack';
  // For other keys, see the instructions below...
}
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

## behavior <Badge type="tip" text="0.7.0+" vertical="middle" />

- Optional. Specifies the behavior triggered by the plugin functionality.
- The type and description are as follows:
  ```ts
  type Behavior = {
    /*
     * Enables the feature to jump to IDE to locate code by clicking (default is true).
     */
    locate?: boolean;
    /*
     * Enables the feature to copy the source code position information by clicking (default is true).
     * You can also set a string and specify the information format to copy using the {file}, {line}, {column} templates.
     * The default value of true is equivalent to the "{file}:{line}:{column}" string format.
     */
    copy?: boolean | string;
  };
  ```

## editor

- Optional. Default value is `undefined`
- Type: `string | undefined`, options: `atom / code / code_insiders / idea / phpstorm / pycharm / webstorm / hbuilder`
- Description: The plugin will automatically recognize the IDE running on the current system. When this option is set, it will open the specified IDE (for specifying IDE, it is more recommended to use the method in the [Specify IDE](/guide/ide) section).

## injectTo <Badge type="tip" text="0.5.0+" vertical="middle" />

- Optional.
- Type: `string`
- Description: A file used for injecting `client code` related to DOM filtering and click navigation in VSCode. The file must be an absolute path and end with `.js/.ts/.mjs/.mts/.jsx/.tsx`.(typically used for specifying a client-side file in SSR projects).

## dev <Badge type="tip" text="0.5.0+" vertical="middle" />

- Optional
- Type: `boolean | (() => boolean)`
- Description: Customize the determination logic for the development environment. (The plugin internally recognizes the `development` environment to make the plugin effective. If automatic recognition fails, manual specification is required.)

## enforcePre <Badge type="tip" text="0.4.0+" vertical="middle" />

- Optional(Only effective for `webpack/rspack`). Default value is `true`
- Type: `boolean`
- Description: Whether to add `enforce: 'pre'` during the transformation, default value is `true`. (If this plugin causes `eslint-plugin` validation errors or duplicate ESLint validation during hot updates, set this option to `false`)

## match <Badge type="tip" text="0.5.0+" vertical="middle" />

- Optional. Used to improve compilation performance.
- Type: `RegExp`
- Description: Only files that match the `match` regular expression will undergo source code location compilation to reduce the involvement of invalid files in compilation. Default is `/\.(vue|jsx|tsx|js|ts|mjs|mts)$/`.

## pathFormat <Badge type="tip" text="0.8.0+" vertical="middle" />

> It is recommended to define this feature in `.env.local` using `CODE_INSPECTOR_FORMAT_PATH` during team collaboration to avoid affecting others.

- Optional
- Type: `string | string[]`
- Description: Specifies the command format when opening IDE files. The default value is `{file}:{line}:{column}`, where `{file}`, `{line}`, and `{column}` are dynamically replaced templates. For example, if the source code file is `/root/my-project/index.ts` and it is located at line `5`, column `11`, the default command executed by VSCode would be `code -g /root/my-project/index.ts:5:11`. If you want to only locate the corresponding file without specific line and column, and add the `/Users` parameter at the beginning of the file, you should set this value to `"/Users{file}"`. If you want to add additional parameters for VSCode to open in a new window, set this value to `["-n", "/Users{file}"]`.

## openIn <Badge type="tip" text="0.8.0+" vertical="middle" />

- Optional
- Type: `'reuse' | 'new'`
- Description: Specifies the way to open the IDE window. By default, it will automatically reuse the current window. Passing `reuse` will reuse the current window; passing `new` will open a new window.

## needEnvInspector <Badge type="danger" text="deprecated" vertical="middle" />

- Optional. Default value is `false`
- Type: `boolean`
- Description: This configuration can be ignored for most users. When set to true, the plugin functionality will only take effect when the `.env.local` file exists and it contains `CODE_INSPECTOR=true`. (Mainly to address the need of some team members who do not want to use the plugin functionality)

## hideConsole

- Optional. Default value is `false`
- Type: `boolean`
- Description: By default, the code-inspector-plugin will print a line of hotKeys prompts on the console when the project is first launched. Set this to 'true' to disable printing

## forceInjectCache <Badge type="danger" text="deprecated" vertical="middle" />

- Optional (Effective only for `webpack/rspack`). Used to improve compilation performance.
- Type: `boolean`
- Description: Forcefully set the caching strategy for the injection loader of the interaction logic in `webpack/rspack`; when true, fully cache; when false, do not cache; if not set, automatically determine to cache only the entry file and not cache other files. (Setting this to `true` may lead to failure in locating code requests caused by the inability to start the node server. Use with caution.) <b>After upgrading to version 0.5.1, the cache strategy has been optimized, and it is no longer necessary to set this field.</b>

## Hooks <Badge type="tip" text="0.10.0+" vertical="middle" />

- Optional. Default value is `null`.
- Type is as follows:
  ```ts
  type SourceInfo = {
    file: string;
    line: number;
    column: number;
  };
  type Hooks = {
    /*
     * Hook function after the server-side receives a request for locating DOM source code
     */
    afterInspectRequest?: (
      options: CodeInspectorOptions,
      source: SourceInfo
    ) => void;
  };
  // Example
  codeInspectorPlugin({
    bundler: 'vite',
    hooks: {
      afterInspectRequest: (options, source) => {
        console.log(source);
      },
    },
  });
  ```
- Description: Sets callbacks for certain lifecycle hooks of `code-inspector-plugin`.
