/**
 * AI 模块 - 客户端 AI 聊天功能相关类型、模板和样式
 */
import { html, css, TemplateResult } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  computePosition,
  flip,
  shift,
  offset,
  Placement,
} from '@floating-ui/dom';
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
  turnDuration: number; // 持续时间（秒）
  isDragging: boolean;
  chatModel: string; // 当前使用的模型名称
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
 * 弹出方向优先级（用户指定）
 * right-top > left-top > right-bottom > left-bottom > bottom-right > top-right > bottom-left > top-left > right-center > left-center > bottom-center > top-center
 */
const FALLBACK_PLACEMENTS: Placement[] = [
  'right-start', // right-top
  'left-start', // left-top
  'right-end', // right-bottom
  'left-end', // left-bottom
  'bottom-end', // bottom-right
  'top-end', // top-right
  'bottom-start', // bottom-left
  'top-start', // top-left
  'right', // right-center
  'left', // left-center
  'bottom', // bottom-center
  'top', // top-center
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
  floatingEl: HTMLElement | null,
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

  // 仅初始定位一次，fixed 定位不需要持续追踪
  updatePosition();

  return null;
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

function formatHistoryDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (date.getFullYear() === now.getFullYear()) {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

/**
 * 渲染 Markdown 内容为 HTML
 */
function renderMarkdown(content: string): string {
  try {
    return marked.parse(content, { async: false }) as string;
  } catch {
    // 解析失败时返回原始文本（转义 HTML）
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }
}

function isCodexTool(tool: ToolCall): boolean {
  return (
    tool.input?._provider === 'codex' || tool.input?._provider === 'opencode'
  );
}

/**
 * 规范化工具名称（不同 provider 可能使用不同大小写，如 OpenCode 用小写 "read"）
 */
function canonicalToolName(name: string): string {
  switch (name.toLowerCase()) {
    case 'read':
      return 'Read';
    case 'write':
      return 'Write';
    case 'edit':
      return 'Edit';
    case 'glob':
      return 'Glob';
    case 'grep':
      return 'Grep';
    case 'bash':
      return 'Bash';
    case 'webfetch':
      return 'WebFetch';
    case 'websearch':
      return 'WebSearch';
    default:
      return name;
  }
}

function formatProviderName(provider: ChatProvider): string {
  if (provider === 'codex') return 'Codex';
  if (provider === 'opencode') return 'OpenCode';
  return 'Claude';
}

function getChangePath(input: Record<string, any>): string {
  if (typeof input.file_path === 'string' && input.file_path) {
    return input.file_path;
  }
  if (typeof input.path === 'string' && input.path) {
    return input.path;
  }
  if (typeof input.file === 'string' && input.file) {
    return input.file;
  }
  if (
    Array.isArray(input.changes) &&
    typeof input.changes[0]?.path === 'string'
  ) {
    return input.changes[0].path;
  }
  return '';
}

function getCodexDisplayInfo(tool: ToolCall): {
  name: string;
  summary: string;
} {
  const input = tool.input || {};
  const canonical = canonicalToolName(tool.name);

  if (canonical === 'Bash') {
    return { name: 'Bash', summary: input.command || '' };
  }
  if (canonical === 'Edit') {
    const filePath = toRelativePath(getChangePath(input));
    const fallback =
      Array.isArray(input.changes) && input.changes.length > 0
        ? `${input.changes.length} file${input.changes.length > 1 ? 's' : ''}`
        : '';
    return { name: 'Edited', summary: filePath || fallback };
  }
  if (canonical === 'Read') {
    let filePath = getChangePath(input);
    // Fallback: extract path from <path> tag in tool result
    if (!filePath && tool.result) {
      const pathMatch = tool.result.match(/<path>([\s\S]*?)<\/path>/);
      if (pathMatch) filePath = pathMatch[1].trim();
    }
    return {
      name: 'Read',
      summary: toRelativePath(filePath),
    };
  }
  if (canonical === 'WebSearch') {
    return {
      name: 'Search',
      summary: input.query || '',
    };
  }

  return { name: tool.name, summary: '' };
}

/**
 * 获取工具显示名称和参数摘要
 */
function getToolDisplayInfo(tool: ToolCall): { name: string; summary: string } {
  if (isCodexTool(tool)) {
    return getCodexDisplayInfo(tool);
  }

  const name = tool.name;
  const input = tool.input || {};

  switch (name) {
    case 'Read': {
      let filePath = input.file_path || '';
      // Fallback: extract path from <path> tag in tool result
      if (!filePath && tool.result) {
        const pathMatch = tool.result.match(/<path>([\s\S]*?)<\/path>/);
        if (pathMatch) filePath = pathMatch[1].trim();
      }
      return { name: 'Read', summary: toRelativePath(filePath) };
    }
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
 * 从工具结果中提取路径和纯文本内容（处理 JSON 数组格式和 XML 包装）
 */
function extractReadContent(raw: string): { path: string; content: string } {
  let text = raw;
  // Handle JSON array format: [{"type":"text","text":"..."}]
  if (text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        text = parsed
          .filter((b: any) => typeof b === 'object' && b.type === 'text')
          .map((b: any) => b.text || '')
          .join('\n');
      }
    } catch {
      // Not valid JSON, continue
    }
  }
  // Extract path from <path>...</path>
  const pathMatch = text.match(/<path>([\s\S]*?)<\/path>/);
  const filePath = pathMatch ? pathMatch[1].trim() : '';
  // Strip XML-like wrapper: <path>...</path><type>...</type><content>...</content>
  const contentMatch = text.match(/<content>([\s\S]*?)(<\/content>|$)/);
  if (contentMatch) {
    return { path: filePath, content: contentMatch[1].trim() };
  }
  return { path: filePath, content: text.trim() };
}

function formatToolResult(result: string, toolName: string): string {
  if (!result) return '';

  const maxLength = 300;
  let summary = result.trim();
  const canonical = canonicalToolName(toolName);

  if (canonical === 'Write') {
    const lines = summary.split('\n').length;
    return `Wrote ${lines} lines`;
  }

  if (canonical === 'Read') {
    const { content: cleanContent } = extractReadContent(summary);
    const lines = cleanContent.split('\n').length;
    return `${lines} lines`;
  }

  if (summary.length > maxLength) {
    summary = summary.slice(0, maxLength) + '...';
  }

  return summary;
}

/**
 * 渲染 Read 工具的代码预览（CLI 风格）
 */
function renderReadResult(tool: ToolCall): TemplateResult {
  const result = tool.result || '';
  const { path: extractedPath, content: cleanContent } =
    extractReadContent(result);

  if (!cleanContent) return html``;

  const lines = cleanContent.split('\n');
  const maxPreviewLines = 5;
  const showContent = lines.length <= maxPreviewLines;

  // If tool.input doesn't have file_path, use the extracted path for summary display
  if (extractedPath && tool.input && !tool.input.file_path) {
    tool.input.file_path = extractedPath;
  }

  return html`<div class="read-result-block">
    ${showContent
      ? lines.map((line) => html`<div class="read-line">${line}</div>`)
      : html`<div class="read-more">${lines.length} lines</div>`}
  </div>`;
}

/**
 * 渲染 Edit 工具的 diff 视图（红绿对比）
 */
function renderEditDiff(tool: ToolCall): TemplateResult {
  const input = tool.input || {};
  const oldStr = String(input.old_string ?? input.old_str ?? '');
  const newStr = String(input.new_string ?? input.new_str ?? '');
  const diffBlocks = Array.isArray(input.diff_blocks) ? input.diff_blocks : [];

  type DiffLine =
    | {
        type: 'add';
        text: string;
        newLine: number;
        oldLine?: number;
      }
    | {
        type: 'del';
        text: string;
        oldLine: number;
        newLine?: number;
      }
    | {
        type: 'ctx';
        text: string;
        oldLine: number;
        newLine: number;
      }
    | {
        type: 'gap';
        count: number;
        oldLine: number;
        newLine: number;
        startLine: number;
        endLine: number;
      };

  const splitLines = (text: string): string[] => {
    const normalized = text.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    return lines;
  };

  const fallbackChangedLines = (
    oldLines: string[],
    newLines: string[],
  ): DiffLine[] => {
    let prefix = 0;
    while (
      prefix < oldLines.length &&
      prefix < newLines.length &&
      oldLines[prefix] === newLines[prefix]
    ) {
      prefix++;
    }

    let suffix = 0;
    while (
      suffix < oldLines.length - prefix &&
      suffix < newLines.length - prefix &&
      oldLines[oldLines.length - 1 - suffix] ===
        newLines[newLines.length - 1 - suffix]
    ) {
      suffix++;
    }

    const changed: DiffLine[] = [];

    const oldStart = prefix + 1;
    const newStart = prefix + 1;

    const oldChanged = oldLines.slice(prefix, oldLines.length - suffix);
    const newChanged = newLines.slice(prefix, newLines.length - suffix);

    for (let idx = 0; idx < oldChanged.length; idx++) {
      changed.push({
        type: 'del',
        text: oldChanged[idx],
        oldLine: oldStart + idx,
      });
    }
    for (let idx = 0; idx < newChanged.length; idx++) {
      changed.push({
        type: 'add',
        text: newChanged[idx],
        newLine: newStart + idx,
      });
    }
    return changed;
  };

  const buildDiffLines = (oldText: string, newText: string): DiffLine[] => {
    const oldLines = splitLines(oldText);
    const newLines = splitLines(newText);

    if (oldLines.length === 0 && newLines.length === 0) return [];
    if (oldLines.length === 0)
      return newLines.map((text, idx) => ({
        type: 'add',
        text,
        newLine: idx + 1,
      }));
    if (newLines.length === 0)
      return oldLines.map((text, idx) => ({
        type: 'del',
        text,
        oldLine: idx + 1,
      }));

    const maxCells = 200000;
    if (oldLines.length * newLines.length > maxCells) {
      return fallbackChangedLines(oldLines, newLines);
    }

    const dp = Array.from({ length: oldLines.length + 1 }, () =>
      Array<number>(newLines.length + 1).fill(0),
    );
    for (let i = oldLines.length - 1; i >= 0; i--) {
      for (let j = newLines.length - 1; j >= 0; j--) {
        if (oldLines[i] === newLines[j]) {
          dp[i][j] = dp[i + 1][j + 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
    }

    const ops: DiffLine[] = [];
    let i = 0;
    let j = 0;
    while (i < oldLines.length && j < newLines.length) {
      if (oldLines[i] === newLines[j]) {
        ops.push({
          type: 'ctx',
          text: oldLines[i],
          oldLine: i + 1,
          newLine: j + 1,
        });
        i++;
        j++;
        continue;
      }
      if (dp[i + 1][j] >= dp[i][j + 1]) {
        ops.push({ type: 'del', text: oldLines[i], oldLine: i + 1 });
        i++;
      } else {
        ops.push({ type: 'add', text: newLines[j], newLine: j + 1 });
        j++;
      }
    }
    while (i < oldLines.length) {
      ops.push({ type: 'del', text: oldLines[i], oldLine: i + 1 });
      i++;
    }
    while (j < newLines.length) {
      ops.push({ type: 'add', text: newLines[j], newLine: j + 1 });
      j++;
    }

    const isChange = (l: DiffLine) => l.type === 'add' || l.type === 'del';
    const firstChange = ops.findIndex(isChange);
    if (firstChange === -1) {
      return oldLines.join('\n') === newLines.join('\n')
        ? []
        : fallbackChangedLines(oldLines, newLines);
    }
    let lastChange = -1;
    for (let k = ops.length - 1; k >= 0; k--) {
      if (isChange(ops[k])) {
        lastChange = k;
        break;
      }
    }
    if (lastChange === -1) {
      return fallbackChangedLines(oldLines, newLines);
    }
    const middle = ops.slice(firstChange, lastChange + 1);

    // If there is a run of unchanged lines between two non-adjacent changes,
    // show the actual lines when the gap is small, otherwise collapse.
    const maxInlineContext = 5;
    const rendered: DiffLine[] = [];
    for (let k = 0; k < middle.length; k++) {
      const line = middle[k];
      if (line.type !== 'ctx') {
        rendered.push(line);
        continue;
      }

      let runEnd = k;
      while (runEnd < middle.length && middle[runEnd].type === 'ctx') {
        runEnd++;
      }
      const runLen = runEnd - k;
      if (runLen <= maxInlineContext) {
        rendered.push(...(middle.slice(k, runEnd) as DiffLine[]));
      } else {
        rendered.push({
          type: 'gap',
          count: runLen,
          oldLine: line.oldLine,
          newLine: line.newLine,
          startLine: k + 1,
          endLine: runEnd,
        });
      }
      k = runEnd - 1;
    }

    return rendered.length > 0
      ? rendered
      : fallbackChangedLines(oldLines, newLines);
  };

  const computeLinenoWidth = (lines: DiffLine[]): string => {
    let maxLineNo = 0;
    for (const line of lines) {
      if (typeof line.oldLine === 'number')
        maxLineNo = Math.max(maxLineNo, line.oldLine);
      if (typeof line.newLine === 'number')
        maxLineNo = Math.max(maxLineNo, line.newLine);
    }
    const digits = maxLineNo > 0 ? String(maxLineNo).length : 1;
    return `${Math.max(4, digits)}ch`;
  };

  const renderDiffLine = (line: DiffLine): TemplateResult => {
    const cls =
      line.type === 'add'
        ? 'diff-add'
        : line.type === 'del'
          ? 'diff-del'
          : line.type === 'ctx'
            ? 'diff-ctx'
            : 'diff-gap';
    const sign =
      line.type === 'add'
        ? '+'
        : line.type === 'del'
          ? '-'
          : line.type === 'gap'
            ? ''
            : '\u00A0';
    const text =
      line.type === 'gap'
        ? `...${line.count} lines`
        : line.text;
    const lineNumber =
      line.type === 'gap' ? '...' : (line.newLine ?? line.oldLine ?? '');
    return html`<div class="diff-line ${cls}">
      <span class="diff-lineno diff-lineno-${line.newLine ? 'new' : 'old'}"
        >${lineNumber}</span
      >
      <span class="diff-sign">${sign}</span>
      <span class="diff-text">${text}</span>
    </div>`;
  };

  const renderDiffView = (
    rendered: unknown,
    lines: DiffLine[],
  ): TemplateResult => {
    return html`<div
      class="diff-view"
      style="--diff-lineno-width: ${computeLinenoWidth(lines)}"
    >
      ${rendered}
    </div>`;
  };

  const parseSections = (text: string): Map<string, string> => {
    const lines = text.split('\n');
    const sections = new Map<string, string>();
    let currentPath = '';
    let buffer: string[] = [];

    const flush = () => {
      if (!currentPath) return;
      sections.set(currentPath, buffer.join('\n'));
    };

    for (const line of lines) {
      if (line.startsWith('# ')) {
        flush();
        currentPath = line.slice(2).trim();
        buffer = [];
      } else if (currentPath) {
        buffer.push(line);
      }
    }
    flush();

    return sections;
  };

  const changes = Array.isArray(input.changes) ? input.changes : [];

  if (diffBlocks.length > 0) {
    const renderedFromBlocks: TemplateResult[] = [];
    const allLines: DiffLine[] = [];
    for (const block of diffBlocks) {
      const filePath = String(block?.file_path || '');
      const oldString = String(block?.old_string || '');
      const newString = String(block?.new_string || '');
      const lines = buildDiffLines(oldString, newString);
      if (lines.length === 0) continue;
      allLines.push(...lines);
      renderedFromBlocks.push(html`
        ${filePath
          ? html`<div class="diff-file-header">
              ${toRelativePath(filePath)}
            </div>`
          : ''}
        ${lines.map((line) => renderDiffLine(line))}
      `);
    }
    if (renderedFromBlocks.length > 0) {
      return renderDiffView(renderedFromBlocks, allLines);
    }
  }

  if (!oldStr && !newStr) {
    return html``;
  }

  const oldSections = parseSections(oldStr);
  const newSections = parseSections(newStr);

  if (changes.length > 0 && (oldSections.size > 0 || newSections.size > 0)) {
    const renderedByChanges: TemplateResult[] = [];
    const allLines: DiffLine[] = [];
    for (const change of changes) {
      const filePath = String(change?.path || '');
      if (!filePath) continue;

      const lines = buildDiffLines(
        oldSections.get(filePath) || '',
        newSections.get(filePath) || '',
      );
      if (lines.length === 0) continue;
      allLines.push(...lines);
      renderedByChanges.push(html`
        <div class="diff-file-header">${toRelativePath(filePath)}</div>
        ${lines.map((line) => renderDiffLine(line))}
      `);
    }

    if (renderedByChanges.length > 0) {
      return renderDiffView(renderedByChanges, allLines);
    }
  }

  const lines = buildDiffLines(oldStr, newStr);
  return renderDiffView(
    lines.map((line) => renderDiffLine(line)),
    lines,
  );
}

/**
 * 渲染单个工具调用（CLI 扁平内联风格）
 */
function renderToolCall(
  tool: ToolCall,
  state?: ChatState,
  handlers?: ChatHandlers,
): TemplateResult {
  const { name, summary } = getToolDisplayInfo(tool);
  const isComplete = tool.isComplete;
  const hasResult = tool.result !== undefined;
  const canonical = canonicalToolName(tool.name);
  const isEdit = canonical === 'Edit';
  const isRead = canonical === 'Read';
  const hasEditInput =
    isEdit &&
    tool.input &&
    (() => {
      const inp = tool.input!;
      if (Array.isArray(inp.diff_blocks) && inp.diff_blocks.length > 0) {
        return inp.diff_blocks.some(
          (b: any) =>
            String(b?.old_string ?? '') !== String(b?.new_string ?? ''),
        );
      }
      const oldStr = String(inp.old_string ?? inp.old_str ?? '');
      const newStr = String(inp.new_string ?? inp.new_str ?? '');
      return oldStr !== newStr;
    })();
  const hasReadResult = isRead && hasResult && !tool.isError;
  const suppressResult =
    isCodexTool(tool) &&
    !tool.isError &&
    (isEdit || canonical === 'Bash' || canonical === 'WebSearch');

  // Skip empty Edit tool calls that have no diff, no summary and no result
  if (isEdit && !hasEditInput && !summary && !hasResult) {
    return html``;
  }

  const hasRevertTarget =
    isEdit &&
    tool.input &&
    (() => {
      const inp = tool.input!;
      if (Array.isArray(inp.diff_blocks) && inp.diff_blocks.length > 0) {
        return inp.diff_blocks.some(
          (b: any) =>
            String(b?.file_path || '').trim() &&
            String(b?.old_string ?? '') !== String(b?.new_string ?? ''),
        );
      }
      const filePath = String(
        inp.file_path || inp.path || inp.file || '',
      ).trim();
      if (filePath) return true;
      const changes = Array.isArray(inp.changes) ? inp.changes : [];
      return changes.some((c: any) =>
        String(c?.path || c?.file_path || '').trim(),
      );
    })();

  const canRevert =
    hasEditInput &&
    isComplete &&
    !tool.isError &&
    !!handlers?.revertEdit &&
    hasRevertTarget;
  const isReverted = state?.revertedToolIds?.has(tool.id) ?? false;
  const isReverting = state?.revertingToolIds?.has(tool.id) ?? false;

  return html`
    <div class="tool-call-inline">
      <div class="tool-header-inline">
        <span
          class="tool-bullet ${isComplete
            ? 'tool-bullet-complete'
            : 'tool-bullet-running'}"
          >●</span
        >
        <span class="tool-name-inline">${name}</span>
        ${summary
          ? html`<span class="tool-summary-inline">⁦${summary}⁩</span>`
          : ''}
      </div>
      ${hasEditInput
        ? html`<div class="tool-diff-wrapper">
              <span class="tool-result-bracket">⎿</span>
              ${renderEditDiff(tool)}
            </div>
            ${canRevert
              ? html`<div class="tool-revert-action">
                  <button
                    class="tool-revert-btn ${isReverted
                      ? 'reverted'
                      : isReverting
                        ? 'reverting'
                        : ''}"
                    @click="${() => handlers!.revertEdit(tool)}"
                    ?disabled="${isReverted || isReverting}"
                  >
                    ${isReverting
                      ? 'Reverting...'
                      : isReverted
                        ? '✓ Reverted'
                        : 'Revert'}
                  </button>
                </div>`
              : ''}`
        : hasReadResult
          ? html`<div class="tool-diff-wrapper">
              <span class="tool-result-bracket">⎿</span>
              ${renderReadResult(tool)}
            </div>`
          : hasResult && !suppressResult
            ? html`<div class="tool-result-inline">
                <span class="tool-result-bracket">⎿</span>
                <span
                  class="tool-result-text ${tool.isError
                    ? 'tool-error-text'
                    : ''}"
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
function renderMessageContent(
  msg: ChatMessage,
  state?: ChatState,
  handlers?: ChatHandlers,
): TemplateResult {
  const isAssistant = msg.role === 'assistant';

  // 如果有 blocks，按块渲染
  if (msg.blocks && msg.blocks.length > 0) {
    return html`
      ${msg.blocks.map((block) => {
        if (block.type === 'text' && block.content) {
          if (isAssistant) {
            return html`<div class="chat-text-inline chat-markdown">
              ${unsafeHTML(renderMarkdown(block.content))}
            </div>`;
          }
          return html`<div class="chat-text-inline">${block.content}</div>`;
        } else if (block.type === 'tool' && block.tool) {
          return renderToolCall(block.tool, state, handlers);
        }
        return html``;
      })}
    `;
  }

  if (
    msg.role === 'user' &&
    Array.isArray(msg.images) &&
    msg.images.length > 0
  ) {
    return html`
      <div class="chat-image-grid">
        ${msg.images.map(
          (image) => html`
            <div class="chat-image-item">
              <img
                class="chat-image-preview"
                src="${image.previewUrl}"
                alt="${image.name || 'pasted-image'}"
              />
              <div class="chat-image-meta">${image.name || 'pasted-image'}</div>
            </div>
          `,
        )}
      </div>
      ${msg.content
        ? html`<div class="chat-text-inline">${msg.content}</div>`
        : ''}
    `;
  }

  // 否则只渲染文本内容
  if (isAssistant && msg.content) {
    return html`<div class="chat-text-inline chat-markdown">
      ${unsafeHTML(renderMarkdown(msg.content))}
    </div>`;
  }
  return html`<div class="chat-text-inline">${msg.content}</div>`;
}

function renderMessageContext(msg: ChatMessage): TemplateResult {
  const context = msg.context;
  if (!context || msg.role !== 'user') {
    return html``;
  }

  return html`<div class="chat-message-context">
    <span class="chat-message-context-tag">Context</span>
    <span class="chat-message-context-text"
      >&lt;${context.name}&gt;
      ${toRelativePath(context.file)}#${context.line}</span
    >
  </div>`;
}

/**
 * 检查是否有可回退的 Edit 工具调用
 */
function hasRevertableEdits(state: ChatState): boolean {
  for (const msg of state.chatMessages) {
    if (msg.role !== 'assistant' || !msg.blocks) continue;
    for (const block of msg.blocks) {
      if (block.type !== 'tool' || !block.tool) continue;
      const tool = block.tool;
      if (
        canonicalToolName(tool.name) === 'Edit' &&
        tool.isComplete &&
        !tool.isError &&
        !state.revertedToolIds.has(tool.id) &&
        tool.input
      ) {
        const inp = tool.input;
        if (Array.isArray(inp.diff_blocks) && inp.diff_blocks.length > 0) {
          if (
            inp.diff_blocks.some(
              (b: any) =>
                String(b?.old_string ?? '') !== String(b?.new_string ?? ''),
            )
          ) {
            return true;
          }
        } else {
          const oldStr = String(inp.old_string ?? inp.old_str ?? '');
          const newStr = String(inp.new_string ?? inp.new_str ?? '');
          if (oldStr !== newStr) return true;
        }
      }
    }
  }
  return false;
}

/**
 * 收集所有可回退的 Edit 工具调用
 */
export function collectRevertableTools(state: ChatState): ToolCall[] {
  const tools: ToolCall[] = [];
  for (const msg of state.chatMessages) {
    if (msg.role !== 'assistant' || !msg.blocks) continue;
    for (const block of msg.blocks) {
      if (block.type !== 'tool' || !block.tool) continue;
      const tool = block.tool;
      if (
        canonicalToolName(tool.name) === 'Edit' &&
        tool.isComplete &&
        !tool.isError &&
        !state.revertedToolIds.has(tool.id) &&
        tool.input
      ) {
        const inp = tool.input;
        let hasDiff = false;
        if (Array.isArray(inp.diff_blocks) && inp.diff_blocks.length > 0) {
          hasDiff = inp.diff_blocks.some(
            (b: any) =>
              String(b?.old_string ?? '') !== String(b?.new_string ?? ''),
          );
        } else {
          const oldStr = String(inp.old_string ?? inp.old_str ?? '');
          const newStr = String(inp.new_string ?? inp.new_str ?? '');
          hasDiff = oldStr !== newStr;
        }
        if (hasDiff) tools.push(tool);
      }
    }
  }
  return tools;
}

/**
 * 渲染聊天框模板
 */
export function renderChatModal(
  state: ChatState,
  handlers: ChatHandlers,
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
        class="chat-modal chat-modal-floating ${state.isDragging
          ? 'dragging'
          : ''}"
        id="chat-modal-floating"
        @click="${handlers.handleModalClick}"
      >
        <div class="chat-modal-header" @mousedown="${handlers.handleDragStart}">
          <div class="chat-modal-title-wrapper">
            <div class="chat-modal-title-row">
              <h3 class="chat-modal-title">AI Assistant</h3>
              ${state.availableProviders.length > 1
                ? html`<div
                    class="chat-provider-switcher"
                    @mousedown="${(e: MouseEvent) => e.stopPropagation()}"
                    @click="${(e: MouseEvent) => e.stopPropagation()}"
                  >
                    <button
                      class="chat-provider-badge chat-provider-trigger ${state.showProviderMenu
                        ? 'open'
                        : ''}"
                      title="Switch AI provider"
                      ?disabled="${state.chatLoading ||
                      state.turnStatus === 'running'}"
                      @mousedown="${(e: MouseEvent) => e.stopPropagation()}"
                      @click="${handlers.toggleProviderMenu}"
                    >
                      <span class="chat-provider-label"
                        >${formatProviderName(
                          state.chatProvider || state.availableProviders[0],
                        )}</span
                      >
                    </button>
                    ${state.showProviderMenu
                      ? html`<div
                          class="chat-provider-menu"
                          @mousedown="${(e: MouseEvent) => e.stopPropagation()}"
                        >
                          ${state.availableProviders.map(
                            (provider) => html`
                              <button
                                class="chat-provider-option ${provider ===
                                state.chatProvider
                                  ? 'active'
                                  : ''}"
                                @mousedown="${(e: MouseEvent) =>
                                  e.stopPropagation()}"
                                @click="${() =>
                                  handlers.switchProvider(provider)}"
                              >
                                ${formatProviderName(provider)}
                              </button>
                            `,
                          )}
                        </div>`
                      : ''}
                  </div>`
                : state.chatProvider
                  ? html`<span class="chat-provider-badge"
                      >${formatProviderName(state.chatProvider)}</span
                    >`
                  : ''}
              ${state.availableModels.length > 1
                ? html`<div
                    class="chat-model-switcher"
                    @mousedown="${(e: MouseEvent) => e.stopPropagation()}"
                    @click="${(e: MouseEvent) => e.stopPropagation()}"
                  >
                    <button
                      class="chat-model-badge chat-model-trigger ${state.showModelMenu
                        ? 'open'
                        : ''}"
                      title="Switch model"
                      ?disabled="${state.chatLoading ||
                      state.turnStatus === 'running'}"
                      @mousedown="${(e: MouseEvent) => e.stopPropagation()}"
                      @click="${handlers.toggleModelMenu}"
                    >
                      <span class="chat-model-label"
                        >${state.chatModel || state.availableModels[0]}</span
                      >
                    </button>
                    ${state.showModelMenu
                      ? html`<div
                          class="chat-model-menu"
                          @mousedown="${(e: MouseEvent) => e.stopPropagation()}"
                        >
                          ${state.availableModels.map(
                            (model) => html`
                              <button
                                class="chat-model-option ${model ===
                                state.chatModel
                                  ? 'active'
                                  : ''}"
                                @mousedown="${(e: MouseEvent) =>
                                  e.stopPropagation()}"
                                @click="${() => handlers.switchModel(model)}"
                              >
                                ${model}
                              </button>
                            `,
                          )}
                        </div>`
                      : ''}
                  </div>`
                : state.chatModel
                  ? html`<span class="chat-model-badge"
                      >${state.chatModel}</span
                    >`
                  : ''}
            </div>
            <span class="chat-context-info">
              ${state.chatContext
                ? html`&lt;${state.chatContext.name}&gt;
                  ${state.chatContext.file}#${state.chatContext.line}`
                : 'Global'}
            </span>
          </div>
          <div class="chat-modal-actions">
            <button
              class="chat-modal-history"
              @click="${handlers.toggleHistoryPanel}"
              title="History"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            <button
              class="chat-modal-theme"
              @click="${handlers.toggleTheme}"
              title="${state.chatTheme === 'dark'
                ? 'Switch to light theme'
                : 'Switch to dark theme'}"
            >
              ${state.chatTheme === 'dark'
                ? html`<svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <path
                      d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                    />
                  </svg>`
                : html`<svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
        ${state.showHistoryPanel
          ? html`<div class="chat-history-panel">
              <div class="chat-history-header">
                <span class="chat-history-title">History</span>
                <div class="chat-history-actions">
                  <button
                    class="chat-history-new-btn"
                    @click="${handlers.startNewConversation}"
                    title="New conversation"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    New
                  </button>
                  <button
                    class="chat-history-back-btn"
                    @click="${handlers.toggleHistoryPanel}"
                    title="Back to chat"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="chat-history-list">
                ${state.historyLoading
                  ? html`<div class="chat-history-loading">
                      <span class="chat-cursor"></span>
                      <span>Loading...</span>
                    </div>`
                  : state.historyList.length === 0
                    ? html`<div class="chat-history-empty">No history yet</div>`
                    : state.historyList.map(
                        (entry) => html`
                          <div
                            class="chat-history-item ${entry.id === state.conversationId ? 'active' : ''}"
                            @click="${() => handlers.loadConversation(entry.id)}"
                          >
                            <div class="chat-history-item-info">
                              <span class="chat-history-item-title">${entry.title || 'Untitled'}</span>
                              <span class="chat-history-item-meta">
                                ${formatHistoryDate(entry.updatedAt)}
                                ${entry.provider ? html` · <span class="chat-history-item-provider">${entry.provider}</span>` : ''}
                                · ${entry.messageCount} msgs
                              </span>
                            </div>
                            <button
                              class="chat-history-item-delete"
                              @click="${(e: MouseEvent) => { e.stopPropagation(); handlers.deleteConversation(entry.id); }}"
                              title="Delete"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        `,
                      )}
              </div>
            </div>`
          : html`<div class="chat-modal-content">
              ${state.chatMessages.length === 0
                ? html`<div class="chat-empty">
                    <span class="chat-empty-prompt">❯</span>
                    <span class="chat-empty-text"
                      >Ask me anything about this code...</span
                    >
                  </div>`
                : state.chatMessages.map(
                    (msg) => html`
                      <div class="chat-line chat-line-${msg.role}">
                        ${msg.role === 'user'
                          ? html`<span class="chat-prompt">❯</span>`
                          : html`<span class="chat-indent"></span>`}
                        <div class="chat-message-content">
                          ${renderMessageContext(msg)}
                          ${renderMessageContent(msg, state, handlers)}
                        </div>
                      </div>
                    `,
                  )}
              ${state.chatLoading &&
              (!state.chatMessages.length ||
                state.chatMessages[state.chatMessages.length - 1]?.role === 'user')
                ? html`<div class="chat-loading">
                    <span class="chat-indent"></span>
                    <span class="chat-cursor"></span>
                  </div>`
                : ''}
            </div>`}
        ${!state.showHistoryPanel && state.turnStatus !== 'idle'
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
                <span class="chat-status-duration"
                  >· ${formatDuration(state.turnDuration)}</span
                >
              </div>
              ${state.turnStatus === 'running'
                ? html`<button
                    class="chat-interrupt-btn"
                    @click="${handlers.interruptChat}"
                    title="Interrupt"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="6" y="6" width="12" height="12" rx="1" />
                    </svg>
                  </button>`
                : hasRevertableEdits(state)
                  ? html`<button
                      class="tool-revert-btn ${state.revertingToolIds.size > 0
                        ? 'reverting'
                        : ''}"
                      @click="${handlers.revertAllEdits}"
                      ?disabled="${state.revertingToolIds.size > 0}"
                    >
                      ${state.revertingToolIds.size > 0
                        ? 'Reverting...'
                        : 'Revert All'}
                    </button>`
                  : ''}
            </div>`
          : ''}
        ${!state.showHistoryPanel
          ? html`<div class="chat-modal-footer">
          ${state.chatPastedImages.length > 0
            ? html`<div class="chat-paste-preview">
                ${state.chatPastedImages.map(
                  (image) => html`
                    <div class="chat-paste-preview-item">
                      <img
                        class="chat-paste-preview-img"
                        src="${image.previewUrl}"
                        alt="${image.name || 'pasted-image'}"
                      />
                      <button
                        class="chat-paste-remove"
                        title="Remove image"
                        @click="${() => handlers.removePastedImage(image.id)}"
                        ?disabled="${state.chatLoading ||
                        state.chatImageProcessing}"
                      >
                        ×
                      </button>
                    </div>
                  `,
                )}
              </div>`
            : ''}
          <span class="chat-input-prompt">❯</span>
          <textarea
            class="chat-input"
            placeholder="Enter your message... (supports paste image)"
            .value="${state.chatInput}"
            @input="${handlers.handleChatInput}"
            @keydown="${handlers.handleChatKeyDown}"
            @paste="${handlers.handleChatPaste}"
            ?disabled="${state.chatLoading || state.chatImageProcessing}"
            rows="2"
          ></textarea>
          <button
            class="chat-send-btn"
            @click="${handlers.sendChatMessage}"
            ?disabled="${state.chatLoading ||
            state.chatImageProcessing ||
            (!state.chatInput.trim() && state.chatPastedImages.length === 0)}"
            title="Send (Enter)"
          >
            ${state.chatLoading || state.chatImageProcessing
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
        </div>`
          : ''}
        ${state.showCloseConfirm
          ? html`<div
              class="chat-close-confirm-overlay"
              @click="${(e: MouseEvent) => e.stopPropagation()}"
            >
              <div class="chat-close-confirm">
                <div class="chat-close-confirm-title">
                  Task is still running
                </div>
                <div class="chat-close-confirm-desc">
                  Closing this dialog will keep the task running in the
                  background.
                </div>
                <div class="chat-close-confirm-actions">
                  <button
                    class="chat-confirm-btn chat-confirm-btn-danger"
                    @click="${handlers.terminateAndCloseChatModal}"
                  >
                    Terminate
                  </button>
                  <button
                    class="chat-confirm-btn chat-confirm-btn-primary"
                    @click="${handlers.confirmCloseChatModal}"
                  >
                    Confirm
                  </button>
                  <button
                    class="chat-confirm-btn"
                    @click="${handlers.cancelCloseChatModal}"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>`
          : ''}
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
    --chat-text-primary: #d4d4d4;
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
    --chat-bg-secondary: #2a2a2a;
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
    --chat-text-primary: #333333;
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
    --chat-bg-secondary: #f0f2f5;
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
    position: relative;
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
    height: min(520px, calc(100vh - 32px));
    animation: slideIn 0.3s ease-out;
  }

  .chat-modal-centered {
    animation: fadeInScale 0.3s ease-out;
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
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
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .chat-modal-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .chat-model-badge {
    font-size: 12px;
    color: var(--chat-text-secondary);
    background: var(--chat-border);
    padding: 1px 6px;
    border-radius: 3px;
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    white-space: nowrap;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-model-switcher {
    position: relative;
    display: inline-flex;
    min-width: 0;
  }

  .chat-model-trigger {
    border: 1px solid var(--chat-border);
    background: var(--chat-border);
    font-size: 12px;
    color: var(--chat-text-secondary);
    padding: 1px 6px;
    border-radius: 3px;
    cursor: pointer;
    max-width: 180px;
    display: inline-flex;
    align-items: center;
    min-width: 0;
  }

  .chat-model-trigger:hover:not(:disabled),
  .chat-model-trigger.open {
    background: transparent;
    border-color: var(--chat-text-muted);
  }

  .chat-model-trigger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .chat-model-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chat-model-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 180px;
    max-width: 280px;
    max-height: 220px;
    overflow: auto;
    border: 1px solid var(--chat-border);
    background: var(--chat-bg);
    border-radius: 6px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32);
    padding: 6px;
    z-index: 999;
  }

  .chat-model-option {
    width: 100%;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--chat-text-secondary);
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 11px;
    text-align: left;
    padding: 5px 8px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-model-option:hover {
    background: var(--chat-hover-bg);
  }

  .chat-model-option.active {
    background: var(--chat-bg-secondary);
    color: var(--chat-accent);
    font-weight: 600;
  }

  .chat-provider-badge {
    font-size: 10px;
    color: var(--chat-text-secondary);
    background: var(--chat-hover-bg);
    border: 1px solid var(--chat-border);
    padding: 1px 6px;
    border-radius: 3px;
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
  }

  .chat-provider-switcher {
    position: relative;
    display: inline-flex;
  }

  .chat-context-info {
    font-size: 11px;
    color: var(--chat-text-muted);
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-provider-trigger {
    border: 1px solid var(--chat-border);
    background: var(--chat-border);
    font-size: 12px;
    padding: 1px 6px;
    border-radius: 3px;
    cursor: pointer;
    max-width: 120px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .chat-provider-trigger:hover:not(:disabled),
  .chat-provider-trigger.open {
    background: transparent;
    border-color: var(--chat-text-muted);
  }

  .chat-provider-trigger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .chat-provider-label {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-provider-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 112px;
    border: 1px solid var(--chat-border);
    background: var(--chat-bg);
    border-radius: 6px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32);
    padding: 6px;
    z-index: 999;
  }

  .chat-provider-option {
    width: 100%;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--chat-text-secondary);
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 11px;
    text-align: left;
    padding: 5px 8px;
    cursor: pointer;
  }

  .chat-provider-option:hover {
    background: var(--chat-hover-bg);
  }

  .chat-provider-option.active {
    background: var(--chat-bg-secondary);
    color: var(--chat-accent);
    font-weight: 600;
  }

  .chat-provider-chevron {
    font-size: 9px;
    color: var(--chat-text-muted);
    flex-shrink: 0;
  }

  .chat-modal-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .chat-modal-theme,
  .chat-modal-clear,
  .chat-modal-history {
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
  .chat-modal-clear:hover,
  .chat-modal-history:hover {
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

  .chat-close-confirm-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    z-index: 20;
    padding: 16px;
  }

  .chat-close-confirm {
    width: 100%;
    max-width: 420px;
    border: 1px solid var(--chat-border);
    background: var(--chat-bg);
    border-radius: 10px;
    padding: 14px;
    box-shadow: 0 12px 28px var(--chat-shadow);
  }

  .chat-close-confirm-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--chat-text-secondary);
    margin-bottom: 6px;
  }

  .chat-close-confirm-desc {
    font-size: 12px;
    line-height: 1.5;
    color: var(--chat-text-muted);
    margin-bottom: 12px;
  }

  .chat-close-confirm-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .chat-confirm-btn {
    border: 1px solid var(--chat-border);
    background: transparent;
    color: var(--chat-text-secondary);
    border-radius: 6px;
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
  }

  .chat-confirm-btn:hover {
    background: var(--chat-hover-bg);
  }

  .chat-confirm-btn-primary {
    background: var(--chat-accent);
    border-color: var(--chat-accent);
    color: var(--chat-btn-text);
  }

  .chat-confirm-btn-primary:hover {
    background: var(--chat-accent-hover);
    border-color: var(--chat-accent-hover);
  }

  .chat-confirm-btn-danger {
    border-color: var(--chat-tool-error);
    color: var(--chat-tool-error);
  }

  .chat-confirm-btn-danger:hover {
    background: rgba(207, 34, 46, 0.12);
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

  .chat-message-context {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-size: 11px;
    line-height: 1.35;
    color: var(--chat-text-muted);
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  .chat-message-context-tag {
    flex-shrink: 0;
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid var(--chat-border);
    background: var(--chat-tool-bg);
    color: var(--chat-text-secondary);
  }

  .chat-message-context-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chat-image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
    margin-bottom: 2px;
  }

  .chat-image-item {
    border: 1px solid var(--chat-border);
    border-radius: 6px;
    overflow: hidden;
    background: var(--chat-tool-bg);
  }

  .chat-image-preview {
    width: 100%;
    height: 84px;
    object-fit: cover;
    display: block;
  }

  .chat-image-meta {
    padding: 4px 6px;
    font-size: 10px;
    color: var(--chat-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  .chat-markdown h1 {
    font-size: 1.4em;
  }
  .chat-markdown h2 {
    font-size: 1.25em;
  }
  .chat-markdown h3 {
    font-size: 1.1em;
  }
  .chat-markdown h4,
  .chat-markdown h5,
  .chat-markdown h6 {
    font-size: 1em;
  }

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
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
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
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
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
    flex-wrap: wrap;
  }

  .chat-paste-preview {
    width: 100%;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .chat-paste-preview-item {
    position: relative;
    flex: 0 0 auto;
    width: 56px;
    height: 56px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--chat-border);
    background: var(--chat-tool-bg);
  }

  .chat-paste-preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .chat-paste-remove {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    cursor: pointer;
    font-size: 12px;
    line-height: 16px;
    padding: 0;
  }

  .chat-paste-remove:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
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
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
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
    unicode-bidi: isolate;
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

  .diff-file-header {
    padding: 4px 8px 2px;
    color: var(--chat-text-muted);
    background: var(--chat-tool-bg);
    border-top: 1px solid var(--chat-border);
    font-size: 11px;
  }

  .diff-file-header:first-child {
    border-top: none;
  }

  .diff-line {
    display: grid;
    grid-template-columns: var(--diff-lineno-width, 4ch) 2ch minmax(0, 1fr);
    gap: 8px;
    align-items: start;
    padding: 1px 8px;
  }

  .diff-lineno {
    color: var(--chat-text-muted);
    font-variant-numeric: tabular-nums;
    text-align: right;
    user-select: none;
  }

  .diff-sign {
    user-select: none;
  }

  .diff-text {
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

  .diff-ctx {
    color: var(--chat-tool-result);
    background: transparent;
  }

  .diff-gap {
    color: var(--chat-text-muted);
    background: var(--chat-tool-bg);
    font-style: italic;
  }

  /* Revert 按钮 */
  .tool-revert-action {
    display: flex;
    justify-content: flex-end;
    padding: 2px 16px 2px 0;
  }

  .tool-revert-btn {
    background: transparent;
    border: 1px solid var(--chat-border);
    color: var(--chat-text-muted);
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .tool-revert-btn:hover:not(:disabled) {
    background: var(--chat-hover-bg);
    color: var(--chat-text-secondary);
    border-color: var(--chat-text-muted);
  }

  .tool-revert-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .tool-revert-btn.reverting {
    color: var(--chat-accent);
    border-color: var(--chat-accent);
  }

  .tool-revert-btn.reverted {
    color: var(--chat-tool-complete);
    border-color: var(--chat-tool-complete);
  }

  /* Read 结果代码预览 */
  .read-result-block {
    flex: 1;
    min-width: 0;
    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    border-radius: 4px;
    overflow: hidden;
  }

  .read-line {
    padding: 1px 8px;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--chat-tool-result);
  }

  .read-more {
    padding: 1px 8px;
    color: var(--chat-text-muted);
    font-style: italic;
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

  /* History Panel */
  .chat-history-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--chat-border);
    flex-shrink: 0;
  }

  .chat-history-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--chat-text-primary);
  }

  .chat-history-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .chat-history-new-btn,
  .chat-history-back-btn {
    background: transparent;
    border: none;
    color: var(--chat-text-muted);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-family: inherit;
    transition: all 0.15s;
  }

  .chat-history-new-btn:hover,
  .chat-history-back-btn:hover {
    background: var(--chat-hover-bg);
    color: var(--chat-text-secondary);
  }

  .chat-history-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  .chat-history-list::-webkit-scrollbar {
    width: 8px;
  }

  .chat-history-list::-webkit-scrollbar-track {
    background: var(--chat-scrollbar-track);
  }

  .chat-history-list::-webkit-scrollbar-thumb {
    background: var(--chat-scrollbar-thumb);
    border-radius: 4px;
  }

  .chat-history-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    color: var(--chat-text-muted);
    font-size: 13px;
  }

  .chat-history-empty {
    padding: 32px 16px;
    text-align: center;
    color: var(--chat-text-muted);
    font-size: 13px;
  }

  .chat-history-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.15s;
    gap: 8px;
  }

  .chat-history-item:hover {
    background: var(--chat-hover-bg);
  }

  .chat-history-item.active {
    background: var(--chat-hover-bg);
    border-left: 2px solid var(--chat-accent);
  }

  .chat-history-item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .chat-history-item-title {
    font-size: 13px;
    color: var(--chat-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-history-item-meta {
    font-size: 11px;
    color: var(--chat-text-muted);
  }

  .chat-history-item-provider {
    text-transform: capitalize;
  }

  .chat-history-item-delete {
    background: transparent;
    border: none;
    color: var(--chat-text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    opacity: 0;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .chat-history-item:hover .chat-history-item-delete {
    opacity: 1;
  }

  .chat-history-item-delete:hover {
    background: var(--chat-hover-bg);
    color: var(--chat-error);
  }
`;

/**
 * 流式事件处理器
 */
export interface StreamHandlers {
  onText: (content: string) => void;
  onToolStart: (toolId: string, toolName: string, index: number) => void;
  onToolInput: (
    index: number,
    input: Record<string, any>,
    toolUseId?: string,
  ) => void;
  onToolResult: (toolUseId: string, content: string, isError?: boolean) => void;
  onError: (error: Error) => void;
  onSessionId?: (sessionId: string) => void;
  onProjectRoot?: (cwd: string) => void;
  onModel?: (model: string) => void;
}

function normalizeChatProvider(provider: unknown): ChatProvider | null {
  if (
    provider === 'codex' ||
    provider === 'claudeCode' ||
    provider === 'opencode'
  ) {
    return provider;
  }
  return null;
}

/**
 * 获取 AI 模型信息
 */
export async function fetchModelInfo(
  ip: string,
  port: number,
  provider?: ChatProvider | null,
): Promise<AIModelInfo> {
  try {
    const query = provider ? `?provider=${encodeURIComponent(provider)}` : '';
    const response = await fetch(`http://${ip}:${port}/ai/model${query}`);
    if (!response.ok) {
      return {
        model: '',
        models: [],
        provider: provider || null,
        providers: provider ? [provider] : [],
      };
    }
    const data = await response.json();
    const resolvedProvider = normalizeChatProvider(data?.provider);
    const providers = Array.isArray(data?.providers)
      ? data.providers
          .map((item: unknown) => normalizeChatProvider(item))
          .filter(
            (item: ChatProvider | null): item is ChatProvider => item !== null,
          )
      : [];
    const models = Array.isArray(data?.models)
      ? data.models.filter(
          (item: unknown): item is string =>
            typeof item === 'string' && item.trim().length > 0,
        )
      : [];
    const model = typeof data?.model === 'string' ? data.model : '';
    const normalizedModels = models.length > 0 ? models : model ? [model] : [];

    return {
      model,
      models: normalizedModels,
      provider: resolvedProvider,
      providers: providers.length > 0 ? providers : provider ? [provider] : [],
    };
  } catch {
    return {
      model: '',
      models: [],
      provider: provider || null,
      providers: provider ? [provider] : [],
    };
  }
}

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
export async function revertEdit(
  ip: string,
  port: number,
  edits: Array<{ file_path: string; old_string: string; new_string: string }>,
): Promise<RevertResult[]> {
  try {
    const response = await fetch(`http://${ip}:${port}/ai/revert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edits }),
    });
    if (!response.ok) {
      return edits.map((e) => ({
        file_path: e.file_path,
        success: false,
        error: 'request_failed',
      }));
    }
    const data = await response.json();
    return Array.isArray(data?.results) ? data.results : [];
  } catch {
    return edits.map((e) => ({
      file_path: e.file_path,
      success: false,
      error: 'network_error',
    }));
  }
}

/**
 * 获取对话历史列表
 */
export async function fetchHistoryList(
  ip: string,
  port: number,
): Promise<HistoryEntry[]> {
  try {
    const response = await fetch(`http://${ip}:${port}/ai/history`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.conversations) ? data.conversations : [];
  } catch {
    return [];
  }
}

/**
 * 保存对话到服务端
 */
export async function saveConversation(
  ip: string,
  port: number,
  data: {
    id?: string | null;
    messages: ChatMessage[];
    context: ChatContext | null;
    sessionId: string | null;
    provider: ChatProvider | null;
    model: string;
    revertedToolIds: string[];
  },
): Promise<{ id: string; success: boolean }> {
  try {
    const response = await fetch(`http://${ip}:${port}/ai/history/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) return { id: '', success: false };
    return await response.json();
  } catch {
    return { id: '', success: false };
  }
}

/**
 * 加载对话历史
 */
export async function loadConversationData(
  ip: string,
  port: number,
  id: string,
): Promise<ConversationData | null> {
  try {
    const response = await fetch(`http://${ip}:${port}/ai/history/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * 删除对话历史
 */
export async function deleteConversationData(
  ip: string,
  port: number,
  id: string,
): Promise<boolean> {
  try {
    const response = await fetch(`http://${ip}:${port}/ai/history/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data?.success === true;
  } catch {
    return false;
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
  history: ChatHistoryMessage[] | undefined,
  handlers: StreamHandlers,
  signal?: AbortSignal,
  sessionId?: string | null,
  provider?: ChatProvider | null,
  model?: string | null,
): Promise<void> {
  const response = await fetch(`http://${ip}:${port}/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      context,
      ...(history && history.length > 0 ? { history } : {}),
      ...(sessionId && { sessionId }),
      ...(provider && { provider }),
      ...(model && { model }),
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
                handlers.onToolStart(
                  parsed.toolId,
                  parsed.toolName,
                  parsed.index,
                );
                break;
              case 'tool_input':
                handlers.onToolInput(
                  parsed.index,
                  parsed.input,
                  parsed.toolUseId,
                );
                break;
              case 'tool_result':
                handlers.onToolResult(
                  parsed.toolUseId,
                  parsed.content,
                  parsed.isError,
                );
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

export const __TEST_ONLY__ = {
  toRelativePath,
  formatDuration,
  renderMarkdown,
  isCodexTool,
  canonicalToolName,
  formatProviderName,
  getChangePath,
  getCodexDisplayInfo,
  getToolDisplayInfo,
  extractReadContent,
  formatToolResult,
  renderReadResult,
  renderEditDiff,
  renderToolCall,
  renderMessageContent,
  renderMessageContext,
  normalizeChatProvider,
};
