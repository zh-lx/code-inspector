export type Editor = 'atom' | 'code' | 'code_insiders' | 'idea' | 'phpstorm' | 'pycharm' | 'webstorm' | 'hbuilder';
export type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';
export type Behavior = {
    locate?: boolean;
    copy?: boolean | string;
};
export type RecordInfo = {
    port: number;
    entry: string;
    nextJsEntry: string;
    ssrEntry: string;
    findPort?: Promise<number>;
};
export type IDEOpenMethod = 'reuse' | 'new' | 'auto';
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
export type CodeOptions = {
    /**
     * @zh 指定项目的打包器
     * @en specify the bundler of the project
     */
    bundler?: 'vite' | 'webpack' | 'rspack';
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
    injectTo?: string;
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
     * @cn 强制设置 webpack 交互注入逻辑 loader 的缓存策略；为 true 时全缓存；为 false 时不缓存；不设置则自动判断仅对入口文件不缓存，其余文件缓存
     * @en Force set the caching strategy for the webpack interactive injection logic loader; when set to true, fully cache; when set to false, do not cache; if not set, automatically determine to cache only the entry file, and not cache other files.
     */
    forceInjectCache?: boolean | (() => boolean);
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
};
export {};
