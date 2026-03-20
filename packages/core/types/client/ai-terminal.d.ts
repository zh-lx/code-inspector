import type { ChatProvider } from './ai';
export declare class AITerminalManager {
    private ip;
    private port;
    private terminal;
    private fitAddon;
    private webLinksAddon;
    private ws;
    private container;
    private resizeObserver;
    private styleElement;
    private _disposed;
    /** 进程退出回调 */
    onExit?: (code: number) => void;
    /** 错误回调 */
    onError?: (message: string) => void;
    constructor(ip: string, port: number);
    /**
     * 将终端挂载到 DOM 容器
     */
    mount(container: HTMLElement, theme: 'dark' | 'light'): void;
    /**
     * 当弹窗容器被卸载后，重新将终端挂载到新的 DOM 容器
     */
    remount(container: HTMLElement, theme: 'dark' | 'light'): void;
    /**
     * 连接 WebSocket 并创建终端会话
     */
    connect(options: {
        provider: ChatProvider;
        prompt?: string;
        sessionId?: string;
        cwd: string;
        model?: string;
    }): void;
    /**
     * 发送用户输入到 PTY
     */
    sendInput(data: string): void;
    /**
     * 自适应终端尺寸
     */
    fit(): void;
    /**
     * 切换终端主题
     */
    setTheme(theme: 'dark' | 'light'): void;
    /**
     * 聚焦终端
     */
    focus(): void;
    /**
     * 清空终端内容
     */
    clear(): void;
    /**
     * 写入内容到终端（本地，不通过 WebSocket）
     */
    write(data: string): void;
    /**
     * 关闭 WebSocket 连接（服务端会自动 kill PTY）
     */
    closeWebSocket(): void;
    /**
     * 完全销毁：释放终端、WebSocket、ResizeObserver
     */
    dispose(): void;
    /**
     * 是否已销毁
     */
    isDisposed(): boolean;
    private attachTerminal;
    /**
     * 释放当前挂载的 xterm 实例，但保留 WebSocket 连接
     */
    private detachTerminal;
    /**
     * 将 xterm CSS 注入到容器所在的 shadow root 或 document
     */
    private injectCSS;
}
/**
 * 检查服务端终端功能是否可用
 */
export declare function checkTerminalAvailable(ip: string, port: number): Promise<boolean>;
