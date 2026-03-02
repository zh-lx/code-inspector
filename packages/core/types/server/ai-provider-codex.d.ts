import type { CodexOptions } from '../shared';
import type { AIContext, AIMessage } from './ai';
import type { ProviderCallbacks, ProviderResult } from './ai-provider-claude';
/**
 * 获取模型信息
 * 优先使用用户配置（Codex 暂不通过额外请求探测模型）
 */
export declare function getModelInfo(codexOptions: CodexOptions | undefined): Promise<string>;
/**
 * Codex provider 统一入口（仅 CLI）
 */
export declare function handleCodexRequest(message: string, context: AIContext | null, history: AIMessage[], sessionId: string | undefined, cwd: string, codexOptions: CodexOptions | undefined, callbacks: ProviderCallbacks): ProviderResult;
