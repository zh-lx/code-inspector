/// <reference types="node" />
import { ChildProcess } from 'child_process';
import type { CodexOptions, CodexCliOptions, CodexSdkOptions, CodexAgentOptions } from '../shared';
import type { AIContext, AIMessage } from './ai';
import type { ProviderCallbacks, ProviderResult } from './ai-provider-claude';
export type CodexProviderRuntime = {
    providerId: 'codex' | 'opencode';
    displayName: 'Codex' | 'OpenCode';
    cliBinaryName: 'codex' | 'opencode';
    sdkPackages: string[];
    sdkInstallCommand: string;
};
/** Parsed JSON event from Codex/OpenCode CLI or SDK stream */
interface CliStreamEvent {
    type: string;
    sessionID?: string;
    sessionId?: string;
    thread_id?: string;
    info?: {
        id?: string;
        modelID?: string;
        model?: {
            modelID?: string;
        };
        error?: {
            message?: string;
            data?: {
                message?: string;
            };
        };
    };
    part?: {
        type?: string;
        id?: string;
        callID?: string;
        tool?: string;
        name?: string;
        text?: string;
        state?: any;
        files?: any[];
    };
    properties?: Record<string, any>;
    item?: any;
    field?: string;
    delta?: any;
    text?: string;
    output_text?: string;
    partID?: string;
    message?: any;
    error?: any;
    model?: string;
    modelID?: string;
    response?: {
        model?: string;
    };
    metadata?: {
        model?: string;
    };
    last_agent_message?: string;
    result?: string;
    content?: any;
}
export declare const CODEX_PROVIDER_RUNTIME: CodexProviderRuntime;
/**
 * 构建完整的提示信息
 */
export declare function buildPrompt(message: string, context: AIContext | null, history: AIMessage[], projectRootPath: string): string;
/**
 * 构建续会话单轮提示：
 * - 保留当前轮 context，避免模型长期锚定首轮 context
 * - 不重复拼接历史（由 session/resume 自身维护）
 */
