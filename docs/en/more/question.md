# Common Problems

## Do I need to manually distinguish between production and development environments?

The plugin automatically recognizes whether it is a production or development environment based on the internal parameters of the bundler. It only takes effect in the development environment, so users do not need to manually distinguish between production and development environments.

## Use in Micro Frontend

If you encounter issues where the DOM filtering navigation does not work in micro frontend sub-projects, you need to apply `code-inspector-plugin` in both the main project and sub-projects to use it normally.

## System cannot find the specified path

If you encounter the following error when opening the IDE, it may be because the IDE's directory contains Chinese characters. Modify it to an English directory, and it should work normally:

![Cache_3237daf49ba5c20a](https://github.com/zh-lx/code-inspector/assets/73059627/a6883758-27e1-474d-87a4-32e1cfd013d0)

## Clicking does not open the IDE

If the project is running normally, and the DOM inspector feature appears (DOM masking when holding down the combination keys on the page), but clicking does not automatically open the IDE, it may be because the IDE used does not support automatic recognition or is a non-official version of the IDE. In both cases, refer to the [Non Automatic Recognition IDE](/guide/ide.html#non_automatic_recognition_ide) section in the Specify IDE chapter for configuration instructions.

## Use in SSR

The plugin provides default support for most conventional SSR frameworks. For `next.js` projects, make sure there are files containing client-side code (including `use client`). If you have a custom-rendered SSR project, please submit an issue for consultation on how to adapt.

## Eslint Plugin Errors

If this plugin causes errors with the ESLint Plugin, please add `enforcePre: false` to the `code-inspector-plugin` configuration.

## Eslint Loader Hot Update Repetition

If this plugin causes Eslint Loader to repeatedly execute hot updates, please add `enforcePre: false` to the `code-inspector-plugin` configuration.

## Bundle Speed Optimization

For bundle speed optimization in `webpack`, you can use parameters such as `enforcePre`, `forceInjectCache`, `match`, etc., as referenced in the [API](/guide/api) section for optimization.

## Hide File Paths on DOM

Starting from version `0.12.0`, you can hide file paths on the DOM by setting `hideDomPathAttr: true`.

## Other Issues

If you encounter unresolved issues, please leave a message below [my Twitter](https://twitter.com/zhulxing312147) post or submit an issue on [Github](https://github.com/zh-lx/code-inspector/issues).
