/**
 * AI 对话状态持久化 - 使用 sessionStorage 在页面刷新后恢复弹窗
 */
import type { ChatMessage, ChatContext, ChatProvider } from './ai';
/**
 * 持久化的 AI 状态
 */
export interface PersistedAIState {
    showChatModal: boolean;
    chatMessages: ChatMessage[];
    chatContext: ChatContext | null;
    chatSessionId: string | null;
    chatTheme: 'light' | 'dark';
    chatModel: string;
    chatProvider: ChatProvider | null;
    availableAIProviders: ChatProvider[];
    modalPosition: {
        left: string;
        top: string;
    } | null;
    turnStatus: 'idle' | 'running' | 'done' | 'interrupt';
}
/**
 * 保存 AI 状态到 sessionStorage
 */
export declare function saveAIState(state: PersistedAIState): void;
/**
 * 从 sessionStorage 恢复 AI 状态
 */
export declare function loadAIState(): PersistedAIState | null;
/**
 * 清除 sessionStorage 中的 AI 状态
 */
export declare function clearAIState(): void;
