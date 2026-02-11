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

export class BrowserChalkChain {
  private parts: { text: string; style: string }[] = [];

  push(text: string, style: string): this {
    this.parts.push({ text, style });
    return this;
  }

  /** 换行 */
  line(): this {
    this.parts.push({ text: '\n', style: '' });
    return this;
  }

  /** 合并另一个 chain 的内容 */
  merge(other: BrowserChalkChain): this {
    this.parts.push(...other.parts);
    return this;
  }

  /** 构建最终的 text 和 styles 数组 */
  build(): ChainResult {
    const textParts: string[] = [];
    const styles: string[] = [];
    for (const p of this.parts) {
      if (p.text === '\n') {
        textParts.push('\n');
      } else {
        textParts.push(`%c${p.text}`);
        styles.push(p.style);
      }
    }
    return { text: textParts.join(''), styles };
  }

  /** 直接 console.log 输出 */
  log(): void {
    const { text, styles } = this.build();
    console.log(text, ...styles);
  }

  /** 直接 console.warn 输出 */
  warn(): void {
    const { text, styles } = this.build();
    console.warn(text, ...styles);
  }

  /** 直接 console.error 输出 */
  error(): void {
    const { text, styles } = this.build();
    console.error(text, ...styles);
  }

  /** console.groupCollapsed 输出，label 为当前 chain 内容，fn 中输出 group 内容 */
  groupCollapsed(fn: () => void): void {
    const { text, styles } = this.build();
    console.groupCollapsed(text, ...styles);
    fn();
    console.groupEnd();
  }

  group(fn: () => void): void {
    const { text, styles } = this.build();
    console.group(text, ...styles);
    fn();
    console.groupEnd();
  }

  // 颜色方法
  blue(t: string): this { return this.push(t, 'color: #006aff; word-break: break-word;'); }
  green(t: string): this { return this.push(t, 'color: #00B42A; word-break: break-word;'); }
  yellow(t: string): this { return this.push(t, 'color: #FF7D00; word-break: break-word;'); }
  red(t: string): this { return this.push(t, 'color: #F53F3F; word-break: break-word;'); }
  gray(t: string): this { return this.push(t, 'color: #86909C; word-break: break-word;'); }
  text(t: string): this { return this.push(t, ''); }
  styled(t: string, css: string): this { return this.push(t, css); }

  /** 无参数：给上一个 part 追加 bold；有参数：输出纯 bold 文本 */
  bold(t?: string): this {
    if (t !== undefined) {
      return this.push(t, 'font-weight: bold;');
    }
    if (this.parts.length > 0) {
      this.parts[this.parts.length - 1].style += ' font-weight: bold;';
    }
    return this;
  }

  style(style: string): this {
    if (this.parts.length > 0) {
      this.parts[this.parts.length - 1].style += style;
    }
    return this;
  }
}

type ChalkFactory = {
  [K in 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'text']: (t: string) => BrowserChalkChain;
} & {
  bold: (t?: string) => BrowserChalkChain;
  styled: (t: string, css: string) => BrowserChalkChain;
};

const methods = ['blue', 'green', 'yellow', 'red', 'gray', 'bold', 'text', 'styled'] as const;

export const browserChalk = Object.fromEntries(
  methods.map((method) => [
    method,
    (...args: any[]) => {
      const chain = new BrowserChalkChain();
      return (chain[method] as Function).apply(chain, args);
    },
  ]),
) as ChalkFactory;
