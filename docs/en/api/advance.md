# Advanced Configuration

Below are configurations for some non-standard scenarios.

## behavior <Badge type="tip" text="0.7.0+" vertical="middle" />

- Optional
- Type:
  ```ts
  type Behavior = {
    /*
     * Whether to enable clicking to jump to IDE code location (default is true)
     */
    locate?: boolean;
    /*
     * Whether to enable clicking to copy source code location info (default is true)
     * Can also set a string and use {file}, {line}, {column} templates to specify the format
     * Default value true is equivalent to the string format "{file}:{line}:{column}"
     */
    copy?: boolean | string;
  };
  ```
- Description: In some scenarios, if you don't need to locate code when clicking elements and only need to copy the source code location information, you can set `locate: false` and `copy: true`. In this case, clicking elements will only copy the source code location information.

## ip <Badge type="tip" text="0.13.0+" vertical="middle" />

- Optional
- Type: `boolean | string`. Default value `false`
- Description: Whether to send requests to the node server via IP. By default, requests are sent via `localhost`; when set to `true`, it will automatically detect local IP and send requests through IP; when specified as `string` type, it will send requests to the specified value.

## exclude <Badge type="tip" text="0.19.1+" vertical="middle" />

- Optional
- Type: `string | RegExp | (string | RegExp)[]`
- Description: Specify files not to be compiled, default is `/node_modules/`, after configuration, it is the union of `/node_modules/` and `exclude`.

## include <Badge type="tip" text="0.18.0+" vertical="middle" />

- Optional
- Type: `string | RegExp | (string | RegExp)[]`
- Description: By default, `code-inspector-plugin` won't compile files in `node_modules`. In some monorepo projects, your local packages referenced by the main project might be linked through `node_modules`. In this case, you need to declare these packages via `include` to allow their code to participate in location.
- Example: Suppose you have the following directory structure:
  ```shell
  my-project
    - pkg-a
    - pkg-b
    - main-pkg # imports pkg-a and pkg-b via package.json `dependencies`
      - node_modules
        - pkg-a
        - pkg-b
  ```
  If you want the source code in `pkg-a` and `pkg-b` to be locatable, you can configure as follows:
  ```ts
  codeInspectorPlugin({
    bundler: 'vite',
    include: ['pkg-a', 'pkg-b'],
  });
  ```

## mappings <Badge type="tip" text="0.18.1+" vertical="middle" />

- Optional
- Type: `Record<string, string> | Array<{ find: string | RegExp, replacement: string }>`
- Description: Used with `include` to map file paths in `node_modules` to real file paths in your project.
- Example: Suppose you have the following directory structure:
  ```shell
  my-project
    - pkg-a
    - pkg-b
    - main-pkg # imports pkg-a and pkg-b via package.json `dependencies`
      - node_modules
        - pkg-a
        - pkg-b
  ```
  After declaring `pkg-a` and `pkg-b` via `include`, the source code location will point to files in `node_modules` rather than the real file paths in your project. You can use `mappings` to map the paths:
  ```ts
  import path from 'path';

  codeInspectorPlugin({
    bundler: 'vite',
    include: ['pkg-a', 'pkg-b'],
    mappings: {
      'pkg-a': path.resolve(__dirname, '../pkg-a'),
      'pkg-b': path.resolve(__dirname, '../pkg-b'),
    },
  });
  ```

## hooks <Badge type="tip" text="0.10.0+" vertical="middle" />

- Optional
- Type:
  ```ts
  type SourceInfo = {
    file: string;
    line: number;
    column: number;
  };
  type Hooks = {
    /*
     * Hook function after server receives DOM source code location request
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
        sendLog(source);
      },
    },
  });
  ```
- Description: Set callback hooks for certain lifecycles of `code-inspector-plugin`. For example, if you want to track how many times your team uses the code location feature, you can implement it through this configuration.

## match <Badge type="tip" text="0.5.0+" vertical="middle" />

