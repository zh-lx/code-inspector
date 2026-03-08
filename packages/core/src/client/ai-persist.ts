/**
 * AI 对话状态持久化 - 使用 sessionStorage 在页面刷新后恢复弹窗
 */
import type { ChatMessage, ChatContext, ChatProvider } from './ai';

const STORAGE_KEY = '__code_inspector_ai_state__';

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
  availableAIModels: string[];
  chatProvider: ChatProvider | null;
  availableAIProviders: ChatProvider[];
  modalPosition: { left: string; top: string } | null;
  turnStatus: 'idle' | 'running' | 'done' | 'interrupt';
}

/**
 * 保存 AI 状态到 sessionStorage
 */
export function saveAIState(state: PersistedAIState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储满或不可用，静默失败
  }
}

/**
 * 从 sessionStorage 恢复 AI 状态
 */
export function loadAIState(): PersistedAIState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 清除 sessionStorage 中的 AI 状态
 */
export function clearAIState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 静默
  }
}

