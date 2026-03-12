/// <reference types="node" />
/**
 * AI 功能模块 - 处理与 AI Agent 的交互
 * 通过 provider 模式支持不同的 AI 后端
 */
import http from 'http';
import type { ClaudeCodeOptions, CodexOptions, OpenCodeOptions } from '../shared';
/**
 * AI 上下文信息
 */
export interface AIContext {
    file: string;
    line: number;
    column: number;
    name: string;
}
/**
 * AI 消息
 */
export interface AIMessage {
    role: 'user' | 'assistant';
    content: string;
}
/**
 * AI 请求体
 */
export interface AIRequest {
    message: string;
    context: AIContext | null;
    history?: AIMessage[];
    sessionId?: string;
    provider?: AIProviderType;
    model?: string;
}
export type AIProviderType = 'claudeCode' | 'codex' | 'opencode';
type AIProviderOptionsMap = {
    claudeCode: ClaudeCodeOptions;
    codex: CodexOptions;
    opencode: OpenCodeOptions;
};
export type ResolvedAIOptions = Partial<AIProviderOptionsMap>;
export type ActiveAIOptions<T extends AIProviderType = AIProviderType> = {
    provider: T;
    options: AIProviderOptionsMap[T];
};
/**
 * 从 behavior 配置中提取 AI 选项
 */
export declare function getAIOptions(behavior?: {
    ai?: {
        claudeCode?: boolean | ClaudeCodeOptions;
        codex?: boolean | CodexOptions;
        opencode?: boolean | OpenCodeOptions;
    };
}): ResolvedAIOptions | undefined;
export declare function getAvailableAIProviders(aiOptions?: ResolvedAIOptions): AIProviderType[];
export declare function resolveAIOptions(aiOptions: ResolvedAIOptions | undefined, requestedProvider?: AIProviderType): ActiveAIOptions | undefined;
/**
 * 处理 AI 请求
 */
export declare function handleAIRequest(req: http.IncomingMessage, res: http.ServerResponse, corsHeaders: Record<string, string>, aiOptions: ResolvedAIOptions | undefined, projectRootPath: string): Promise<void>;
/**
 * 处理 AI 模型信息请求
 */
export declare function handleAIModelRequest(res: http.ServerResponse, corsHeaders: Record<string, string>, aiOptions: ResolvedAIOptions | undefined, requestedProvider?: string | null): Promise<void>;
export {};
