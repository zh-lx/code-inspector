/**
 * AI 模块 - 客户端 AI 聊天功能相关类型、模板和样式
 */
import { TemplateResult } from 'lit';
/**
 * 设置项目根路径（用于将绝对路径转为相对路径）
 */
export declare function setProjectRoot(root: string): void;
/**
 * 将绝对路径转为相对于项目根路径的路径
 */
declare function toRelativePath(filePath: string): string;
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
    modelContent?: string;
    blocks?: ContentBlock[];
    context?: ChatContext | null;
    images?: ChatImageAttachment[];
}
export interface ChatHistoryMessage {
    role: 'user' | 'assistant';
    content: string;
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
export interface ChatImageAttachment {
    id: string;
    name: string;
    type: string;
    size: number;
    previewUrl: string;
}
export type ChatProvider = 'claudeCode' | 'codex' | 'opencode';
export interface AIModelInfo {
    model: string;
    models: string[];
    provider: ChatProvider | null;
    providers: ChatProvider[];
}
/**
 * 对话历史条目
 */
export interface HistoryEntry {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    provider: string | null;
    messageCount: number;
}
/**
 * 完整对话数据
 */
export interface ConversationData {
    messages: ChatMessage[];
    context: ChatContext | null;
    sessionId: string | null;
    provider: ChatProvider | null;
    model: string;
    revertedToolIds: string[];
}
/**
 * 聊天状态接口
 */
export interface ChatState {
    showChatModal: boolean;
    showCloseConfirm: boolean;
    chatMessages: ChatMessage[];
    chatInput: string;
    chatPastedImages: ChatImageAttachment[];
    chatImageProcessing: boolean;
    chatLoading: boolean;
    chatContext: ChatContext | null;
    currentTools: Map<string, ToolCall>;
    chatTheme: 'light' | 'dark';
    turnStatus: 'idle' | 'running' | 'done' | 'interrupt';
    turnDuration: number;
    isDragging: boolean;
    chatModel: string;
    availableModels: string[];
    chatProvider: ChatProvider | null;
    availableProviders: ChatProvider[];
    showProviderMenu: boolean;
    showModelMenu: boolean;
    revertedToolIds: Set<string>;
    revertingToolIds: Set<string>;
    conversationId: string | null;
    showHistoryPanel: boolean;
    historyList: HistoryEntry[];
    historyLoading: boolean;
}
/**
 * 聊天功能处理器接口
 */
export interface ChatHandlers {
    closeChatModal: () => void;
    confirmCloseChatModal: () => void;
    cancelCloseChatModal: () => void;
    terminateAndCloseChatModal: () => void;
    clearChatMessages: () => void;
    handleChatInput: (e: Event) => void;
    handleChatKeyDown: (e: KeyboardEvent) => void;
    handleChatPaste: (e: ClipboardEvent) => void;
    removePastedImage: (id: string) => void;
    sendChatMessage: () => void;
    toggleTheme: () => void;
    interruptChat: () => void;
    toggleModelMenu: () => void;
    switchModel: (model: string) => void;
    toggleProviderMenu: () => void;
    switchProvider: (provider: ChatProvider) => void;
    handleDragStart: (e: MouseEvent) => void;
    handleDragMove: (e: MouseEvent) => void;
    handleDragEnd: () => void;
    handleModalClick: (e: MouseEvent) => void;
    handleOverlayClick: () => void;
    revertEdit: (tool: ToolCall) => void;
    revertAllEdits: () => void;
    toggleHistoryPanel: () => void;
    loadConversation: (id: string) => void;
    deleteConversation: (id: string) => void;
    startNewConversation: () => void;
}
/**
 * 更新聊天框位置（使用 floating-ui）
 * @param referenceEl 参考元素（选中的 DOM 元素）
 * @param floatingEl 浮动元素（聊天框）
 * @returns cleanup 函数
 */
export declare function updateChatModalPosition(referenceEl: HTMLElement | null, floatingEl: HTMLElement | null): (() => void) | null;
/**
 * 格式化持续时间为 x m xx s 格式
 */
declare function formatDuration(seconds: number): string;
/**
 * 渲染 Markdown 内容为 HTML
 */
declare function renderMarkdown(content: string): string;
declare function isCodexTool(tool: ToolCall): boolean;
/**
 * 规范化工具名称（不同 provider 可能使用不同大小写，如 OpenCode 用小写 "read"）
 */
declare function canonicalToolName(name: string): string;
declare function formatProviderName(provider: ChatProvider): string;
declare function getChangePath(input: Record<string, any>): string;
declare function getCodexDisplayInfo(tool: ToolCall): {
    name: string;
    summary: string;
};
/**
 * 获取工具显示名称和参数摘要
 */
declare function getToolDisplayInfo(tool: ToolCall): {
    name: string;
    summary: string;
};
/**
 * 从工具结果中提取路径和纯文本内容（处理 JSON 数组格式和 XML 包装）
 */
declare function extractReadContent(raw: string): {
    path: string;
    content: string;
};
declare function formatToolResult(result: string, toolName: string): string;
/**
 * 渲染 Read 工具的代码预览（CLI 风格）
 */
declare function renderReadResult(tool: ToolCall): TemplateResult;
/**
 * 渲染 Edit 工具的 diff 视图（红绿对比）
 */
declare function renderEditDiff(tool: ToolCall): TemplateResult;
/**
 * 渲染单个工具调用（CLI 扁平内联风格）
 */
declare function renderToolCall(tool: ToolCall, state?: ChatState, handlers?: ChatHandlers): TemplateResult;
/**
 * 渲染消息内容（连续终端流式风格）
 */
declare function renderMessageContent(msg: ChatMessage, state?: ChatState, handlers?: ChatHandlers): TemplateResult;
declare function renderMessageContext(msg: ChatMessage): TemplateResult;
/**
 * 收集所有可回退的 Edit 工具调用
 */
export declare function collectRevertableTools(state: ChatState): ToolCall[];
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
    onToolInput: (index: number, input: Record<string, any>, toolUseId?: string) => void;
    onToolResult: (toolUseId: string, content: string, isError?: boolean) => void;
    onError: (error: Error) => void;
    onSessionId?: (sessionId: string) => void;
    onProjectRoot?: (cwd: string) => void;
    onModel?: (model: string) => void;
}
declare function normalizeChatProvider(provider: unknown): ChatProvider | null;
/**
 * 获取 AI 模型信息
 */
