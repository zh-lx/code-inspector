/**
 * 客户端终端模块 - 基于 @xterm/xterm 提供浏览器内原生终端体验
 */
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import type { ITheme } from '@xterm/xterm';
import type { ChatProvider } from './ai';

// ============================================================================
// xterm CSS（内联注入 Shadow DOM）
// ============================================================================

/**
 * xterm.js 核心 CSS - 从 @xterm/xterm/css/xterm.css 提取的必要样式
 * 在 Shadow DOM 中需要手动注入，因为外部 CSS 无法穿透 shadow boundary
 */
const XTERM_CSS = `
.xterm {
  cursor: text;
  position: relative;
  user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
}
.xterm.focus, .xterm:focus { outline: none; }
.xterm .xterm-helpers { position: absolute; top: 0; z-index: 5; }
.xterm .xterm-helper-textarea {
  padding: 0; border: 0; margin: 0;
  position: absolute; opacity: 0;
  left: -9999em; top: 0; width: 0; height: 0;
  z-index: -5; white-space: nowrap; overflow: hidden; resize: none;
}
.xterm .composition-view {
  background: #000; color: #FFF;
  display: none; position: absolute; white-space: nowrap; z-index: 1;
}
.xterm .composition-view.active { display: block; }
.xterm .xterm-viewport {
  background-color: #000; overflow-y: scroll; cursor: default;
  position: absolute; right: 0; left: 0; top: 0; bottom: 0;
}
.xterm .xterm-screen {
  position: relative;
}
.xterm .xterm-screen canvas { position: absolute; left: 0; top: 0; }
.xterm .xterm-scroll-area { visibility: hidden; }
.xterm-char-measure-element {
  display: inline-block; visibility: hidden; position: absolute; top: 0; left: -9999em;
  line-height: normal;
}
.xterm.enable-mouse-events { cursor: default; }
.xterm.xterm-cursor-pointer, .xterm .xterm-cursor-pointer { cursor: pointer; }
.xterm.column-select.focus { cursor: crosshair; }
.xterm .xterm-accessibility:not(.debug),
.xterm .xterm-message { position: absolute; left: 0; top: 0; bottom: 0; right: 0; z-index: 10; color: transparent; pointer-events: none; }
.xterm .xterm-accessibility-tree:not(.debug) *::selection { color: transparent; }
.xterm .xterm-accessibility-tree { user-select: text; white-space: pre; }
.xterm .live-region { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.xterm-dim { opacity: 0.5; }
.xterm-underline-1 { text-decoration: underline; }
.xterm-underline-2 { text-decoration: double underline; }
.xterm-underline-3 { text-decoration: wavy underline; }
.xterm-underline-4 { text-decoration: dotted underline; }
.xterm-underline-5 { text-decoration: dashed underline; }
.xterm-overline { text-decoration: overline; }
.xterm-strikethrough { text-decoration: line-through; }
.xterm-screen .xterm-decoration-container .xterm-decoration { z-index: 6; position: absolute; }
.xterm-screen .xterm-decoration-container .xterm-decoration.xterm-decoration-top-layer { z-index: 7; }
.xterm-decoration-overview-ruler {
  z-index: 8; position: absolute; top: 0; right: 0; pointer-events: none;
}
.xterm-decoration-top { z-index: 2; position: relative; }
`;

// ============================================================================
// 终端主题
// ============================================================================

const DARK_THEME: ITheme = {
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  cursor: '#d4d4d4',
  cursorAccent: '#1e1e1e',
  selectionBackground: '#264f78',
  selectionForeground: '#ffffff',
  black: '#000000',
  red: '#cd3131',
  green: '#0dbc79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#e5e5e5',
};

