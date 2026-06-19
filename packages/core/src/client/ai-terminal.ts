/** Browser terminal manager built on xterm.js. */
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import type { ITheme } from '@xterm/xterm';
import type { ChatProvider } from './ai';


const XTERM_CSS = `
.xterm {
  height: 100%;
  width: 100%;
  cursor: text;
  position: relative;
  background-color: inherit;
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
  background-color: inherit; overflow-y: scroll; cursor: default;
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
  position: absolute; top: 0; right: 0; pointer-events: none;
}
.xterm-decoration-top { z-index: 2; position: relative; }

.xterm .xterm-scrollable-element > .scrollbar { cursor: default; }
.xterm .xterm-scrollable-element > .scrollbar.vertical,
.xterm .xterm-scrollable-element > .scrollbar.vertical > .slider { width: 8px !important; }
.xterm .xterm-scrollable-element > .scrollbar.horizontal,
.xterm .xterm-scrollable-element > .scrollbar.horizontal > .slider { height: 8px !important; }
.xterm .xterm-scrollable-element > .scrollbar > .slider { border-radius: 4px; }

[data-terminal-provider="opencode"] .xterm .xterm-scrollable-element > .scrollbar.vertical > .slider { width: 0px !important; }
[data-terminal-provider="opencode"] .xterm .xterm-scrollable-element { height: 100% !important; bottom: 0 !important; }
[data-terminal-provider="opencode"] .xterm .xterm-scrollable-element > .scrollbar.horizontal,
[data-terminal-provider="opencode"] .xterm .xterm-scrollable-element > .scrollbar.horizontal > .slider {
  height: 0px !important;
  display: none !important;
}
`;


const DARK_THEME: ITheme = {
  background: '#2e3440',
  foreground: '#d8dee9',
  cursor: '#88c0d0',
  cursorAccent: '#2e3440',
  selectionBackground: '#4c566a',
  selectionForeground: '#ffffff',
  black: '#3b4252',
  red: '#bf616a',
  green: '#a3be8c',
  yellow: '#ebcb8b',
  blue: '#81a1c1',
  magenta: '#b48ead',
  cyan: '#88c0d0',
  white: '#e5e9f0',
  brightBlack: '#4c566a',
  brightRed: '#d08770',
  brightGreen: '#a3be8c',
  brightYellow: '#ebcb8b',
  brightBlue: '#81a1c1',
  brightMagenta: '#b48ead',
  brightCyan: '#8fbcbb',
  brightWhite: '#ffffff',
};

const LIGHT_THEME: ITheme = {
  background: '#eceff4',
  foreground: '#2e3440',
  cursor: '#5e81ac',
  cursorAccent: '#eceff4',
  selectionBackground: '#d8dee9',
  selectionForeground: '#000000',
  black: '#3b4252',
  red: '#a34b5c',
  green: '#5f7a60',
  yellow: '#8f6f3e',
  blue: '#4c6f97',
  magenta: '#8a5d83',
  cyan: '#4f8a94',
  white: '#7b88a1',
  brightBlack: '#4c566a',
  brightRed: '#8f3f4f',
  brightGreen: '#4f6b53',
  brightYellow: '#7a5f33',
  brightBlue: '#3f5f84',
  brightMagenta: '#744c70',
  brightCyan: '#3f727b',
  brightWhite: '#d8dee9',
};

function terminalThemeFor(theme: 'dark' | 'light'): ITheme {
  return theme === 'dark' ? DARK_THEME : LIGHT_THEME;
}

function terminalBackgroundFor(theme: 'dark' | 'light'): string {
  return (
    terminalThemeFor(theme).background ||
    (theme === 'dark' ? '#2e3440' : '#eceff4')
  );
}

function terminalCursorFor(theme: 'dark' | 'light'): string {
  return (
    terminalThemeFor(theme).cursor ||
    (theme === 'dark' ? '#88c0d0' : '#5e81ac')
  );
}

