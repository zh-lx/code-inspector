# Common Problems

## Use in Micro Frontend

If you encounter the problem of unable to locate source code in micro frontend project, it is because the plugin relies on the compilation process and can be used normally by applying `code-inspector-plugin` in both the main and sub projects.

## The system cannot find the specified path

If you encounter this error when opening the IDE, it may be because there is a Chinese directory in the IDE directory. Modify it to an English directory to use it normally.

![Cache_3237daf49ba5c20a](https://github.com/zh-lx/code-inspector/assets/73059627/a6883758-27e1-474d-87a4-32e1cfd013d0)

## Compilation failed

When using `code-inspector-plugin`, encountering compilation failures is likely due to the order of `code-inspector-plugin` and other plugins. You can try placing `code-inspector-plugin` in the first and last items of the `vite/webpack plugins` array to see if compilation can be successful.

If the compilation still fails, please [join user group](/more/feedback) or go to github to submit [issue](https://github.com/zh-lx/code-inspector/issues).

## Can not open the IDE

If the project is running normally and the DOM inspector function can appear (There is a DOM mask on the page when holding down the combination key), but the IDE does not automatically open after clicking the dom. It may be because the IDE used does not support automatic recognition or unofficial versions of the IDE. In both cases, you can refer to the configuration tutorial for [Non Automatic Recognition IDE](/guide/ide.html#non_automatic_recognition_ide).

## Other Problems

If you encounter other problems, please [join user group](/more/feedback) or go to github to submit [issue](https://github.com/zh-lx/code-inspector/issues).
