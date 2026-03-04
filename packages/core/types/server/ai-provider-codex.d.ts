import type { CodexOptions, CodexCliOptions } from '../shared';
import type { AIContext, AIMessage } from './ai';
import type { ProviderCallbacks, ProviderResult } from './ai-provider-claude';
interface InlineImagePayload {
    mediaType: string;
    data: string;
}
type TempImageWriteResult = {
    imagePaths: string[];
    failedCount: number;
};
type CodexRunInputItem = {
    type: 'text';
    text: string;
} | {
    type: 'local_image';
    path: string;
};
declare function stripInlineImageDataUrls(text: string): string;
declare function extractInlineImages(text: string): {
    text: string;
    images: InlineImagePayload[];
};
declare function persistInlineImagesToTempFiles(images: InlineImagePayload[]): TempImageWriteResult;
declare function cleanupTempFiles(filePaths: string[]): void;
declare function buildCodexSdkRunInput(promptText: string, imagePaths: string[]): string | CodexRunInputItem[];
export declare const __TEST_ONLY__: {
    stripInlineImageDataUrls: typeof stripInlineImageDataUrls;
    extractInlineImages: typeof extractInlineImages;
    persistInlineImagesToTempFiles: typeof persistInlineImagesToTempFiles;
    cleanupTempFiles: typeof cleanupTempFiles;
    buildCodexSdkRunInput: typeof buildCodexSdkRunInput;
    buildCodexExecArgs: typeof buildCodexExecArgs;
};
/**
 * 获取模型信息
 * 优先使用用户配置（Codex 暂不通过额外请求探测模型）
 */
export declare function getModelInfo(codexOptions: CodexOptions | undefined): Promise<string>;
/**
 * Codex provider 统一入口
 */
export declare function handleCodexRequest(message: string, context: AIContext | null, history: AIMessage[], sessionId: string | undefined, cwd: string, codexOptions: CodexOptions | undefined, callbacks: ProviderCallbacks): ProviderResult;
declare function buildCodexExecArgs(codexOptions: CodexCliOptions, outputFile: string, imagePaths: string[], prompt: string, sessionId?: string): string[];
export {};
