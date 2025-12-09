/// <reference types="node" />
import { Server } from 'http';
import type { Editor } from 'launch-ide';
export type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';
export type Behavior = {
    locate?: boolean;
    copy?: boolean | string;
    target?: string;
    defaultAction?: 'copy' | 'locate' | 'target' | 'all';
};
export type RecordInfo = {
    port: number;
    entry: string;
    output: string;
    findPort?: Promise<number>;
    inputs?: Promise<string[]>;
    injectTo?: string[];
    envDir?: string;
    root?: string;
    server?: Server;
    previousPort?: number;
};
export type IDEOpenMethod = 'reuse' | 'new' | 'auto';
export type ImportClientWay = 'file' | 'code';
export type PathType = 'relative' | 'absolute';
type SourceInfo = {
    file: string;
    line: number;
    column: number;
};
export type EscapeTags = (string | RegExp)[];
export type Hooks = {
    /**
     * @zh server 端接收到 DOM 源代码定位请求后的钩子函数
     * @en The hook triggered when the server receives a request to locate the DOM source code.
     */
    afterInspectRequest?: (options: CodeOptions, source: SourceInfo) => void;
};
export type Condition = string | RegExp | (string | RegExp)[];
export type CodeOptions = {
    /**
     * @zh 指定项目的打包器
     * @en specify the bundler of the project
     */
    bundler: 'vite' | 'webpack' | 'rspack' | 'esbuild' | 'turbopack' | 'mako';
    /**
     * @cn 触发 DOM 定位功能的组合键，ctrlKey/altKey/metaKey/shiftKey 中一个或多个组成的数组，默认值为 ['altKey', 'shiftKey]。即 Mac 系统默认是 Option + Shift；Window 默认是 Alt + Shift。
     * @en The combination keys that triggers the DOM positioning function, it is an array of one or more from ctrlKey/altKey/metaKey/shiftKey, with default values of ['altKey', 'shiftKey']. The default for Mac systems is Option+Shift; and for Window is Alt+Shift.
     */
    hotKeys?: HotKey[] | false;
    /**
     * @cn 是否在页面展示功能开关按钮
     * @en Whether show the switch button of this function on the page
     */
    showSwitch?: boolean;
    /**
     * @cn 是否隐藏在控制台的按键提示
     * @en Whether hide the tips of combination keys on console.
     */
    hideConsole?: boolean;
    /**
     * @cn 打开功能开关的情况下，点击触发跳转编辑器时是否自动关闭开关
     * @en When opening the function switch, whether automatically close the switch when triggering the jump editor function.
     */
    autoToggle?: boolean;
    editor?: Editor;
    /**
     * @cn 用于注入DOM 筛选和点击跳转vscode的相关代码的文件。必须为绝对路径且以 `.js/.ts/.mjs/.mts/.jsx/.tsx` 为结尾的文件
     * @en The file to inject the relevant code for DOM filtering and click navigation in VSCode. Must be an absolute path and end with `.js/.ts/.mjs/.mts/.jsx/.tsx`.
     */
    injectTo?: string | string[];
    /**
     * @cn 是否在转换时添加 `enforce: 'pre'`，默认值为 `true`。（若因该插件引起了 `eslint-plugin` 校验错误，需要此项设置为 `false`）
     * @en Whether to add `enforce: 'pre'` during the transformation, default value is `true`. (If this plugin causes `eslint-plugin` validation errors, set this option to `false`)
     */
    enforcePre?: boolean;
    /**
     * @cn 自定义 development 环境的判断
     * @en Custom determination of the development environment.
     */
    dev?: boolean | (() => boolean);
    /**
     * @cn 对于 webpack/rspack 是否应用缓存策略，默认值为 `false`。(使用 cache 可能会导致)
     * @en Whether to apply the caching strategy for webpack/rspack, the default value is `false`
     */
    cache?: boolean;
    /**
     * @cn 仅对符合 match 正则表达式的文件会进行源码定位编译(精确匹配文件类型以减少无用文件参与编译，提升性能)，默认为 /\.(vue|jsx|tsx|js|ts|mjs|mts)$/
     * @en Only files that match the regular expression specified by `match` will undergo source code location compilation (precise matching of file types to reduce unnecessary files participating in compilation, improving performance); the default is /\.(vue|jsx|tsx|js|ts|mjs|mts)$/
     */
    match?: RegExp;
    /**
     * @cn 功能触发时的行为
     * @en The behavior
     */
    behavior?: Behavior;
    /**
     * @cn 打开 IDE 窗口的方式: 不传或者 `auto` 为自动寻找窗口；`reuse` 将复用当前窗口；`new` 为打开新窗口
     * @en The way to open the IDE window: Use `auto` or `undefined` to automatically find the window; Use `reuse` to reuse the current window; Use `new` to open a new window.
     */
    openIn?: IDEOpenMethod;
    /**
     * @cn 自定义跳转 IDE 时的打开路径，默认 "{file}:{line}:{column}"，其中 {xx} 为模版字符
     * @en Customize the path when open the IDE. Default value is "{file}:{line}:{column}", where {xx} represents template characters.
     */
    pathFormat?: string | string[];
    /**
     * @zh 钩子函数
     * @en hooks
     */
    hooks?: Hooks;
    /**
     * @zh 不注入 `data-insp-path` 的标签
     * @en tags without injecting data-insp-path
     */
    escapeTags?: EscapeTags;
    /**
     * @zh 是否隐藏控制台中 dom 的 `data-insp-path` 属性
     * @en Whether to hide the `data-insp-path` attribute of DOM in the console
     */
    hideDomPathAttr?: boolean;
    /**
     * @zh 点击 DOM 向 node server 发送请求时，是否使用 ip 代替 localhost。默认为 `false`
     * @en When sending request node server by clicking on the DOM, whether to use IP instead of localhost. Default value is `false`
     */
    ip?: boolean | string;
    /**
     * @zh 引入客户端交互代码的方式: file 为通过文件引入交互代码; code 为直接将交互代码注入页面。`0.16.x` 及之后的版本值默认为 `code`, `0.15.x` 之前的版本默认值为 `file`.
     * @en How to import client interaction code: `file` means import interaction code through a file; `code` means directly injecting the interaction code into the page. The default value for versions `0.16.x` and later is `code`, while for versions before `0.15.x`, the default value is `file`.
     */
    importClient?: ImportClientWay;
    /**
     * @zh 额外要参与编译的文件(用于让 node_modules 中的部分文件参与编译以注入 path 信息)
     * @en Additional files to be compiled (used to make some files in `node_modules` participate in compilation to inject path information)
     */
    include?: Condition;
    /**
     * @zh 不参与编译的文件
     * @en Files not to be compiled
     */
    exclude?: Condition;
    /**
     * @zh 用于映射文件路径，多用于将 node_modules 中的文件路径映射为项目中的文件路径
     * @en Used to map file paths, often used to map the file path in `node_modules` to the file path in the project
     */
    mappings?: Record<string, string> | Array<{
        find: string | RegExp;
        replacement: string;
    }>;
    /**
     * @zh 支持从指定端口开始寻找可用端口（默认从 5678 开始）
     * @en Supports finding available ports starting from a specified port (default starts from 5678).
     */
    port?: number;
    /**
     * @zh 是否在控制台中打印 server 的启动信息
     * @en Whether to print the server startup information in the console
     */
    printServer?: boolean;
    /**
     * @zh 注入在 DOM 上的路径类型，默认值为 `absolute`，即绝对路径
     * @en The type of path injected into the DOM, the default value is `absolute`, which means the path is relative to the project root directory
     */
    pathType?: PathType;
    /**
     * @zh 要跳过注入的代码片段：
     * - console: 跳过注入 console.error 和 console.warn 的代码片段，nextjs 和 nuxt 项目不建议跳过此项
     * - htmlScript: 跳过在 html 中注入 script 标签的代码片段，MPA 项目不建议跳过此项
     * @en The code snippets to skip injecting
     * - console: Skip injecting the code snippet that injects console.error and console.warn, it is not recommended to skip this item for nextjs and nuxt projects
     * - htmlScript: Skip injecting the code snippet that injects script tags in html, it is not recommended to skip this item for MPA projects
     */
    skipSnippets?: ('console' | 'htmlScript')[];
    /**
     * @zh 功能开关的快捷键，默认值为 `z`。同时按下 hotKeys 和 modeKey 可以打开功能开关设置
     * @en The shortcut key of the feature switch, the default value is `z`. Pressing hotKeys and modeKey at the same time can open the feature switch settings
     */
    modeKey?: string;
    /**
     * @zh 是否启用 server 功能。默认值为 `open`，即启用 server 功能。使用代码定位功能时必须启用 server 功能，线上构建只看 dom 路径时可以关闭 server 功能。
     * @en Whether to enable the server function. The default value is `open`, which means enabling the server function. The server function must be enabled when using the code location function, and it can be closed when building online only to view the dom path.
     */
    server?: 'open' | 'close';
};
export {};