const LIGHT_SURFACE_BACKGROUND_RGB = [236, 239, 244] as const;
const LIGHT_FOREGROUND_RGB = [46, 52, 64] as const;
const DARK_SURFACE_BACKGROUND_RGB = [46, 52, 64] as const;
const DARK_FOREGROUND_RGB = [216, 222, 233] as const;
const DARK_BACKGROUND_THRESHOLD = 64;
const LIGHT_BACKGROUND_THRESHOLD = 200;
const MAX_TERMINAL_REPLAY_BUFFER = 500_000;
const DEFAULT_TERMINAL_OVERVIEW_RULER_WIDTH = 10;
const MINIMUM_TERMINAL_COLS = 2;
const MINIMUM_TERMINAL_ROWS = 1;
const DARK_ANSI_COLOR_INDICES = new Set([
  0,
  232,
  233,
  234,
  235,
  236,
  237,
]);
const LIGHT_ANSI_COLOR_INDICES = new Set([15, 231, 252, 253, 254, 255]);

function isDarkRgb(r: number, g: number, b: number): boolean {
  return (
    Number.isFinite(r) &&
    Number.isFinite(g) &&
    Number.isFinite(b) &&
    r <= DARK_BACKGROUND_THRESHOLD &&
    g <= DARK_BACKGROUND_THRESHOLD &&
    b <= DARK_BACKGROUND_THRESHOLD
  );
}

function isLightRgb(r: number, g: number, b: number): boolean {
  return (
    Number.isFinite(r) &&
    Number.isFinite(g) &&
    Number.isFinite(b) &&
    r >= LIGHT_BACKGROUND_THRESHOLD &&
    g >= LIGHT_BACKGROUND_THRESHOLD &&
    b >= LIGHT_BACKGROUND_THRESHOLD
  );
}

function rgbSgrParams(
  kind: 'foreground' | 'background',
  rgb: readonly number[],
): string[] {
  const [r, g, b] = rgb;
  return [
    kind === 'foreground' ? '38' : '48',
    '2',
    String(r),
    String(g),
    String(b),
  ];
}

function themedForegroundParams(theme: 'dark' | 'light'): string[] {
  return rgbSgrParams(
    'foreground',
    theme === 'light' ? LIGHT_FOREGROUND_RGB : DARK_FOREGROUND_RGB,
  );
}

function themedBackgroundParams(theme: 'dark' | 'light'): string[] {
  return rgbSgrParams(
    'background',
    theme === 'light'
      ? LIGHT_SURFACE_BACKGROUND_RGB
      : DARK_SURFACE_BACKGROUND_RGB,
  );
}

function normalizeTerminalSgr(
  paramsText: string,
  theme: 'dark' | 'light',
): string {
  if (!paramsText) return paramsText;

  const params = paramsText.split(';');
  const normalized: string[] = [];

  for (let i = 0; i < params.length; i += 1) {
    const param = params[i];

    if (theme === 'light' && (param === '37' || param === '97')) {
      normalized.push(...themedForegroundParams(theme));
      continue;
    }

    if (theme === 'dark' && (param === '30' || param === '90')) {
      normalized.push(...themedForegroundParams(theme));
      continue;
    }

    if (theme === 'light' && (param === '40' || param === '100')) {
      normalized.push(...themedBackgroundParams(theme));
      continue;
    }

    if (theme === 'dark' && (param === '47' || param === '107')) {
      normalized.push(...themedBackgroundParams(theme));
      continue;
    }

    if (param === '38' && params[i + 1] === '2') {
      const r = Number(params[i + 2]);
      const g = Number(params[i + 3]);
      const b = Number(params[i + 4]);
      if (
        (theme === 'light' && isLightRgb(r, g, b)) ||
        (theme === 'dark' && isDarkRgb(r, g, b))
      ) {
        normalized.push(...themedForegroundParams(theme));
        i += 4;
        continue;
      }
    }

    if (param === '38' && params[i + 1] === '5') {
      const colorIndex = Number(params[i + 2]);
      if (
        (theme === 'light' && LIGHT_ANSI_COLOR_INDICES.has(colorIndex)) ||
        (theme === 'dark' && DARK_ANSI_COLOR_INDICES.has(colorIndex))
      ) {
        normalized.push(...themedForegroundParams(theme));
        i += 2;
        continue;
      }
    }

    if (param === '48' && params[i + 1] === '2') {
      const r = Number(params[i + 2]);
      const g = Number(params[i + 3]);
      const b = Number(params[i + 4]);
      if (
        (theme === 'light' && isDarkRgb(r, g, b)) ||
        (theme === 'dark' && isLightRgb(r, g, b))
      ) {
        normalized.push(...themedBackgroundParams(theme));
        i += 4;
        continue;
      }
    }

    if (param === '48' && params[i + 1] === '5') {
      const colorIndex = Number(params[i + 2]);
      if (
        (theme === 'light' && DARK_ANSI_COLOR_INDICES.has(colorIndex)) ||
        (theme === 'dark' && LIGHT_ANSI_COLOR_INDICES.has(colorIndex))
      ) {
        normalized.push(...themedBackgroundParams(theme));
        i += 2;
        continue;
      }
    }

    normalized.push(param);
  }

  return normalized.join(';');
}

