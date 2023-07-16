# Specify IDE

By default, `code-inspector-plugin` will scan the currently running applications in the system and automatically open a running IDE program (automatic recognition only applies to IDEs that support automatic recognition in the table below), so in most cases you do not need to manually specify an IDE.

If you want to specify an IDE, you need to add a file named `.env.local` to the project root directory and add: `CODE_EDITOR=[IDE Encoding Name]`.

Taking vscode as an example, its corresponding `IDE Encoding Name` is `code`, so the following content should be added in `.env.local`:

```perl
# specify IDE is vscode
CODE_EDITOR=code
```

## Automatic Recognition IDE

The IDE that supports automatic recognition and the corresponding IDE Encoding Name are shown in the table below:

<table>
    <tr>
        <th>IDE</th>
        <th>IDE Encoding Name</th>
    </tr>
    <tr>
        <td>Visual Studio Code（vscode）</td>
        <td>code</td>
    </tr>
    <tr>
        <td>Visual Studio Code - Insiders（vscode 内部版）</td>
        <td>code_insiders</td>
    </tr>
    <tr>
        <td>WebStorm</td>
        <td>webstorm</td>
    </tr>
    <tr>
        <td>Atom</td>
        <td>atom</td>
    </tr>
    <tr>
        <td>HBuilderX</td>
        <td>hbuilder</td>
    </tr>
    <tr>
        <td>PhpStorm</td>
        <td>phpstorm</td>
    </tr>
    <tr>
        <td>Pycharm</td>
        <td>pycharm</td>
    </tr>
    <tr>
        <td>IntelliJ IDEA</td>
        <td>idea</td>
    </tr>
</table>

## Non Automatic Recognition IDE

If the IDE you are using is no longer in the list that supports automatic recognition mentioned above, or if it is an unofficial IDE in the list mentioned above, you need to add a file named `.env.local` to the project root directory and add: `CODE_EDITOR=[IDE Execution Path]`, the IDE Execution Path reference is as follows.

### MAC

Taking VSCodium as an example (the other IDE steps are the same), to obtain the IDE Execution Path in the MAC system, the steps are as follows:

1. Open the IDE program VSCodium
2. Open the MAC's own Activity Monitor, find VSCodium in the process, and double-click:
   ![Active_Monitor](https://github.com/zh-lx/code-inspector/assets/73059627/17d65dc1-82ff-439f-aeba-8e3056cd2a1b)
3. After double clicking, in the "Open File and Port" tab of the window, find the corresponding path under the first txt, which is the IDE Execution Path:
   ![Open_Files](https://github.com/zh-lx/code-inspector/assets/73059627/f27a61f4-1c57-4687-83c7-6078533d62b4)
4. Copy the IDE Execution Path to the `.env.local` file to:

```perl
# .env.local
CODE_EDITOR=/Applications/VSCodium.app/Contents/MacOS/Electron
```

### Windows

Taking Webstorm as an example (other IDE steps are the same), to obtain the IDE Execution Path in the Windows system, the steps are as follows:

1. Find the shortcut to the IDE (if not available, create one), right-click on the shortcut, and select 【属性】:
   <img src="https://github.com/zh-lx/code-inspector/assets/73059627/6db6899f-fec5-474a-bffb-de8a394df777" style="max-width: 400px" />
2. After opening, find the 【目标】 in the 【快捷】 tab and remove the double quotes in the 【目标】 to obtain the IDE Execution Path：
   <img src="https://github.com/zh-lx/code-inspector/assets/73059627/f5067697-a246-4566-a530-ca83f9803bf5" style="max-width: 400px" />
3. Copy the IDE Execution Path to the `.env.local` file to:

```perl
# .env.local
CODE_EDITOR=D:\webstorm\WebStorm 2023.1.3\bin\webstorm64.exe
```