const LIGHT_THEME: ITheme = {
  background: '#ffffff',
  foreground: '#1e1e1e',
  cursor: '#1e1e1e',
  cursorAccent: '#ffffff',
  selectionBackground: '#add6ff',
  selectionForeground: '#000000',
  black: '#000000',
  red: '#cd3131',
  green: '#00bc00',
  yellow: '#949800',
  blue: '#0451a5',
  magenta: '#bc05bc',
  cyan: '#0598bc',
  white: '#555555',
  brightBlack: '#666666',
  brightRed: '#cd3131',
  brightGreen: '#14ce14',
  brightYellow: '#b5ba00',
  brightBlue: '#0451a5',
  brightMagenta: '#bc05bc',
  brightCyan: '#0598bc',
  brightWhite: '#a5a5a5',
};

// ============================================================================
// WebSocket 通信协议（与服务端对应）
// ============================================================================

interface TerminalCreateMessage {
  type: 'create';
  provider: ChatProvider;
  prompt?: string;
  sessionId?: string;
  cwd: string;
  model?: string;
}

interface TerminalInputMessage {
  type: 'input';
  data: string;
}

interface TerminalResizeMessage {
  type: 'resize';
  cols: number;
  rows: number;
}

interface ServerOutputMessage {
  type: 'output';
  data: string;
}

interface ServerExitMessage {
  type: 'exit';
  code: number;
}

interface ServerErrorMessage {
  type: 'error';
  message: string;
}

type ServerMessage = ServerOutputMessage | ServerExitMessage | ServerErrorMessage;

// ============================================================================
// AITerminalManager
// ============================================================================

export class AITerminalManager {
  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private webLinksAddon: WebLinksAddon | null = null;
  private ws: WebSocket | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private _disposed = false;

  /** 进程退出回调 */
  onExit?: (code: number) => void;
  /** 错误回调 */
  onError?: (message: string) => void;

  constructor(
    private ip: string,
    private port: number,
  ) {}

  /**
   * 将终端挂载到 DOM 容器
   */
  mount(container: HTMLElement, theme: 'dark' | 'light'): void {
    this.attachTerminal(container, theme);
  }

  /**
   * 当弹窗容器被卸载后，重新将终端挂载到新的 DOM 容器
   */
  remount(container: HTMLElement, theme: 'dark' | 'light'): void {
    if (this._disposed) return;
    if (this.container === container && this.terminal) {
      this.setTheme(theme);
      this.fit();
      return;
    }

    this.detachTerminal();
    this.attachTerminal(container, theme);
  }