- Optional
- Type: `RegExp`, default value is `/\.(vue|jsx|tsx|js|ts|mjs|mts)$/`
- Description: `code-inspector-plugin` will only compile files that match the `match` regular expression for source code location. You can use this configuration to reduce unnecessary files from compilation and improve compilation performance.

## injectTo <Badge type="tip" text="0.5.0+" vertical="middle" />

- Optional
- Type: `string | string[]` (only supports `string[]` type in version `0.17.5` and above)
- Description: Specifies the file for injecting client-side code related to DOM filtering and clicking to jump to vscode (must be an absolute path ending with `.js/.ts/.mjs/.mts/.jsx/.tsx`). By default, `code-inspector-plugin` will inject client code into the first file matching the `match` regular expression. In some custom SSR framework projects, the first injected file might only run on the server side, causing client-side logic to fail. In this case, you can specify a client file through this configuration to ensure client-side logic works.

## openIn <Badge type="tip" text="0.8.0+" vertical="middle" />

- Optional
- Type: `'reuse' | 'new' | 'auto'`, default value is `'auto'`
- Description: Specifies how to open IDE windows when using vscode or cursor as editor. `reuse` specifies reusing the current window; `new` specifies opening a new window; `auto` automatically chooses based on current IDE installation. It's recommended to configure your preference in IDE settings:

  <img width="978" alt="image" src="https://github.com/user-attachments/assets/b98b819b-363c-4b3b-98bf-8c1606821942">

## pathFormat <Badge type="tip" text="0.8.0+" vertical="middle" />

- Optional
- Type: `string | string[]`, default value is `{file}:{line}:{column}`
- Description: Specifies the command format for opening files in IDE, mainly used with non-built-in IDEs. `{file}`, `{line}`, `{column}` will be dynamically replaced as templates. For example, if your code location is line `5` column `11` of `/root/my-project/index.ts`, and your IDE's command to open files is `yourIDE /root/my-project/index.ts --line 5 --column 11`, you should set this value to `["{file}", "--line", "{line}", "--column", "{column}"]`.

## hideDomPathAttr <Badge type="tip" text="0.12.0+" vertical="middle" />

- Optional
- Type: `boolean`. Default value `false`
- Description: Whether to hide the `data-insp-path` attribute on DOM elements in browser console

## hideConsole

- Optional
- Type: `boolean`, default value is `false`
- Description: Whether to hide the keyboard shortcut hints about `code-inspector-plugin` in browser console

## escapeTags <Badge type="tip" text="0.11.0+" vertical="middle" />

- Optional
- Type: `(string | RegExp)[]`
- Description: For tags matching these conditions, the `data-insp-path` attribute will not be injected during compilation

## importClient <Badge type="tip" text="0.14.1+" vertical="middle" />

- Optional
- Type: `string`
- Description: Method of importing client interaction code: `file` means importing the file containing interaction code; `code` means directly injecting interaction code into the entry file.

## needEnvInspector <Badge type="danger" text="Deprecated" vertical="middle" />

- Optional
- Type: `boolean`, default value is `false`
- Description: When set to `true`, the plugin only works when `.env.local` file exists and contains `CODE_INSPECTOR=true`. (Mainly solves the need for some team members who don't want to use this plugin feature)

## forceInjectCache <Badge type="danger" text="Deprecated" vertical="middle" />

- Optional
- Type: `boolean`, default is `false`
- Description: Forces the cache strategy of the loader for webpack/rspack interaction injection logic; true for full cache; false for no cache; if not set, automatically determines to only not cache entry files while caching other files. (Only works for `webpack/rspack`, after version `0.5.1`, this cache strategy has been optimized and this field is no longer needed).

## port <Badge type="tip" text="0.19.0+" vertical="middle" />

- Optional
- Type: `number`, default value is `5678`
- Description: Specifies the starting port for the server of `code-inspector-plugin` to find.

## printServer <Badge type="tip" text="0.19.0+" vertical="middle" />

- Optional
- Type: `boolean`, default value is `false`
- Description: Whether to print the server startup information in the console.
