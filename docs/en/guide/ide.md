# IDE

`code-inspector-plugin` scans currently running processes in the system and automatically recognizes the IDE being used, so in most cases, you don't need to manually specify the IDE.

## Specifying IDE

If `code-inspector-plugin` fails to automatically recognize your IDE, or if you're running multiple IDEs and want to specify which one to open, you have two ways to specify the IDE: through the `.env.local` file or by adding the `editor` parameter in `codeInspectorPlugin`.

:::tip

If project team members use different IDEs, using the `editor` parameter might cause conflicts between them, so using `.env.local` file is more recommended

:::

### Specifying via `.env.local` file

Add a file named `.env.local` in the project root directory and add: `CODE_EDITOR=[IDE code name]`. For example, for vscode, its corresponding `IDE code name` is `code`, so add the following to `.env.local`:

```shell
# Specify IDE as vscode
CODE_EDITOR=code
```

### Specifying via `editor` parameter

You can also specify the IDE by adding the `editor` parameter in `codeInspectorPlugin`:

```ts
codeInspectorPlugin({
    bundler: 'vite',
    editor: 'code', // Specify IDE as vscode
})
```

## Supported IDE List

The following link shows the IDEs that support automatic detection, their corresponding IDE code names, and supported systems: [launch-ide](https://github.com/zh-lx/launch-ide)

## Other IDEs

If your IDE is not in the above list of automatically supported IDEs, detection may fail. You'll need to add a file named `.env.local` in the project root directory and add: `CODE_EDITOR=[IDE executable path]`. Here's how to find the IDE executable path.

### MAC System

Taking VSCodium as an example (steps are the same for other IDEs), to get the IDE executable path on MAC system:

1. Open the IDE program VSCodium
2. Open MAC's Activity Monitor, find VSCodium in the processes and double-click:

   ![Active_Monitor](https://github.com/zh-lx/code-inspector/assets/73059627/17d65dc1-82ff-439f-aeba-8e3056cd2a1b)
3. After double-clicking, in the "Open Files and Ports" tab of the window, find the path corresponding to the first txt, which is the IDE executable path:

   ![Open_Files](https://github.com/zh-lx/code-inspector/assets/73059627/f27a61f4-1c57-4687-83c7-6078533d62b4)
4. Copy the IDE executable path to the `.env.local` file:

```perl
# .env.local
CODE_EDITOR=/Applications/VSCodium.app/Contents/MacOS/Electron
```

### Windows System

Taking Webstorm as an example (steps are the same for other IDEs), to get the IDE executable path on Windows system:

1. Find the IDE shortcut (create one if it doesn't exist), right-click the shortcut, select "Properties":

   <img src="https://github.com/zh-lx/code-inspector/assets/73059627/6db6899f-fec5-474a-bffb-de8a394df777" style="max-width: 400px" />
2. After opening, in the "Shortcut" tab find "Target", remove the quotation marks from the "Target" to get the IDE executable path:

   <img src="https://github.com/zh-lx/code-inspector/assets/73059627/f5067697-a246-4566-a530-ca83f9803bf5" style="max-width: 400px" />
3. Copy the IDE executable path to the `.env.local` file:

```perl
# .env.local
CODE_EDITOR=D:\webstorm\WebStorm 2023.1.3\bin\webstorm64.exe
```