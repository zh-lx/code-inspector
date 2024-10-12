# 指定 IDE

默认情况下，`code-inspector-plugin` 会扫描系统当前运行中的应用，自动打开一个正在运行的 IDE 程序（自动识别仅限下表中支持自动识别的 IDE），所以多数情况下你无需手动指定 IDE。

如果你要指定 IDE，需要在项目根目录添加一个名为 `.env.local` 的文件并添加： `CODE_EDITOR=[IDE编码名称]`。

以 vscode 为例，它对应的 `IDE编码名称` 是 `code`，则对应在 `.env.local` 中添加如下内容：

```perl
# 指定 IDE 为 vscode
CODE_EDITOR=code
```

## 支持自动识别的 IDE

支持自动识别的 IDE 及对应的 IDE 编码名称如下表：



<table>
    <tr>
        <th>IDE</th>
        <th>IDE编码名称</th>
        <th>MacOS</th>
        <th>Windows</th>
        <th>Linux</th>        
    </tr>
    <tr>
        <td><a href="https://code.visualstudio.com/" target="_blank">Visual Studio Code</a></td>
        <td>code</td>
        <td>✅</td>
        <td>✅</td>
        <td>✅</td>
    </tr>
    <tr>
        <td><a href="https://www.cursor.com/" target="_blank">Cursor</a></td>
        <td>cursor</td>
        <td>✅</td>
        <td>✅</td>
        <td></td>
    </tr>
    <tr>
        <td><a href="https://insiders.vscode.dev/" target="_blank">Visual Studio Code - Insiders</a></td>
        <td>code-insiders</td>
        <td>✅</td>
        <td>✅</td>
        <td>✅</td>
    </tr>
    <tr>
        <td><a href="https://vscodium.com/" target="_blank">VSCodium</a></td>
        <td>codium</td>
        <td>✅</td>
        <td>✅</td>
        <td>✅</td>
    </tr>
    <tr>
        <td><a href="https://www.jetbrains.com/webstorm/" target="_blank">WebStorm</a></td>
        <td>webstorm</td>
        <td>✅</td>
        <td>✅</td>
        <td>✅</td>
    </tr>
    <tr>
        <td><a href="https://atom-editor.cc/" target="_blank">Atom</a></td>
        <td>atom</td>
        <td>✅</td>
        <td>✅</td>
        <td>✅</td>
    </tr>
    <tr>
        <td><a href="https://www.dcloud.io/hbuilderx.html" target="_blank">HBuilderX</a></td>
        <td>hbuilder</td>
        <td>✅</td>
        <td>✅</td>
        <td></td>
    </tr>
    <tr>
        <td><a href="https://www.jetbrains.com/phpstorm/" target="_blank">PhpStorm</a></td>
        <td>phpstorm</td>
        <td>✅</td>
        <td>✅</td>
        <td>✅</td>
    </tr>
    <tr>
        <td><a href="https://www.jetbrains.com/pycharm/" target="_blank">Pycharm</a></td>
        <td>pycharm</td>
        <td>✅</td>
        <td>✅</td>
        <td>✅</td>
    </tr>
    <tr>
        <td><a href="https://www.jetbrains.com/idea/" target="_blank">IntelliJ IDEA</a></td>
        <td>idea</td>
        <td>✅</td>
        <td>✅</td>
        <td>✅</td>
    </tr>
    <tr>
        <td><a href="https://brackets.io/" target="_blank">Brackets</a></td>
        <td>brackets</td>
        <td>✅</td>
        <td>✅</td>
        <td>✅</td>
    </tr>
    <tr>
        <td><a href="https://www.jetbrains.com/objc/" target="_blank">Appcode</a></td>
        <td>appcode</td>
        <td>✅</td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td><a href="https://atom-editor.cc/beta/" target="_blank">Atom Beta</a></td>
        <td>atom-beta</td>
        <td>✅</td>
        <td></td>
        <td></td>
    </tr>
    <tr>
        <td><a href="https://www.jetbrains.com/clion/" target="_blank">Clion</a></td>
        <td>clion</td>
        <td>✅</td>
        <td>✅</td>
        <td></td>
    </tr>
    <tr>
        <td><a href="https://www.jetbrains.com/rider/" target="_blank">Rider</a></td>
        <td>rider</td>
        <td>✅</td>
        <td>✅</td>
        <td>✅</td>
    </tr>
    <tr>
        <td><a href="https://www.jetbrains.com/ruby/" target="_blank">Rubymine</a></td>
        <td>rubymine</td>
        <td>✅</td>
        <td>✅</td>
        <td>✅</td>
    </tr>
</table>

## 其他 IDE

如果你使用的 IDE 不在上述支持自动识别的 IDE 列表内，或者是使用了在上述列表中但非官方的 IDE，可能导致识别失败。你需要在项目根目录添加一个名为 `.env.local` 的文件并添加： `CODE_EDITOR=[IDE可执行程序路径]`，IDE可执行程序路径参考如下。

### MAC 系统

以 VSCodium 为例（其他的 IDE 步骤相同），要在 MAC 系统中获取 IDE 可执行程序路径，步骤如下：

1. 打开 IDE 程序 VSCodium
2. 打开 MAC 自带的活动监视器，在进程中找到 VSCodium 并双击：
   ![Active_Monitor](https://github.com/zh-lx/code-inspector/assets/73059627/17d65dc1-82ff-439f-aeba-8e3056cd2a1b)
3. 双击后，在窗口的【打开文件和端口】Tab 中，找到第一个 txt 下面对应的路径，即为 IDE 可执行程序路径：
   ![Open_Files](https://github.com/zh-lx/code-inspector/assets/73059627/f27a61f4-1c57-4687-83c7-6078533d62b4)
4. 将 IDE 可执行路径程序复制到 `.env.local` 文件中即可：

```perl
# .env.local
CODE_EDITOR=/Applications/VSCodium.app/Contents/MacOS/Electron
```

### Windows 系统

以 Webstorm 为例（其他的 IDE 步骤相同），要在 Windows 系统中获取 IDE 可执行程序路径，步骤如下：

1. 找到 IDE 的快捷方式（如果没有则创建一个），右键点击快捷方式，选择【属性】：
   <img src="https://github.com/zh-lx/code-inspector/assets/73059627/6db6899f-fec5-474a-bffb-de8a394df777" style="max-width: 400px" />
2. 打开后，在【快捷】Tab 找到【目标】，去掉【目标】中的双引号即为 IDE 可执行路径：
   <img src="https://github.com/zh-lx/code-inspector/assets/73059627/f5067697-a246-4566-a530-ca83f9803bf5" style="max-width: 400px" />
3. 将 IDE 可执行路径程序复制到 `.env.local` 文件中即可：

```perl
# .env.local
CODE_EDITOR=D:\webstorm\WebStorm 2023.1.3\bin\webstorm64.exe
```
