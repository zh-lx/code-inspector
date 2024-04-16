# 常见问题

## 是否需要手动区分生产/开发环境

插件内部会根据打包工具的内部参数，自动识别当前是生产还是开发环境，仅在开发环境下生效，因此不需要用户手动区分生产和开发环境。

## 在微前端中使用

如果遇到微前端子项目无法对 DOM 筛选跳转，需要在主项目和子项目中都应用 `code-inspector-plugin` 即可正常使用。

## 系统找不到指定路径

如果在打开 IDE 时遇到如下错误，可能是因为 IDE 的安装目录存在中文目录，将其修改为英文目录即可正常使用：

![Cache_3237daf49ba5c20a](https://github.com/zh-lx/code-inspector/assets/73059627/a6883758-27e1-474d-87a4-32e1cfd013d0)

## 点击跳转没有打开 IDE

如果项目正常运行，且可以出现 DOM inspector 功能（按住组合键时在页面有 DOM 遮罩筛选），但是点击后没有自动打开 IDE。可能是因为使用的时不支持自动识别的 IDE 或非官方版本的 IDE，这两种情况都可以参考【指定 IDE】一节中的 [非自动识别的 IDE](/guide/ide.html#非自动识别的-ide) 配置教程。

## SSR 场景

默认支持了大部分常规框架的 SSR 项目，其中 `nextjs` 项目中需要确保有客户端执行的代码文件(包含 `use client`)。对于自建渲染的 SSR 项目，如何适配请加群咨询。

## Eslint Plugin 报错

如果本插件引起了 Eslint Plugin 报错问题，请在 `code-inspector-plugin` 配置中添加 `enforcePre: false`。

## Eslint Loader 热更新重复执行

如果本插件引起了 Eslint Loader 热更新重复执行，请在 `code-inspector-plugin` 配置中添加 `enforcePre: false`。

## 打包速度优化

对于 `webpack` 中的打包速度优化，可以使用参考 [API](/guide/api) 一节中的 `enforcePre`、`forceInjectCache`、`match` 等参数进行优化。

## 隐藏 DOM 上的文件路径

`0.12.0` 版本之后，可以通过设置 `hideDomPathAttr: true` 的方式，隐藏 DOM 上的文件路径。

## 其他问题

如果遇到无法解决的问题，请 [加入用户群](/more/feedback) 或到 github 提 [issue](https://github.com/zh-lx/code-inspector/issues)，加群咨询能够解决绝大部分问题。
