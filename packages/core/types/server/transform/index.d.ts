type FileType = 'vue' | 'jsx' | 'svelte' | unknown;
type TransformCodeParams = {
    content: string;
    filePath: string;
    fileType: FileType;
};
export declare function transformCode(params: TransformCodeParams): string;
export {};
