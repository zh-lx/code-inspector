# 常见问题

## 是否需要手动区分生产/开发环境

插件内部会根据打包工具的内部参数，自动识别当前是生产还是开发环境，仅在开发环境下生效，因此不需要用户手动区分生产和开发环境。

## 在微前端中使用

如果遇到微前端子项目无法对 DOM 筛选跳转，需要在主项目和子项目中都应用 `code-inspector-plugin` 即可正常使用。

## SSR 场景

默认支持了大部分常规框架的 SSR 项目，对于自建渲染的 SSR 项目，如何适配请加群咨询。

## Eslint Plugin 报错

如果本插件引起了 Eslint Plugin 报错问题，请在 `code-inspector-plugin` 配置中添加 `enforcePre: false`。

## 在 WSL 和 Dev Containers 中使用

可以通过在 wsl 中使用 `which code` 命令找到 vscode remote 的地址，地址差不多长这样：

```bash
/home/xxx/.vscode-server/bin/dc96b837cf6bb4af9cd736aa3af08cf8279f7685/bin/remote-cli/code
```

然后在项目根目录下创建一个 `.env.local` 文件，添加如下内容(替换为你的 vscode remote 地址)：

```bash
CODE_EDITOR=/home/xxx/.vscode-server/bin/dc96b837cf6bb4af9cd736aa3af08cf8279f7685/bin/remote-cli/code
```

## 其他问题

如果遇到无法解决的问题，请 [加入用户群](/more/feedback) 或到 github 提 [issue](https://github.com/zh-lx/code-inspector/issues)，加群咨询能够解决绝大部分问题。
