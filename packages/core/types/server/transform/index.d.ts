import { EscapeTags, PathType } from '../../shared';
type FileType = 'vue' | 'jsx' | 'svelte' | 'astro' | 'mdx' | unknown;
type TransformCodeParams = {
    content: string;
    filePath: string;
    fileType: FileType;
    escapeTags: EscapeTags;
    pathType: PathType;
    mdx?: boolean;
};
export declare function transformCode(params: TransformCodeParams): Promise<string>;
export {};
