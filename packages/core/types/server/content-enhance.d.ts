type FileType = 'vue' | 'jsx';
type EnhanceCodeParams = {
    code: string;
    filePath: string;
    fileType: FileType;
};
export declare function enhanceCode(params: EnhanceCodeParams): string;
export {};
