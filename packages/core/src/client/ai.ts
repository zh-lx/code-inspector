/**
 * Chat 模块 - 客户端聊天功能相关类型、模板和样式
 */
import { html, css, TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { computePosition, flip, shift, offset, autoUpdate, Placement } from '@floating-ui/dom';
import { marked } from 'marked';

/** 项目根路径，由服务端 SSE info 事件传入 */
let _projectRoot = '';

/**
 * 设置项目根路径（用于将绝对路径转为相对路径）
 */
export function setProjectRoot(root: string): void {
  _projectRoot = root;
}

/**
 * 将绝对路径转为相对于项目根路径的路径
 */
function toRelativePath(filePath: string): string {
  if (!_projectRoot || !filePath) return filePath;
  // 确保 projectRoot 以 / 结尾
  const root = _projectRoot.endsWith('/') ? _projectRoot : _projectRoot + '/';
  if (filePath.startsWith(root)) {
    return filePath.slice(root.length);
  }
  return filePath;
}

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
  turnDuration: number; // 持续时间（秒）
  isDragging: boolean;
  chatModel: string; // 当前使用的模型名称
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
 * 弹出方向优先级（用户指定）
 * right-top > left-top > right-bottom > left-bottom > bottom-right > top-right > bottom-left > top-left > right-center > left-center > bottom-center > top-center
 */
const FALLBACK_PLACEMENTS: Placement[] = [
  'right-start',   // right-top
  'left-start',    // left-top
  'right-end',     // right-bottom
  'left-end',      // left-bottom
  'bottom-end',    // bottom-right
  'top-end',       // top-right
  'bottom-start',  // bottom-left
  'top-start',     // top-left
  'right',         // right-center
  'left',          // left-center
  'bottom',        // bottom-center
  'top',           // top-center
];

/** 边距 */
const MARGIN = 16;

/**
 * 更新聊天框位置（使用 floating-ui）
 * @param referenceEl 参考元素（选中的 DOM 元素）
 * @param floatingEl 浮动元素（聊天框）
 * @returns cleanup 函数
 */
export function updateChatModalPosition(
  referenceEl: HTMLElement | null,
  floatingEl: HTMLElement | null
): (() => void) | null {
  if (!referenceEl || !floatingEl) {
    return null;
  }

  const updatePosition = async () => {
    const result = await computePosition(referenceEl, floatingEl, {
      strategy: 'fixed',
      placement: 'right-start', // 默认位置
      middleware: [
        offset(MARGIN),
        flip({
          fallbackPlacements: FALLBACK_PLACEMENTS.slice(1), // 排除第一个（默认位置）
          padding: MARGIN,
        }),
        shift({
          padding: MARGIN,
        }),
      ],
    });

    const { x, y } = result;

    // 获取视口尺寸
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    // 获取浮动元素尺寸
    const floatingRect = floatingEl.getBoundingClientRect();
    const floatingWidth = floatingRect.width;
    const floatingHeight = floatingRect.height;

    // 获取参考元素位置
    const referenceRect = referenceEl.getBoundingClientRect();

    // 检查计算出的位置是否会导致溢出视口
    const wouldOverflowViewport =
      x < MARGIN ||
      y < MARGIN ||
      x + floatingWidth > viewportWidth - MARGIN ||
      y + floatingHeight > viewportHeight - MARGIN;

    // 检查是否与参考元素重叠
    const wouldOverlapReference =
      x < referenceRect.right &&
      x + floatingWidth > referenceRect.left &&
      y < referenceRect.bottom &&
      y + floatingHeight > referenceRect.top;

    // 如果溢出视口或与参考元素重叠，居中显示
    if (wouldOverflowViewport || wouldOverlapReference) {
      const centerX = (viewportWidth - floatingWidth) / 2;
      const centerY = (viewportHeight - floatingHeight) / 2;

      Object.assign(floatingEl.style, {
        left: `${Math.max(MARGIN, centerX)}px`,
        top: `${Math.max(MARGIN, centerY)}px`,
      });

      floatingEl.classList.add('chat-modal-centered');
    } else {
      Object.assign(floatingEl.style, {
        left: `${x}px`,
        top: `${y}px`,
      });

      floatingEl.classList.remove('chat-modal-centered');
    }
  };

  // 初始更新
  updatePosition();

  // 设置自动更新（滚动、resize 等情况）
  const cleanup = autoUpdate(referenceEl, floatingEl, updatePosition, {
    ancestorScroll: true,
    ancestorResize: true,
    elementResize: true,
  });

  return cleanup;
}

/**
 * 配置 marked 解析器
 */
marked.setOptions({
  breaks: true, // 支持 GFM 换行
  gfm: true, // 启用 GitHub Flavored Markdown
});

/**
 * 格式化持续时间为 x m xx s 格式
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${secs}s`;
}

/**
 * 渲染 Markdown 内容为 HTML
 */
function renderMarkdown(content: string): string {
  try {
    // 使用 marked 解析 Markdown
    const html = marked.parse(content) as string;
    return html;
  } catch {
    // 解析失败时返回原始文本（转义 HTML）
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }
}

/**
 * 获取工具显示名称和参数摘要（对齐 Claude CLI 风格）
 */
function getToolDisplayInfo(tool: ToolCall): { name: string; summary: string } {
  const name = tool.name;
  const input = tool.input || {};

  switch (name) {
    case 'Read':
      return { name: 'Read', summary: toRelativePath(input.file_path || '') };
    case 'Write':
      return { name: 'Write', summary: toRelativePath(input.file_path || '') };
    case 'Edit':
      return { name: 'Update', summary: toRelativePath(input.file_path || '') };
    case 'Glob':
      return { name: 'List', summary: input.pattern || '' };
    case 'Grep':
      return { name: 'Search', summary: input.pattern || '' };
    case 'Bash':
      return { name: 'Bash', summary: input.command || '' };
    case 'WebFetch':
      return { name: 'Fetch', summary: input.url || '' };
    case 'WebSearch':
      return { name: 'Search', summary: input.query || '' };
    default:
      return { name, summary: '' };
  }
}

/**
 * 格式化工具结果摘要
 */
function formatToolResult(result: string, toolName: string): string {
  if (!result) return '';

  const maxLength = 300;
  let summary = result.trim();

  if (toolName === 'Write') {
    const lines = summary.split('\n').length;
    return `Wrote ${lines} lines`;
  }

  if (toolName === 'Read') {
    const lines = summary.split('\n').length;
    if (lines > 5) {
      return `${lines} lines`;
    }
  }

  if (summary.length > maxLength) {
    summary = summary.slice(0, maxLength) + '...';
  }

  return summary;
}

/**
 * 渲染 Edit 工具的 diff 视图（红绿对比）
 */
function renderEditDiff(tool: ToolCall): TemplateResult {
  const input = tool.input || {};
  const oldStr: string = input.old_string || '';
  const newStr: string = input.new_string || '';

  if (!oldStr && !newStr) {
    return html``;
  }

  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');

  return html`
    <div class="diff-view">
      ${oldLines.map((line: string) => html`<div class="diff-line diff-del">- ${line}</div>`)}
      ${newLines.map((line: string) => html`<div class="diff-line diff-add">+ ${line}</div>`)}
    </div>
  `;
}

/**
 * 渲染单个工具调用（CLI 扁平内联风格）
 */
function renderToolCall(tool: ToolCall): TemplateResult {
  const { name, summary } = getToolDisplayInfo(tool);
  const isComplete = tool.isComplete;
  const hasResult = tool.result !== undefined;
  const isEdit = tool.name === 'Edit';
  const hasEditInput = isEdit && tool.input && (tool.input.old_string || tool.input.new_string);

  return html`
    <div class="tool-call-inline">
      <div class="tool-header-inline">
        <span class="tool-bullet ${isComplete ? 'tool-bullet-complete' : 'tool-bullet-running'}">●</span>
        <span class="tool-name-inline">${name}</span>
        ${summary ? html`<span class="tool-summary-inline">${summary}</span>` : ''}
      </div>
      ${hasEditInput
        ? html`<div class="tool-diff-wrapper">
            <span class="tool-result-bracket">⎿</span>
            ${renderEditDiff(tool)}
          </div>`
        : hasResult
          ? html`<div class="tool-result-inline">
              <span class="tool-result-bracket">⎿</span>
              <span class="tool-result-text ${tool.isError ? 'tool-error-text' : ''}"
                >${formatToolResult(tool.result!, tool.name)}</span
              >
            </div>`
          : ''}
    </div>
  `;
}

/**
 * 渲染消息内容（连续终端流式风格）
 */
function renderMessageContent(msg: ChatMessage): TemplateResult {
  const isAssistant = msg.role === 'assistant';

  // 如果有 blocks，按块渲染
  if (msg.blocks && msg.blocks.length > 0) {
    return html`
      ${msg.blocks.map((block) => {
        if (block.type === 'text' && block.content) {
          if (isAssistant) {
            return html`<div class="chat-text-inline chat-markdown">${unsafeHTML(renderMarkdown(block.content))}</div>`;
          }
          return html`<div class="chat-text-inline">${block.content}</div>`;
        } else if (block.type === 'tool' && block.tool) {
          return renderToolCall(block.tool);
        }
        return html``;
      })}
    `;
  }

  // 否则只渲染文本内容
  if (isAssistant && msg.content) {
    return html`<div class="chat-text-inline chat-markdown">${unsafeHTML(renderMarkdown(msg.content))}</div>`;
  }
  return html`<div class="chat-text-inline">${msg.content}</div>`;
}

/**
 * 渲染聊天框模板
 */
export function renderChatModal(
  state: ChatState,
  handlers: ChatHandlers
): TemplateResult {
  if (!state.showChatModal) {
    return html``;
  }

  return html`
    <div
      class="chat-modal-overlay"
      @click="${handlers.handleOverlayClick}"
      @mousemove="${handlers.handleDragMove}"
      @mouseup="${handlers.handleDragEnd}"
    >
      <div
        class="chat-modal chat-modal-floating ${state.isDragging ? 'dragging' : ''}"
        id="chat-modal-floating"
        @click="${(e: MouseEvent) => e.stopPropagation()}"
      >
        <div class="chat-modal-header" @mousedown="${handlers.handleDragStart}">
          <div class="chat-modal-title-wrapper">
            <div class="chat-modal-title-row">
              <h3 class="chat-modal-title">AI Assistant</h3>
              ${state.chatModel
                ? html`<span class="chat-model-badge">${state.chatModel}</span>`
                : ''}
            </div>
            ${state.chatContext
              ? html`<span class="chat-context-info"
                  >&lt;${state.chatContext.name}&gt; ${state.chatContext.file}:${state.chatContext.line}</span
                >`
              : ''}
          </div>
          <div class="chat-modal-actions">
            <button
              class="chat-modal-theme"
              @click="${handlers.toggleTheme}"
              title="${state.chatTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}"
            >
              ${state.chatTheme === 'dark'
                ? html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>`
                : html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>`}
            </button>
            <button
              class="chat-modal-clear"
              @click="${handlers.clearChatMessages}"
              title="Clear"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
            <button
              class="chat-modal-close"
              @click="${handlers.closeChatModal}"
              title="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div class="chat-modal-content">
          ${state.chatMessages.length === 0
            ? html`<div class="chat-empty">
                <span class="chat-empty-prompt">❯</span>
                <span class="chat-empty-text">Ask me anything about this code...</span>
              </div>`
            : state.chatMessages.map(
                (msg) => html`
                  <div class="chat-line chat-line-${msg.role}">
                    ${msg.role === 'user'
                      ? html`<span class="chat-prompt">❯</span>`
                      : html`<span class="chat-indent"></span>`}
                    <div class="chat-message-content">
                      ${renderMessageContent(msg)}
                    </div>
                  </div>
                `
              )}
          ${state.chatLoading &&
          (!state.chatMessages.length ||
            state.chatMessages[state.chatMessages.length - 1]?.role === 'user')
            ? html`<div class="chat-loading">
                <span class="chat-indent"></span>
                <span class="chat-cursor"></span>
              </div>`
            : ''}
        </div>
        ${state.turnStatus !== 'idle'
          ? html`<div class="chat-status-bar">
              <div class="chat-status-info">
                <span class="chat-status-icon ${state.turnStatus}">
                  ${state.turnStatus === 'running'
                    ? '●'
                    : state.turnStatus === 'done'
                      ? '✓'
                      : '■'}
                </span>
                <span class="chat-status-text">
                  ${state.turnStatus === 'running'
                    ? 'Running'
                    : state.turnStatus === 'done'
                      ? 'Done'
                      : 'Interrupt'}
                </span>
                <span class="chat-status-duration">· ${formatDuration(state.turnDuration)}</span>
              </div>
              ${state.turnStatus === 'running'
                ? html`<button
                    class="chat-interrupt-btn"
                    @click="${handlers.interruptChat}"
                    title="Interrupt"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="1" />
                    </svg>
                  </button>`
                : ''}
            </div>`
          : ''}
        <div class="chat-modal-footer">
          <span class="chat-input-prompt">❯</span>
          <textarea
            class="chat-input"
            placeholder="Enter your message..."
            .value="${state.chatInput}"
            @input="${handlers.handleChatInput}"
            @keydown="${handlers.handleChatKeyDown}"
            ?disabled="${state.chatLoading}"
            rows="2"
          ></textarea>
          <button
            class="chat-send-btn"
            @click="${handlers.sendChatMessage}"
            ?disabled="${state.chatLoading || !state.chatInput.trim()}"
            title="Send (Enter)"
          >
            ${state.chatLoading
              ? html`<svg
                  class="chat-send-loading"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="3"
                    fill="none"
                    stroke-dasharray="31.4"
                    stroke-linecap="round"
                  />
                </svg>`
              : html`<svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>`}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 聊天框样式 - 命令行风格
 */
export const chatStyles = css`
  /* 暗色主题变量（默认） */
  :host {
    --chat-bg: #1e1e1e;
    --chat-header-bg: #252526;
    --chat-border: #333;
    --chat-text: #d4d4d4;
    --chat-text-secondary: #ccc;
    --chat-text-muted: #aaa;
    --chat-text-placeholder: #888;
    --chat-accent: #569cd6;
    --chat-accent-hover: #6cb6ff;
    --chat-overlay: rgba(0, 0, 0, 0.3);
    --chat-shadow: rgba(0, 0, 0, 0.4);
    --chat-code-bg: #2d2d2d;
    --chat-code-text: #ce9178;
    --chat-pre-bg: #1a1a1a;
    --chat-pre-text: #d4d4d4;
    --chat-prompt-ai: #c586c0;
    --chat-tool-bg: #252526;
    --chat-tool-border: #555;
    --chat-tool-complete: #4ec9b0;
    --chat-tool-name: #dcdcaa;
    --chat-tool-result: #9cdcfe;
    --chat-tool-error: #f48771;
    --chat-tool-prefix: #555;
    --chat-scrollbar-track: #1e1e1e;
    --chat-scrollbar-thumb: #424242;
    --chat-scrollbar-hover: #555;
    --chat-heading: #e0e0e0;
    --chat-strong: #e0e0e0;
    --chat-em: #b5b5b5;
    --chat-del: #888;
    --chat-blockquote-bg: #252526;
    --chat-blockquote-text: #aaa;
    --chat-table-header-bg: #252526;
    --chat-table-alt-bg: #1a1a1a;
    --chat-input-bg: #1e1e1e;
    --chat-btn-text: #1e1e1e;
    --chat-ai-text: #9cdcfe;
    --chat-user-text: #d4d4d4;
    --chat-hover-bg: #333;
    --chat-diff-add-bg: rgba(35, 134, 54, 0.15);
    --chat-diff-add-text: #4ec9b0;
    --chat-diff-del-bg: rgba(218, 54, 51, 0.15);
    --chat-diff-del-text: #f48771;
  }

  /* 亮色主题变量 */
  :host(.chat-theme-light) {
    --chat-bg: #ffffff;
    --chat-header-bg: #f5f5f5;
    --chat-border: #e0e0e0;
    --chat-text: #333333;
    --chat-text-secondary: #555555;
    --chat-text-muted: #666;
    --chat-text-placeholder: #aaaaaa;
    --chat-accent: #0969da;
    --chat-accent-hover: #0550ae;
    --chat-overlay: rgba(0, 0, 0, 0.15);
    --chat-shadow: rgba(0, 0, 0, 0.12);
    --chat-code-bg: #eff1f3;
    --chat-code-text: #d73e1d;
    --chat-pre-bg: #f6f8fa;
    --chat-pre-text: #333333;
    --chat-prompt-ai: #8250df;
    --chat-tool-bg: #f5f5f5;
    --chat-tool-border: #d0d0d0;
    --chat-tool-complete: #1a7f37;
    --chat-tool-name: #953800;
    --chat-tool-result: #0550ae;
    --chat-tool-error: #cf222e;
    --chat-tool-prefix: #bbb;
    --chat-scrollbar-track: #ffffff;
    --chat-scrollbar-thumb: #c8c8c8;
    --chat-scrollbar-hover: #a0a0a0;
    --chat-heading: #1f2328;
    --chat-strong: #1f2328;
    --chat-em: #555555;
    --chat-del: #aaaaaa;
    --chat-blockquote-bg: #f5f5f5;
    --chat-blockquote-text: #666666;
    --chat-table-header-bg: #f5f5f5;
    --chat-table-alt-bg: #f6f8fa;
    --chat-input-bg: #ffffff;
    --chat-btn-text: #ffffff;
    --chat-ai-text: #0550ae;
    --chat-user-text: #333333;
    --chat-hover-bg: #e8e8e8;
    --chat-diff-add-bg: rgba(35, 134, 54, 0.1);
    --chat-diff-add-text: #1a7f37;
    --chat-diff-del-bg: rgba(218, 54, 51, 0.1);
    --chat-diff-del-text: #cf222e;
  }

  /* 聊天框样式 */
  .chat-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--chat-overlay);
    z-index: 99999999999999999;
    animation: fadeIn 0.2s ease-out;
  }

  .chat-modal {
    background: var(--chat-bg);
    border-radius: 8px;
    box-shadow: 0 8px 32px var(--chat-shadow);
    width: 90%;
    max-width: 600px;
    height: 70vh;
    max-height: 700px;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease-out;
    overflow: hidden;
    border: 1px solid var(--chat-border);
  }

  .chat-modal-floating {
    position: fixed;
    top: 0;
    left: 0;
    width: 480px;
    min-width: 360px;
    min-height: 280px;
    max-height: min(520px, calc(100vh - 32px));
    height: auto;
    animation: slideIn 0.3s ease-out;
  }

  .chat-modal-centered {
    animation: fadeInScale 0.3s ease-out;
  }

  @keyframes fadeInScale {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .chat-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--chat-header-bg);
    border-bottom: 1px solid var(--chat-border);
    cursor: move;
    user-select: none;
  }

  .chat-modal.dragging {
    transition: none;
    user-select: none;
  }

  .chat-modal.dragging .chat-modal-content,
  .chat-modal.dragging .chat-modal-footer {
    pointer-events: none;
  }

  .chat-modal-title-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .chat-modal-title {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--chat-text-secondary);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .chat-modal-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .chat-model-badge {
    font-size: 10px;
    color: var(--chat-text-muted);
    background: var(--chat-border);
    padding: 1px 6px;
    border-radius: 3px;
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    white-space: nowrap;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-context-info {
    font-size: 11px;
    color: var(--chat-text-muted);
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-modal-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .chat-modal-theme,
  .chat-modal-clear {
    background: transparent;
    border: none;
    color: var(--chat-text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .chat-modal-theme:hover,
  .chat-modal-clear:hover {
    background: var(--chat-hover-bg);
    color: var(--chat-text-secondary);
  }

  .chat-modal-close {
    background: transparent;
    border: none;
    color: var(--chat-text-muted);
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.15s;
  }

  .chat-modal-close:hover {
    background: var(--chat-hover-bg);
    color: var(--chat-text-secondary);
  }

  .chat-modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 0;
    min-height: 0;
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.5;
    background: var(--chat-bg);
  }

  .chat-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--chat-text-placeholder);
  }

  .chat-empty-prompt {
    color: var(--chat-accent);
    font-weight: 600;
  }

  .chat-empty-text {
    color: var(--chat-text-placeholder);
    font-style: italic;
  }

  /* 终端风格连续消息流 */
  .chat-line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    word-break: break-word;
  }

  .chat-line-user {
    color: var(--chat-user-text);
    margin-top: 12px;
  }

  .chat-line-user:first-child {
    margin-top: 0;
  }

  .chat-line-assistant {
    color: var(--chat-ai-text);
    margin-top: 2px;
  }

  .chat-prompt {
    color: var(--chat-accent);
    font-weight: 600;
    flex-shrink: 0;
    user-select: none;
  }

  .chat-indent {
    display: inline-block;
    width: 10px;
    flex-shrink: 0;
  }

  .chat-message-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .chat-text-inline {
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Markdown 渲染样式 */
  .chat-markdown {
    white-space: normal;
  }

  .chat-markdown p {
    margin: 0 0 8px 0;
  }

  .chat-markdown p:last-child {
    margin-bottom: 0;
  }

  .chat-markdown h1,
  .chat-markdown h2,
  .chat-markdown h3,
  .chat-markdown h4,
  .chat-markdown h5,
  .chat-markdown h6 {
    margin: 12px 0 8px 0;
    font-weight: 600;
    line-height: 1.3;
    color: var(--chat-heading);
  }

  .chat-markdown h1 { font-size: 1.4em; }
  .chat-markdown h2 { font-size: 1.25em; }
  .chat-markdown h3 { font-size: 1.1em; }
  .chat-markdown h4,
  .chat-markdown h5,
  .chat-markdown h6 { font-size: 1em; }

  .chat-markdown code {
    background: var(--chat-code-bg);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9em;
    color: var(--chat-code-text);
  }

  .chat-markdown pre {
    background: var(--chat-pre-bg);
    border: 1px solid var(--chat-border);
    border-radius: 6px;
    padding: 12px;
    margin: 8px 0;
    overflow-x: auto;
  }

  .chat-markdown pre code {
    background: transparent;
    padding: 0;
    color: var(--chat-pre-text);
    font-size: 12px;
    line-height: 1.5;
  }

  .chat-markdown ul,
  .chat-markdown ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  .chat-markdown li {
    margin: 4px 0;
  }

  .chat-markdown li > ul,
  .chat-markdown li > ol {
    margin: 4px 0;
  }

  .chat-markdown blockquote {
    margin: 8px 0;
    padding: 8px 12px;
    border-left: 3px solid var(--chat-accent);
    background: var(--chat-blockquote-bg);
    color: var(--chat-blockquote-text);
  }

  .chat-markdown blockquote p {
    margin: 0;
  }

  .chat-markdown a {
    color: var(--chat-accent);
    text-decoration: none;
  }

  .chat-markdown a:hover {
    text-decoration: underline;
  }

  .chat-markdown hr {
    border: none;
    border-top: 1px solid var(--chat-border);
    margin: 12px 0;
  }

  .chat-markdown table {
    border-collapse: collapse;
    margin: 8px 0;
    width: 100%;
    font-size: 12px;
  }

  .chat-markdown th,
  .chat-markdown td {
    border: 1px solid var(--chat-border);
    padding: 6px 10px;
    text-align: left;
  }

  .chat-markdown th {
    background: var(--chat-table-header-bg);
    font-weight: 600;
  }

  .chat-markdown tr:nth-child(even) {
    background: var(--chat-table-alt-bg);
  }

  .chat-markdown strong {
    font-weight: 600;
    color: var(--chat-strong);
  }

  .chat-markdown em {
    font-style: italic;
    color: var(--chat-em);
  }

  .chat-markdown del {
    text-decoration: line-through;
    color: var(--chat-del);
  }

  .chat-line-user {
    color: var(--chat-user-text);
  }

  .chat-line-assistant {
    color: var(--chat-ai-text);
  }

  /* 加载状态 - 光标闪烁 */
  .chat-loading {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .chat-cursor {
    width: 8px;
    height: 16px;
    background: var(--chat-accent);
    animation: cursorBlink 1s step-end infinite;
  }

  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  /* 状态栏 */
  .chat-status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 14px;
    background: var(--chat-header-bg);
    border-top: 1px solid var(--chat-border);
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 11px;
  }

  .chat-status-info {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--chat-text-muted);
  }

  .chat-status-icon {
    font-size: 10px;
  }

  .chat-status-icon.running {
    color: var(--chat-accent);
    animation: statusPulse 1.5s ease-in-out infinite;
  }

  .chat-status-icon.done {
    color: var(--chat-tool-complete);
  }

  .chat-status-icon.interrupt {
    color: var(--chat-tool-error);
  }

  @keyframes statusPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .chat-status-text {
    color: var(--chat-text-muted);
  }

  .chat-status-duration {
    color: var(--chat-text-placeholder);
  }

  .chat-interrupt-btn {
    background: transparent;
    border: 1px solid var(--chat-border);
    color: var(--chat-text-muted);
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .chat-interrupt-btn:hover {
    background: var(--chat-hover-bg);
    color: var(--chat-tool-error);
    border-color: var(--chat-tool-error);
  }

  /* 底部输入区域 */
  .chat-modal-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-top: 1px solid var(--chat-border);
    background: var(--chat-header-bg);
  }

  .chat-input-prompt {
    color: var(--chat-accent);
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
    user-select: none;
  }

  .chat-input {
    flex: 1;
    background: var(--chat-input-bg);
    border: 1px solid var(--chat-border);
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 13px;
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    color: var(--chat-text);
    resize: none;
    line-height: 1.4;
    outline: none;
    transition: border-color 0.15s;
  }

  .chat-input::placeholder {
    color: var(--chat-text-placeholder);
  }

  .chat-input:focus {
    border-color: var(--chat-accent);
  }

  .chat-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .chat-send-btn {
    background: var(--chat-accent);
    border: none;
    border-radius: 4px;
    padding: 6px 10px;
    cursor: pointer;
    color: var(--chat-btn-text);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .chat-send-btn:hover:not(:disabled) {
    background: var(--chat-accent-hover);
  }

  .chat-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .chat-send-loading {
    animation: chatSendSpin 1s linear infinite;
  }

  @keyframes chatSendSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* CLI 扁平内联工具调用 */
  .tool-call-inline {
    margin: 4px 0;
    font-size: 13px;
    line-height: 1.5;
  }

  .tool-header-inline {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--chat-text-secondary);
  }

  .tool-bullet {
    font-size: 10px;
    flex-shrink: 0;
  }

  .tool-bullet-running {
    color: var(--chat-accent);
    animation: toolPulse 1.5s ease-in-out infinite;
  }

  .tool-bullet-complete {
    color: var(--chat-tool-complete);
  }

  @keyframes toolPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .tool-name-inline {
    color: var(--chat-tool-name);
    font-weight: 600;
  }

  .tool-summary-inline {
    color: var(--chat-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    direction: rtl;
    text-align: left;
  }

  .tool-result-inline {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding-left: 16px;
    margin-top: 2px;
  }

  .tool-result-bracket {
    color: var(--chat-tool-prefix);
    flex-shrink: 0;
    line-height: 1.4;
  }

  .tool-result-text {
    color: var(--chat-tool-result);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.4;
    font-size: 12px;
  }

  .tool-error-text {
    color: var(--chat-tool-error);
  }

  /* Diff 视图（Edit 工具红绿对比） */
  .tool-diff-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding-left: 16px;
    margin-top: 2px;
  }

  .tool-diff-wrapper > .tool-result-bracket {
    margin-top: 2px;
  }

  .diff-view {
    flex: 1;
    min-width: 0;
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    border-radius: 4px;
    overflow: hidden;
  }

  .diff-line {
    padding: 1px 8px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .diff-del {
    background: var(--chat-diff-del-bg);
    color: var(--chat-diff-del-text);
  }

  .diff-add {
    background: var(--chat-diff-add-bg);
    color: var(--chat-diff-add-text);
  }

  /* 滚动条样式 */
  .chat-modal-content::-webkit-scrollbar {
    width: 8px;
  }

  .chat-modal-content::-webkit-scrollbar-track {
    background: var(--chat-scrollbar-track);
  }

  .chat-modal-content::-webkit-scrollbar-thumb {
    background: var(--chat-scrollbar-thumb);
    border-radius: 4px;
  }

  .chat-modal-content::-webkit-scrollbar-thumb:hover {
    background: var(--chat-scrollbar-hover);
  }
`;

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
export async function fetchModelInfo(ip: string, port: number): Promise<string> {
  try {
    const response = await fetch(`http://${ip}:${port}/ai/model`);
    if (!response.ok) return '';
    const data = await response.json();
    return data.model || '';
  } catch {
    return '';
  }
}

