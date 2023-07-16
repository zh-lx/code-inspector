# 常见问题

## 微前端使用

如果遇到微前端子项目无法对 DOM 筛选跳转，是因为插件依赖于编译过程，在主项目和子项目中都应用 `code-inspector-plugin` 即可正常使用。

## 系统找不到指定路径

如果在打开 IDE 时遇到如下错误，可能是因为 IDE 的目录存在中文目录，将其修改为英文目录即可正常使用：

![Cache_3237daf49ba5c20a](https://github.com/zh-lx/code-inspector/assets/73059627/a6883758-27e1-474d-87a4-32e1cfd013d0)

## 编译失败

使用插件遇到编译失败的情况，大概率是 `code-inspector-plugin` 和其他插件的顺序问题，可以分别尝试将 `code-inspector-plugin` 放到 `vite/webpack plugins` 数组配置的第一项和最后一项，看是否能编译成功。

如果依然编译失败，请 [加入用户群](/more/feedback) 或到 github 提 [issue](https://github.com/zh-lx/code-inspector/issues)

## 点击跳转没有打开 IDE

如果项目正常运行，且可以出现 DOM inspector 功能（按住组合键时在页面有 DOM 遮罩筛选），但是点击后没有自动打开 IDE。可能是因为使用的时不支持自动识别的 IDE 或非官方版本的 IDE，这两种情况都可以参考【指定 IDE】一节中的 [非自动识别的 IDE](/guide/ide.html#非自动识别的-ide) 配置教程。

## 其他问题

其他问题请 [加入用户群](/more/feedback) 或到 github 提 [issue](https://github.com/zh-lx/code-inspector/issues)