export declare function buildResumeTurnPrompt(message: string, context: AIContext | null, projectRootPath: string): string;
export interface InlineImagePayload {
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
export declare const INLINE_IMAGE_DATA_URL_REGEX: RegExp;
export declare function stripInlineImageDataUrls(text: string): string;
export declare function extractInlineImages(text: string): {
    text: string;
    images: InlineImagePayload[];
};
export declare function mediaTypeToExtension(mediaType: string): string;
declare function persistInlineImagesToTempFiles(images: InlineImagePayload[]): TempImageWriteResult;
declare function cleanupTempFiles(filePaths: string[]): void;
declare function buildCodexSdkRunInput(promptText: string, imagePaths: string[]): string | CodexRunInputItem[];
export declare const __TEST_ONLY__: {
    buildPrompt: typeof buildPrompt;
    buildResumeTurnPrompt: typeof buildResumeTurnPrompt;
    stripInlineImageDataUrls: typeof stripInlineImageDataUrls;
    extractInlineImages: typeof extractInlineImages;
    mediaTypeToExtension: typeof mediaTypeToExtension;
    persistInlineImagesToTempFiles: typeof persistInlineImagesToTempFiles;
    cleanupTempFiles: typeof cleanupTempFiles;
    buildCodexSdkRunInput: typeof buildCodexSdkRunInput;
    buildCodexExecArgs: typeof buildCodexExecArgs;
    buildOpenCodeRunArgs: typeof buildOpenCodeRunArgs;
    buildCliArgs: typeof buildCliArgs;
    getCodexAgentOptions: typeof getCodexAgentOptions;
    getCodexCliOptions: typeof getCodexCliOptions;
    getCodexSdkOptions: typeof getCodexSdkOptions;
    formatConfigValue: typeof formatConfigValue;
    buildCommonArgs: typeof buildCommonArgs;
    extractTextFromContent: typeof extractTextFromContent;
    extractModelFromEvent: typeof extractModelFromEvent;
    extractTextEvent: typeof extractTextEvent;
    shouldIgnorePlainLine: typeof shouldIgnorePlainLine;
    findCodexCli: typeof findCodexCli;
    queryViaCli: typeof queryViaCli;
    getCodexSDKCtor: typeof getCodexSDKCtor;
    buildCodexSDKClientOptions: typeof buildCodexSDKClientOptions;
    buildCodexSDKThreadOptions: typeof buildCodexSDKThreadOptions;
    stringifyUnknown: typeof stringifyUnknown;
    truncateDiffText: typeof truncateDiffText;
    readFileText: typeof readFileText;
    resolveChangePath: typeof resolveChangePath;
    ensureFileSnapshot: typeof ensureFileSnapshot;
    getFileSnapshot: typeof getFileSnapshot;
    getItemText: typeof getItemText;
    buildToolEventFromItem: typeof buildToolEventFromItem;
    detectReadCommand: typeof detectReadCommand;
    stripNlLineNumbers: typeof stripNlLineNumbers;
    buildSDKErrorMessage: typeof buildSDKErrorMessage;
    queryViaSdk: typeof queryViaSdk;
    setCodexSDKCtor: (ctor: any, pkg?: string) => void;
    resetCaches: () => void;
};
declare function getCodexAgentOptions(codexOptions?: CodexOptions): CodexAgentOptions;
declare function getCodexCliOptions(codexOptions?: CodexOptions): CodexCliOptions;
declare function getCodexSdkOptions(codexOptions?: CodexOptions): CodexSdkOptions;
/**
 * 获取模型信息
 * 优先使用用户配置（Codex 暂不通过额外请求探测模型）
 */
export declare function getModelInfo(codexOptions: CodexOptions | undefined): Promise<string>;
/**
 * Codex provider 统一入口
 */
export declare function handleCodexRequest(message: string, context: AIContext | null, history: AIMessage[], sessionId: string | undefined, cwd: string, codexOptions: CodexOptions | undefined, callbacks: ProviderCallbacks, runtime?: CodexProviderRuntime): ProviderResult;
/**
 * 查找本地 Codex CLI 路径
 */
export declare function findCodexCli(runtime?: CodexProviderRuntime): string | null;
declare function formatConfigValue(value: string | number | boolean): string;
declare function buildCommonArgs(codexOptions: CodexCliOptions, outputFile: string): string[];
declare function buildOpenCodeRunArgs(codexOptions: CodexCliOptions, imagePaths: string[], prompt: string, sessionId?: string): string[];
declare function buildCodexExecArgs(codexOptions: CodexCliOptions, outputFile: string, imagePaths: string[], prompt: string, sessionId?: string): string[];
declare function buildCliArgs(codexOptions: CodexCliOptions, outputFile: string, imagePaths: string[], prompt: string, sessionId: string | undefined, runtime: CodexProviderRuntime): string[];
declare function extractTextFromContent(content: any): string;
declare function extractModelFromEvent(event: CliStreamEvent): string;
declare function extractTextEvent(event: CliStreamEvent): {
    text: string;
    delta: boolean;
} | null;
declare function shouldIgnorePlainLine(line: string): boolean;
/**
 * 通过 CLI 执行查询
 */
declare function queryViaCli(cliPath: string, prompt: string, cwd: string, codexOptions: CodexCliOptions, imagePaths: string[], onData: (data: string) => void, onError: (error: string) => void, onEnd: () => void, sessionId?: string, onSessionId?: (id: string) => void, onModel?: (model: string) => void, isAborted?: () => boolean, runtime?: CodexProviderRuntime): ChildProcess;
declare function getCodexSDKCtor(runtime?: CodexProviderRuntime): Promise<any | null>;
declare function buildCodexSDKClientOptions(options: CodexSdkOptions): Record<string, any>;
declare function buildCodexSDKThreadOptions(options: CodexSdkOptions, cwd: string): Record<string, any>;
declare function stringifyUnknown(value: any): string;
type FileSnapshot = {
    absolutePath: string;
    displayPath: string;
    beforeContent: string;
};
/**
 * 从 shell 命令中提取被读取的文件路径。
 * 支持 nl -ba / cat / head / tail / sed -n 等常见读取命令，
 * 也支持 `/bin/zsh -lc "cd ... && nl -ba file | sed ..."` 格式。
 * 返回 { filePath, cdDir? }，其中 cdDir 是命令中 cd 到的目录（用于正确解析相对路径）。
 * 未检测到时返回 null。
 */
declare function detectReadCommand(command: string): {
    filePath: string;
    cdDir?: string;
} | null;
/**
 * 去除 nl -ba 输出的行号前缀（如 "     1\t..."）。
 */
declare function stripNlLineNumbers(output: string): string;
declare function truncateDiffText(text: string): string;
declare function readFileText(absolutePath: string): {
    exists: boolean;
    content: string;
};
declare function resolveChangePath(changePath: string, cwd: string): {
    absolutePath: string;
    displayPath: string;
};
declare function ensureFileSnapshot(toolId: string, displayPath: string, absolutePath: string, store: Map<string, Map<string, FileSnapshot>>): FileSnapshot;
declare function getFileSnapshot(toolId: string, absolutePath: string, store: Map<string, Map<string, FileSnapshot>>): FileSnapshot | null;
declare function getItemText(item: any): string;
declare function buildToolEventFromItem(item: any, context?: {
    cwd?: string;
    fileSnapshots?: Map<string, Map<string, FileSnapshot>>;
    readOutputStore?: Map<string, string>;
    done?: boolean;
    providerId?: 'codex' | 'opencode';
}): {
    toolId: string;
    toolName: string;
    input?: Record<string, any>;
    result?: string;
    isError?: boolean;
} | null;
declare function buildSDKErrorMessage(event: CliStreamEvent, runtime?: CodexProviderRuntime): string;
declare function queryViaSdk(input: string | CodexRunInputItem[], cwd: string, codexOptions: CodexSdkOptions, sessionId: string | undefined, sendSSE: (data: object | string) => void, isAborted: () => boolean, tempImagePaths: string[], runtime?: CodexProviderRuntime): Promise<{
    interrupt?: () => Promise<void> | void;
} | null>;
export {};
