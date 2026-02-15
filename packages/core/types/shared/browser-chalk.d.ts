/**
 * 浏览器环境 console 彩色输出工具
 *
 * 使用方式类似 chalk，基于浏览器 console 的 %c 机制实现：
 * @example
 * ```ts
 * // 单行输出
 * browserChalk.blue('[plugin]').green(' ready').log();
 *
 * // 多行输出
 * browserChalk
 *   .blue('[plugin]')
 *   .line()
 *   .green('• line1')
 *   .line()
 *   .yellow('• line2')
 *   .log();
 * ```
 */
interface ChainResult {
    text: string;
    styles: string[];
}
export declare class BrowserChalkChain {
    private parts;
    push(text: string, style: string): this;
    /** 换行 */
    line(): this;
    /** 合并另一个 chain 的内容 */
    merge(other: BrowserChalkChain): this;
    /** 构建最终的 text 和 styles 数组 */
    build(): ChainResult;
    /** 直接 console.log 输出 */
    log(): void;
    /** 直接 console.warn 输出 */
    warn(): void;
    /** 直接 console.error 输出 */
    error(): void;
    /** console.groupCollapsed 输出，label 为当前 chain 内容，fn 中输出 group 内容 */
    groupCollapsed(fn: () => void): void;
    group(fn: () => void): void;
    blue(t: string): this;
    green(t: string): this;
    yellow(t: string): this;
    red(t: string): this;
    gray(t: string): this;
    text(t: string): this;
    styled(t: string, css: string): this;
    /** 无参数：给上一个 part 追加 bold；有参数：输出纯 bold 文本 */
    bold(t?: string): this;
    style(style: string): this;
}
type ChalkFactory = {
    [K in 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'text']: (t: string) => BrowserChalkChain;
} & {
    bold: (t?: string) => BrowserChalkChain;
    styled: (t: string, css: string) => BrowserChalkChain;
};
export declare const browserChalk: ChalkFactory;
export {};
