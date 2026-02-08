/**
 * Chat 模块 - 客户端聊天功能相关类型、模板和样式
 */
import { TemplateResult } from 'lit';
/**
 * 设置项目根路径（用于将绝对路径转为相对路径）
 */
export declare function setProjectRoot(root: string): void;
/**
 * 工具调用信息
 */
export interface ToolCall {
    id: string;
    name: string;
    input?: Record<string, any>;
    result?: string;
    isError?: boolean;
    isComplete?: boolean;
}
/**
 * 消息内容块
 */
export interface ContentBlock {
    type: 'text' | 'tool';
    content?: string;
    tool?: ToolCall;
}
/**
 * 聊天消息类型
 */
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    blocks?: ContentBlock[];
}
/**
 * 聊天上下文信息（当前选中的元素）
 */
export interface ChatContext {
    file: string;
    line: number;
    column: number;
    name: string;
}
/**
 * 聊天状态接口
 */
export interface ChatState {
    showChatModal: boolean;
    chatMessages: ChatMessage[];
    chatInput: string;
    chatLoading: boolean;
    chatContext: ChatContext | null;
    currentTools: Map<string, ToolCall>;
    chatTheme: 'light' | 'dark';
    turnStatus: 'idle' | 'running' | 'done' | 'interrupt';
    turnDuration: number;
    isDragging: boolean;
    chatModel: string;
}
/**
 * 聊天功能处理器接口
 */
export interface ChatHandlers {
    closeChatModal: () => void;
    clearChatMessages: () => void;
    handleChatInput: (e: Event) => void;
    handleChatKeyDown: (e: KeyboardEvent) => void;
    sendChatMessage: () => void;
    toggleTheme: () => void;
    interruptChat: () => void;
    handleDragStart: (e: MouseEvent) => void;
    handleDragMove: (e: MouseEvent) => void;
    handleDragEnd: () => void;
    handleOverlayClick: () => void;
}
/**
 * 更新聊天框位置（使用 floating-ui）
 * @param referenceEl 参考元素（选中的 DOM 元素）
 * @param floatingEl 浮动元素（聊天框）
 * @returns cleanup 函数
 */
export declare function updateChatModalPosition(referenceEl: HTMLElement | null, floatingEl: HTMLElement | null): (() => void) | null;
/**
 * 渲染聊天框模板
 */
export declare function renderChatModal(state: ChatState, handlers: ChatHandlers): TemplateResult;
/**
 * 聊天框样式 - 命令行风格
 */
export declare const chatStyles: import("lit").CSSResult;
/**
 * 流式事件处理器
 */
export interface StreamHandlers {
    onText: (content: string) => void;
    onToolStart: (toolId: string, toolName: string, index: number) => void;
    onToolInput: (index: number, input: Record<string, any>) => void;
    onToolResult: (toolUseId: string, content: string, isError?: boolean) => void;
    onError: (error: Error) => void;
    onSessionId?: (sessionId: string) => void;
    onProjectRoot?: (cwd: string) => void;
    onModel?: (model: string) => void;
}
/**
 * 获取 AI 模型信息
 */
export declare function fetchModelInfo(ip: string, port: number): Promise<string>;
/**
 * 发送聊天消息到服务器
 */
export declare function sendChatToServer(ip: string, port: number, message: string, context: ChatContext | null, history: ChatMessage[], handlers: StreamHandlers, signal?: AbortSignal, sessionId?: string | null): Promise<void>;