function normalizeTerminalOutputForTheme(
  data: string,
  theme: 'dark' | 'light',
): string {
  const normalizedSgr = data.replace(
    /\x1b\[([0-9;]*)m/g,
    (match, paramsText: string) => {
      const normalizedParams = normalizeTerminalSgr(paramsText, theme);
      return normalizedParams === paramsText
        ? match
        : `\x1b[${normalizedParams}m`;
    },
  );

  return normalizedSgr.replace(
    /\x1b\]12;([^\x07\x1b\x9c]*)(\x07|\x1b\\|\x9c)/g,
    (match, cursorColor: string, terminator: string) => {
      if (!cursorColor.trim() || cursorColor.trim() === '?') {
        return match;
      }

      return `\x1b]12;${terminalCursorFor(theme)}${terminator}`;
    },
  );
}


interface TerminalCreateMessage {
  type: 'create';
  provider: ChatProvider;
  prompt?: string;
  sessionId?: string;
  runtimeSessionId?: string;
  runtimeCursor?: number;
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

interface ServerSessionMessage {
  type: 'runtime_session';
  runtimeSessionId: string;
  runtimeKind?: string;
  seq?: number;
}

interface ServerRuntimeStateMessage {
  type: 'runtime_state';
  status: string;
  reason?: string;
  seq?: number;
}

type ServerMessage =
  | ServerOutputMessage
  | ServerExitMessage
  | ServerErrorMessage
  | ServerSessionMessage
  | ServerRuntimeStateMessage;


export class AITerminalManager {
  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private webLinksAddon: WebLinksAddon | null = null;
  private ws: WebSocket | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private _disposed = false;
  private currentTheme: 'dark' | 'light' = 'dark';
  private currentProvider: ChatProvider = 'claudeCode';
  private outputHistory: string[] = [];
  private outputHistoryLength = 0;

  onExit?: (code: number) => void;
  onError?: (message: string) => void;
  onRuntimeSession?: (runtimeSessionId: string, kind?: string) => void;
  onRuntimeCursor?: (cursor: number) => void;

  constructor(
    private ip: string,
    private port: number,
  ) {}

  mount(
    container: HTMLElement,
    theme: 'dark' | 'light',
    provider: ChatProvider = this.currentProvider,
  ): void {
    this.currentProvider = provider;
    this.attachTerminal(container, theme);
  }

  remount(
    container: HTMLElement,
    theme: 'dark' | 'light',
    provider: ChatProvider = this.currentProvider,
  ): void {
    if (this._disposed) return;
    this.currentProvider = provider;
    if (this.container === container && this.terminal) {
      this.applyProviderLayout();
      this.setTheme(theme);
      this.fit();
      return;
    }

    this.detachTerminal();
    this.attachTerminal(container, theme);
  }

