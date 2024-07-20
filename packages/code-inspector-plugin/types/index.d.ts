import { CodeOptions } from 'code-inspector-core';
export interface CodeInspectorPluginOptions extends CodeOptions {
    /**
     * @zh 指定项目的打包器
     * @en specify the bundler of the project
     */
    bundler: 'vite' | 'webpack' | 'rspack' | 'esbuild';
    /**
     * @zh 设置为 true 时，仅当 .env.local 文件存在且其包含 CODE_INSPECTOR=true 时插件生效；默认值为 false
     * @en When set the value to true, only if the .env.local file exists and it contains CODE_INSPECTOR=true, the plugin takes effect; The default value is false
     */
    needEnvInspector?: boolean;
}
export declare function CodeInspectorPlugin(options: CodeInspectorPluginOptions): any;
export declare const codeInspectorPlugin: typeof CodeInspectorPlugin;
