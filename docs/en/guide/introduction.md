# Introduction

`code-inspector-plugin` is a development efficiency tool based on `webpack/vite plugin`. Clicking on an dom on the page will automatically open your IDE and position the cursor to the corresponding source code position of the dom.

![code-inspector](https://user-images.githubusercontent.com/73059627/227070438-6e40e112-6f1d-4f67-9f26-53986bff77c3.gif)

## Why code-inspector-plugin

In web development, to modify a module code, we first need to find the corresponding code file for the module. For some large projects with a large number of code files and deep file levels, it is not easy to quickly find the corresponding code files. Especially for developers who are new to a project, searching for the code corresponding to the module is often time-consuming and laborious.

Therefore, we yearn for a way for developers to quickly locate the code corresponding to the module, and `code-inspector-plugin` has emerged. With just one click of the mouse, you can directly locate the corresponding code, greatly improving the experience and efficiency of developers.

## Advantages

Compared to similar tools on the market, `code-inspector-plugin` has some obvious leading advantages:

- <b>High positioning accuracy</b>：On the market, tools such as `vue devtools` also have similar code localization functions. However, `vue devtools` can only locate the Root DOM of each vue file and can only be located at the file level. In contrast,`code-inspector-plugin` can locate the DOM corresponding to all dom nodes in the source code, and can be precise to each line and column of the corresponding code.
- <b>Widely Supportability</b>：`code-inspector-plugin` is compatible with multiple packers and frontend frameworks, supports use in `webpack/vite`, and supports frontend frameworks such as `vue2/3` and `react`.
- <b>Ultimate user experience</b>：`code-inspector-plugin` internally encapsulates the logic related to the `html/js/css` of Code review by implementing a web component, which is isolated from the host code while giving users the ultimate interactive experience.
