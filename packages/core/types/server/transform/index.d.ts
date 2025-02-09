import { EscapeTags, PathType } from '../../shared';
type FileType = 'vue' | 'jsx' | 'svelte' | unknown;
type TransformCodeParams = {
    content: string;
    filePath: string;
    fileType: FileType;
    escapeTags: EscapeTags;
    pathType: PathType;
};
export declare function transformCode(params: TransformCodeParams): string;
export {};
