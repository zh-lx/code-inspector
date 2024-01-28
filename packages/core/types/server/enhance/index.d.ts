type FileType = 'vue' | 'jsx' | 'svelte' | unknown;
type EnhanceCodeParams = {
    content: string;
    filePath: string;
    fileType: FileType;
};
export declare function enhanceCode(params: EnhanceCodeParams): string;
export {};