/**
 * 发送聊天消息到服务器
 */
export async function sendChatToServer(
  ip: string,
  port: number,
  message: string,
  context: ChatContext | null,
  history: ChatMessage[],
  handlers: StreamHandlers,
  signal?: AbortSignal,
  sessionId?: string | null
): Promise<void> {
  const response = await fetch(`http://${ip}:${port}/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      context,
      history,
      ...(sessionId && { sessionId }),
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error('Chat request failed');
  }

  // 处理 SSE 流式响应
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (reader) {
    let sseBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() || ''; // 保留最后一个不完整的行

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);

            // 处理不同类型的事件
            switch (parsed.type) {
              case 'text':
                if (parsed.content) {
                  handlers.onText(parsed.content);
                }
                break;
              case 'tool_start':
                handlers.onToolStart(parsed.toolId, parsed.toolName, parsed.index);
                break;
              case 'tool_input':
                handlers.onToolInput(parsed.index, parsed.input);
                break;
              case 'tool_result':
                handlers.onToolResult(parsed.toolUseId, parsed.content, parsed.isError);
                break;
              case 'session':
                if (parsed.sessionId) {
                  handlers.onSessionId?.(parsed.sessionId);
                }
                break;
              case 'info':
                if (parsed.cwd) {
                  handlers.onProjectRoot?.(parsed.cwd);
                }
                if (parsed.model) {
                  handlers.onModel?.(parsed.model);
                }
                break;
              default:
                // 兼容旧格式
                if (parsed.content) {
                  handlers.onText(parsed.content);
                }
            }

            if (parsed.error) {
              handlers.onError(new Error(parsed.error));
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  }
}
