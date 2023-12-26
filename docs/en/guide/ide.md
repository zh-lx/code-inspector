# Specify IDE

By default, `code-inspector-plugin` scans the applications currently running on the system and automatically opens a running IDE program (automatic recognition is limited to the IDEs supported in the table below), so in most cases, you do not need to manually specify the IDE.

If you want to specify the IDE, you need to add a file named `.env.local` in the project root and add: `CODE_EDITOR=[IDE Code Name]`.

Taking vscode as an example, its corresponding `IDE Code Name` is `code`, then add the following content to `.env.local`:

```perl
# Specify IDE as vscode
CODE_EDITOR=code
```

## IDEs Supported for Automatic Recognition

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
        <td>Visual Studio Code - Insiders (vscode Insiders)</td>
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

## Other IDEs

If the IDE you are using is not in the list of supported IDEs for automatic recognition, or if you are using an IDE that is not officially listed but still supported, it may cause recognition failure. You need to add a file named `.env.local` in the project root and add: `CODE_EDITOR=[IDE executable program path]`, where the `IDE executable program path` is referenced as follows.

### MAC

Taking VSCodium as an example (the steps are the same for other IDEs), to obtain the `IDE executable program path` on a MAC system, follow these steps:

1. Open the IDE program VSCodium.
2. Open the `Activity Monitor` on MAC, find VSCodium in the process, and double-click it:
   ![Active_Monitor](https://github.com/zh-lx/code-inspector/assets/73059627/17d65dc1-82ff-439f-aeba-8e3056cd2a1b)
3. After double-clicking, in the`Open Files and Ports`Tab of the window, find the path corresponding to the first txt, which is the `IDE executable program path`:
   ![Open_Files](https://github.com/zh-lx/code-inspector/assets/73059627/f27a61f4-1c57-4687-83c7-6078533d62b4)
4. Copy the `IDE executable program path` to the `.env.local` file:

```perl
# .env.local
CODE_EDITOR=/Applications/VSCodium.app/Contents/MacOS/Electron
```

### Windows

Taking WebStorm as an example (the steps are the same for other IDEs), to obtain the `IDE executable program path` on a Windows system, follow these steps:

1. Find the shortcut of the IDE (if it doesn't exist, create one), right-click the shortcut, and select【Properties】:
   <img src="https://github.com/zh-lx/code-inspector/assets/73059627/6db6899f-fec5-474a-bffb-de8a394df777" style="max-width: 400px" />
2. After opening, in the【Shortcut】Tab, find【Target】under【Target】, remove the double quotes in【Target】, which is the `IDE executable program path`:
   <img src="https://github.com/zh-lx/code-inspector/assets/73059627/f5067697-a246-4566-a530-ca83f9803bf5" style="max-width: 400px" />
3. Copy the `IDE executable program path` to the `.env.local` file:

```perl
# .env.local
CODE_EDITOR=D:\webstorm\WebStorm 2023.1.3\bin\webstorm64.exe
```
