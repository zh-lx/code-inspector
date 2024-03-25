import { EscapeTags } from '../../shared';
type FileType = 'vue' | 'jsx' | 'svelte' | unknown;
type TransformCodeParams = {
    content: string;
    filePath: string;
    fileType: FileType;
    escapeTags: EscapeTags;
};
export declare function transformCode(params: TransformCodeParams): string;
export {};
