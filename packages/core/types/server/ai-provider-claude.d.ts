/// <reference types="node" />
import { ChildProcess } from 'child_process';
import type { ClaudeCodeOptions, ClaudeCliOptions, ClaudeSdkOptions, ClaudeAgentOptions } from '../shared';
import type { AIContext, AIMessage } from './ai';
export interface ProviderCallbacks {
    sendSSE: (data: object | string) => void;
    onEnd: () => void;
}
export interface ProviderResult {
    abort: () => void;
}
interface InlineImagePayload {
    mediaType: string;
    data: string;
}
interface ClaudeCliInputMessage {
    type: 'user';
    session_id: string;
    parent_tool_use_id: null;
    message: {
        role: 'user';
        content: Array<{
            type: 'text';
            text: string;
        } | {
            type: 'image';
            source: {
                type: 'base64';
                media_type: string;
                data: string;
            };
        }>;
    };
}
declare function stripInlineImageDataUrls(text: string): string;
declare function extractInlineImages(text: string): {
    text: string;
    images: InlineImagePayload[];
};
declare function buildClaudeCliInputMessage(promptText: string, images: InlineImagePayload[], sessionId?: string): ClaudeCliInputMessage;
/**
 * 构建完整的提示信息
 */
declare function buildPrompt(message: string, context: AIContext | null, history: AIMessage[], projectRootPath: string): string;
/**
 * 构建续会话单轮提示：
 * - 保留当前轮 context，避免模型长期锚定首轮 context
 * - 不重复拼接历史（由 session/resume 自身维护）
 */
declare function buildResumeTurnPrompt(message: string, context: AIContext | null, projectRootPath: string): string;
declare function getClaudeAgentOptions(aiOptions?: ClaudeCodeOptions): ClaudeAgentOptions;
declare function getClaudeCliOptions(aiOptions?: ClaudeCodeOptions): ClaudeCliOptions;
declare function getClaudeSdkOptions(aiOptions?: ClaudeCodeOptions): ClaudeSdkOptions;
export declare const __TEST_ONLY__: {
    stripInlineImageDataUrls: typeof stripInlineImageDataUrls;
    extractInlineImages: typeof extractInlineImages;
    buildClaudeCliInputMessage: typeof buildClaudeCliInputMessage;
    buildPrompt: typeof buildPrompt;
    buildResumeTurnPrompt: typeof buildResumeTurnPrompt;
    getClaudeAgentOptions: typeof getClaudeAgentOptions;
    getClaudeCliOptions: typeof getClaudeCliOptions;
    getClaudeSdkOptions: typeof getClaudeSdkOptions;
    findClaudeCodeCli: typeof findClaudeCodeCli;
    queryViaCli: typeof queryViaCli;
    getClaudeQuery: typeof getClaudeQuery;
    setupSdkEnvironment: typeof setupSdkEnvironment;
    buildSdkQueryOptions: typeof buildSdkQueryOptions;
    queryViaSdk: typeof queryViaSdk;
    setClaudeQuery: (queryFn: Function | null) => void;
    resetCaches: () => void;
};
/**
 * 获取模型信息
 * 优先使用用户配置，否则通过 CLI 的 system 事件获取（无 API 消耗）
 */
export declare function getModelInfo(aiOptions: ClaudeCodeOptions | undefined): Promise<string>;
/**
 * Claude provider 统一入口
 * ai.ts 只需调用此函数，不感知 CLI/SDK 细节
 */
export declare function handleClaudeRequest(message: string, context: AIContext | null, history: AIMessage[], sessionId: string | undefined, cwd: string, aiOptions: ClaudeCodeOptions | undefined, callbacks: ProviderCallbacks): ProviderResult;
/**
 * 查找本地 Claude Code CLI 路径
 */
export declare function findClaudeCodeCli(): string | null;
/**
 * 通过 CLI 执行查询
 */
declare function queryViaCli(cliPath: string, prompt: string, inputMessage: ClaudeCliInputMessage | undefined, cwd: string, aiOptions: ClaudeCodeOptions | undefined, onData: (data: string) => void, onError: (error: string) => void, onEnd: () => void, sessionId?: string, onSessionId?: (id: string) => void): ChildProcess;
declare function getClaudeQuery(): Promise<Function | null>;
declare function setupSdkEnvironment(aiOptions?: ClaudeCodeOptions): () => void;
declare function buildSdkQueryOptions(aiOptions: ClaudeCodeOptions | undefined, cwd: string, sessionId?: string): Record<string, any>;
declare function queryViaSdk(prompt: string | AsyncIterable<any>, cwd: string, aiOptions: ClaudeCodeOptions | undefined, sessionId: string | undefined, sendSSE: (data: object | string) => void, isAborted: () => boolean): Promise<{
    timedOut: boolean;
}>;
export {};
