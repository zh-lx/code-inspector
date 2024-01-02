/**
 * @description inject line、column and path to VNode when webpack compiling .vue file
 * @type webpack.loader.Loader
 */
export default function WebpackCodeInspectorLoader(this: any, content: string): Promise<string>;