export declare function fetchModelInfo(ip: string, port: number, provider?: ChatProvider | null): Promise<AIModelInfo>;
/**
 * Revert 请求结果
 */
export interface RevertResult {
    file_path: string;
    success: boolean;
    error?: string;
}
/**
 * 发送 revert 请求到服务器
 */
export declare function revertEdit(ip: string, port: number, edits: Array<{
    file_path: string;
    old_string: string;
    new_string: string;
}>): Promise<RevertResult[]>;
/**
 * 获取对话历史列表
 */
export declare function fetchHistoryList(ip: string, port: number): Promise<HistoryEntry[]>;
/**
 * 保存对话到服务端
 */
export declare function saveConversation(ip: string, port: number, data: {
    id?: string | null;
    messages: ChatMessage[];
    context: ChatContext | null;
    sessionId: string | null;
    provider: ChatProvider | null;
    model: string;
    revertedToolIds: string[];
}): Promise<{
    id: string;
    success: boolean;
}>;
/**
 * 加载对话历史
 */
export declare function loadConversationData(ip: string, port: number, id: string): Promise<ConversationData | null>;
/**
 * 删除对话历史
 */
export declare function deleteConversationData(ip: string, port: number, id: string): Promise<boolean>;
/**
 * 发送聊天消息到服务器
 */
export declare function sendChatToServer(ip: string, port: number, message: string, context: ChatContext | null, history: ChatHistoryMessage[] | undefined, handlers: StreamHandlers, signal?: AbortSignal, sessionId?: string | null, provider?: ChatProvider | null, model?: string | null): Promise<void>;
export declare const __TEST_ONLY__: {
    toRelativePath: typeof toRelativePath;
    formatDuration: typeof formatDuration;
    renderMarkdown: typeof renderMarkdown;
    isCodexTool: typeof isCodexTool;
    canonicalToolName: typeof canonicalToolName;
    formatProviderName: typeof formatProviderName;
    getChangePath: typeof getChangePath;
    getCodexDisplayInfo: typeof getCodexDisplayInfo;
    getToolDisplayInfo: typeof getToolDisplayInfo;
    extractReadContent: typeof extractReadContent;
    formatToolResult: typeof formatToolResult;
    renderReadResult: typeof renderReadResult;
    renderEditDiff: typeof renderEditDiff;
    renderToolCall: typeof renderToolCall;
    renderMessageContent: typeof renderMessageContent;
    renderMessageContext: typeof renderMessageContext;
    normalizeChatProvider: typeof normalizeChatProvider;
};
export {};
