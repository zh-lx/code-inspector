/// <reference types="node" />
/**
 * AI 功能模块 - 处理与 AI Agent 的交互
 * 通过 provider 模式支持不同的 AI 后端
 */
import http from 'http';
import type { AIOptions } from '../shared';
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
    context: AIContext;
    history: AIMessage[];
    sessionId?: string;
}
/**
 * 从 behavior 配置中提取 AI 选项
 */
export declare function getAIOptions(behavior?: {
    ai?: {
        claudeCode?: boolean | AIOptions;
    };
}): AIOptions | undefined;
/**
 * 处理 AI 请求
 */
export declare function handleAIRequest(req: http.IncomingMessage, res: http.ServerResponse, corsHeaders: Record<string, string>, aiOptions: AIOptions | undefined, projectRootPath: string): Promise<void>;
/**
 * 处理 AI 模型信息请求
 */
export declare function handleAIModelRequest(res: http.ServerResponse, corsHeaders: Record<string, string>, aiOptions: AIOptions | undefined): Promise<void>;
