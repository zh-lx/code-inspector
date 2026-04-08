import { EscapeTags } from '../../shared';
type VueCompilerDom = Pick<typeof import('@vue/compiler-dom'), 'parse' | 'transform'>;
export declare function resolveVueCompilerDom(mod: any): VueCompilerDom;
export declare function transformVue(content: string, filePath: string, escapeTags: EscapeTags): Promise<string>;
export {};