  /**
   * 连接 WebSocket 并创建终端会话
   */
  connect(options: {
    provider: ChatProvider;
    prompt?: string;
    sessionId?: string;
    cwd: string;
    model?: string;
  }): void {
    // 关闭已有连接
    this.closeWebSocket();

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${this.ip}:${this.port}/ai/terminal`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      const createMsg: TerminalCreateMessage = {
        type: 'create',
        provider: options.provider,
        prompt: options.prompt,
        sessionId: options.sessionId,
        cwd: options.cwd,
        model: options.model,
      };
      this.ws!.send(JSON.stringify(createMsg));

      // 连接建立后发送当前终端尺寸
      if (this.fitAddon && this.terminal) {
        this.fit();
      }
    };

    this.ws.onmessage = (event: MessageEvent) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === 'output') {
        this.terminal?.write(msg.data);
      } else if (msg.type === 'exit') {
        this.onExit?.(msg.code);
      } else if (msg.type === 'error') {
        this.terminal?.write(`\r\n\x1b[31m${msg.message}\x1b[0m\r\n`);
        this.onError?.(msg.message);
      }
    };

    this.ws.onclose = () => {
      // 连接关闭不一定是错误，可能是进程正常退出
    };

    this.ws.onerror = () => {
      this.onError?.('WebSocket connection failed');
    };
  }

  /**
   * 发送用户输入到 PTY
   */
  sendInput(data: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg: TerminalInputMessage = { type: 'input', data };
      this.ws.send(JSON.stringify(msg));
    }
  }

  /**
   * 自适应终端尺寸
   */
  fit(): void {
    if (!this.fitAddon || !this.terminal || !this.container) return;
    try {
      this.fitAddon.fit();
      // 同步新尺寸到服务端
      const dims = this.fitAddon.proposeDimensions();
      if (dims && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const msg: TerminalResizeMessage = {
          type: 'resize',
          cols: dims.cols,
          rows: dims.rows,
        };
        this.ws.send(JSON.stringify(msg));
      }
    } catch {
      // 容器可能还没有尺寸
    }
  }

  /**
   * 切换终端主题
   */
  setTheme(theme: 'dark' | 'light'): void {
    if (this.terminal) {
      this.terminal.options.theme = theme === 'dark' ? DARK_THEME : LIGHT_THEME;
    }
  }

  /**
   * 聚焦终端
   */
  focus(): void {
    this.terminal?.focus();
  }

  /**
   * 清空终端内容
   */
  clear(): void {
    this.terminal?.clear();
  }

  /**
   * 写入内容到终端（本地，不通过 WebSocket）
   */
  write(data: string): void {
    this.terminal?.write(data);
  }

  /**
   * 关闭 WebSocket 连接（服务端会自动 kill PTY）
   */
  closeWebSocket(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }

  /**
   * 完全销毁：释放终端、WebSocket、ResizeObserver
   */
  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;

    this.closeWebSocket();
    this.detachTerminal();

    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
    }

    this.container = null;
  }

  /**
   * 是否已销毁
   */
  isDisposed(): boolean {
    return this._disposed;
  }

  // --------------------------------------------------------------------------
  // 私有方法
  // --------------------------------------------------------------------------

  private attachTerminal(container: HTMLElement, theme: 'dark' | 'light'): void {
    this.container = container;

    // 注入 xterm CSS 到 shadow root（或 document）
    this.injectCSS(container);

    // 创建终端实例
    this.terminal = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
      theme: theme === 'dark' ? DARK_THEME : LIGHT_THEME,
      allowProposedApi: true,
      scrollback: 5000,
    });

    // 加载插件
    this.fitAddon = new FitAddon();
    this.webLinksAddon = new WebLinksAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(this.webLinksAddon);

    // 挂载到 DOM
    this.terminal.open(container);

    // 延迟 fit 以确保容器有尺寸
    requestAnimationFrame(() => {
      this.fit();
    });

    // 监听容器 resize
    this.resizeObserver = new ResizeObserver(() => {
      this.fit();
    });
    this.resizeObserver.observe(container);

    // 终端输入 → WebSocket
    this.terminal.onData((data: string) => {
      this.sendInput(data);
    });
  }

  /**
   * 释放当前挂载的 xterm 实例，但保留 WebSocket 连接
   */
  private detachTerminal(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }

    this.fitAddon = null;
    this.webLinksAddon = null;
    this.container = null;
  }

  // --------------------------------------------------------------------------
  /**
   * 将 xterm CSS 注入到容器所在的 shadow root 或 document
   */
  private injectCSS(container: HTMLElement): void {
    const root = container.getRootNode() as ShadowRoot | Document;
    // 检查是否已注入
    if (root.querySelector?.('style[data-xterm-css]')) return;

    this.styleElement = document.createElement('style');
    this.styleElement.setAttribute('data-xterm-css', '');
    this.styleElement.textContent = XTERM_CSS;

    if (root instanceof ShadowRoot) {
      root.appendChild(this.styleElement);
    } else {
      (root as Document).head.appendChild(this.styleElement);
    }
  }
}

/**
 * 检查服务端终端功能是否可用
 */
export async function checkTerminalAvailable(
  ip: string,
  port: number,
): Promise<boolean> {
  try {
    const res = await fetch(`http://${ip}:${port}/ai/terminal/status`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.available === true;
  } catch {
    return false;
  }
}
