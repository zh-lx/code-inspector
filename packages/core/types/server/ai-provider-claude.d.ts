import type { AIOptions } from '../shared';
import type { AIContext, AIMessage } from './ai';
export interface ProviderCallbacks {
    sendSSE: (data: object | string) => void;
    onEnd: () => void;
}
export interface ProviderResult {
    abort: () => void;
}
/**
 * 获取模型信息
 * 优先使用用户配置，否则从本地 Claude Code CLI 配置中读取
 */
export declare function getModelInfo(aiOptions: AIOptions | undefined): string;
/**
 * Claude provider 统一入口
 * ai.ts 只需调用此函数，不感知 CLI/SDK 细节
 */
export declare function handleClaudeRequest(message: string, context: AIContext | null, history: AIMessage[], sessionId: string | undefined, cwd: string, aiOptions: AIOptions | undefined, callbacks: ProviderCallbacks): ProviderResult;
