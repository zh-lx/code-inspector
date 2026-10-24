type TransformerInput = {
    filename: string;
    src: string;
    options: {
        dev?: boolean;
        platform?: string;
        projectRoot?: string;
        customTransformOptions?: {
            environment?: string;
        };
    };
    plugins?: unknown[];
};
export declare function transform(input: TransformerInput): Promise<any>;
export declare function getCacheKey(options: unknown): string;
export {};