  connect(options: {
    provider: ChatProvider;
    prompt?: string;
    sessionId?: string;
    runtimeSessionId?: string;
    runtimeCursor?: number;
    cwd: string;
    model?: string;
  }): void {
    this.closeWebSocket();
    this.clearOutputHistory();
    this.currentProvider = options.provider;
    this.applyProviderLayout();

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${this.ip}:${this.port}/ai/terminal`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      const createMsg: TerminalCreateMessage = {
        type: 'create',
        provider: options.provider,
        prompt: options.prompt,
        sessionId: options.sessionId,
        runtimeSessionId: options.runtimeSessionId,
        runtimeCursor: options.runtimeCursor,
        cwd: options.cwd,
        model: options.model,
      };
      this.ws!.send(JSON.stringify(createMsg));

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
        this.write(msg.data);
      } else if (msg.type === 'exit') {
        this.onExit?.(msg.code);
      } else if (msg.type === 'error') {
        this.write(`\r\n\x1b[31m${msg.message}\x1b[0m\r\n`);
        this.onError?.(msg.message);
      } else if (msg.type === 'runtime_session') {
        this.onRuntimeSession?.(msg.runtimeSessionId, msg.runtimeKind);
        if (typeof msg.seq === 'number') {
          this.onRuntimeCursor?.(msg.seq);
        }
      } else if (msg.type === 'runtime_state') {
        if (typeof msg.seq === 'number') {
          this.onRuntimeCursor?.(msg.seq);
        }
      }
    };

    this.ws.onclose = () => {
    };

    this.ws.onerror = () => {
      this.onError?.('WebSocket connection failed');
    };
  }

  sendInput(data: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg: TerminalInputMessage = { type: 'input', data };
      this.ws.send(JSON.stringify(msg));
    }
  }

  fit(): void {
    if (!this.fitAddon || !this.terminal || !this.container) return;
    try {
      const dims = this.proposeDimensions();
      if (!dims) return;
      if (
        this.terminal.cols !== dims.cols ||
        this.terminal.rows !== dims.rows
      ) {
        this.terminal.resize(dims.cols, dims.rows);
      }
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const msg: TerminalResizeMessage = {
          type: 'resize',
          cols: dims.cols,
          rows: dims.rows,
        };
        this.ws.send(JSON.stringify(msg));
      }
    } catch {
    }
  }


  private proposeDimensions(): { cols: number; rows: number } | null {
    if (!this.terminal || !this.container) return null;

    const terminalElement = (this.terminal as any).element as
      | HTMLElement
      | undefined;
    const renderDimensions = (this.terminal as any)?._core?._renderService
      ?.dimensions;

    if (!terminalElement || !terminalElement.parentElement || !renderDimensions) {
      return null;
    }

    const cellWidth = renderDimensions.css?.cell?.width;
    const cellHeight = renderDimensions.css?.cell?.height;
    if (!cellWidth || !cellHeight) {
      return null;
    }

    const parentElementStyle = window.getComputedStyle(
      terminalElement.parentElement,
    );
    const parentElementHeight = Math.max(
      0,
      parseInt(parentElementStyle.getPropertyValue('height')) || 0,
    );
    const parentElementWidth = Math.max(
      0,
      parseInt(parentElementStyle.getPropertyValue('width')) || 0,
    );
    const elementStyle = window.getComputedStyle(terminalElement);
    const elementPaddingTop =
      parseInt(elementStyle.getPropertyValue('padding-top')) || 0;
    const elementPaddingBottom =
      parseInt(elementStyle.getPropertyValue('padding-bottom')) || 0;
    const elementPaddingRight =
      parseInt(elementStyle.getPropertyValue('padding-right')) || 0;
    const elementPaddingLeft =
      parseInt(elementStyle.getPropertyValue('padding-left')) || 0;
    const elementPaddingVer = elementPaddingTop + elementPaddingBottom;
    const elementPaddingHor = elementPaddingRight + elementPaddingLeft;
    const scrollbarWidth =
      this.terminal.options.scrollback === 0 ? 0 : this.getOverviewRulerWidth();
    const availableHeight = parentElementHeight - elementPaddingVer;
    const availableWidth =
      parentElementWidth - elementPaddingHor - scrollbarWidth;

    return {
      cols: Math.max(
        MINIMUM_TERMINAL_COLS,
        Math.floor(availableWidth / cellWidth),
      ),
      rows: Math.max(
        MINIMUM_TERMINAL_ROWS,
        Math.floor(availableHeight / cellHeight),
      ),
    };
  }
  setTheme(theme: 'dark' | 'light'): void {
    const shouldReplayOutput = this.currentTheme !== theme;
    this.currentTheme = theme;
    if (this.container) {
      this.container.style.backgroundColor = terminalBackgroundFor(theme);
    }
    if (this.terminal) {
      this.terminal.options.theme = terminalThemeFor(theme);
      if (shouldReplayOutput) {
        this.replayOutputHistory();
      }
    }
  }

  focus(): void {
    this.terminal?.focus();
  }

  clear(): void {
    this.terminal?.clear();
    this.clearOutputHistory();
  }

  write(data: string): void {
    this.rememberOutput(data);
    this.renderOutput(data);
  }

  private renderOutput(data: string): void {
    this.terminal?.write(
      this.currentProvider === 'opencode'
        ? data
        : normalizeTerminalOutputForTheme(data, this.currentTheme),
    );
  }

  private getOverviewRulerWidth(): number {
    return this.currentProvider === 'opencode'
      ? 0
      : DEFAULT_TERMINAL_OVERVIEW_RULER_WIDTH;
  }

  private applyProviderLayout(): void {
    if (this.container) {
      this.container.dataset.terminalProvider = this.currentProvider;
    }
    if (this.terminal) {
      this.terminal.options.overviewRuler = {
        width: this.getOverviewRulerWidth(),
      };
      if (this.fitAddon && this.container) {
        this.fit();
      }
    }
  }


  private rememberOutput(data: string): void {
    if (!data) return;

    this.outputHistory.push(data);
    this.outputHistoryLength += data.length;

    while (
      this.outputHistoryLength > MAX_TERMINAL_REPLAY_BUFFER &&
      this.outputHistory.length > 1
    ) {
      const removed = this.outputHistory.shift();
      this.outputHistoryLength -= removed?.length || 0;
    }
  }

  private clearOutputHistory(): void {
    this.outputHistory = [];
    this.outputHistoryLength = 0;
  }

  private replayOutputHistory(): void {
    if (!this.terminal || this.outputHistory.length === 0) return;

    this.terminal.reset();
    this.renderOutput(this.outputHistory.join(''));
  }

  closeWebSocket(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
      }
      this.ws = null;
    }
  }

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

  isDisposed(): boolean {
    return this._disposed;
  }


  private attachTerminal(container: HTMLElement, theme: 'dark' | 'light'): void {
    this.container = container;
    this.currentTheme = theme;
    this.container.style.backgroundColor = terminalBackgroundFor(theme);
    this.container.dataset.terminalProvider = this.currentProvider;

    this.injectCSS(container);

    this.terminal = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
      theme: terminalThemeFor(theme),
      minimumContrastRatio: 4.5,
      overviewRuler: { width: this.getOverviewRulerWidth() },
      allowProposedApi: true,
      scrollback: 5000,
    });

    this.fitAddon = new FitAddon();
    this.webLinksAddon = new WebLinksAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(this.webLinksAddon);

    this.terminal.open(container);
    this.applyProviderLayout();

    requestAnimationFrame(() => {
      this.fit();
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.fit();
    });
    this.resizeObserver.observe(container);

    this.terminal.onData((data: string) => {
      this.sendInput(data);
    });
  }

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

  private injectCSS(container: HTMLElement): void {
    const root = container.getRootNode() as ShadowRoot | Document;
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

