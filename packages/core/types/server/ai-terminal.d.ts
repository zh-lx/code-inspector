/// <reference types="node" />
/**
 * 终端模块 - 基于 node-pty 和 WebSocket 提供原生 CLI 终端体验
 */
import http from 'http';
import type { ResolvedAIOptions } from './ai';
/**
 * 将终端 WebSocket 挂载到 HTTP 服务器
 * 使用 `noServer` 模式，通过 `upgrade` 事件仅处理 `/ai/terminal` 路径
 */
export declare function attachTerminalWebSocket(server: http.Server, getAIOptionsFn: () => ResolvedAIOptions | undefined, projectRootPath: string): Promise<boolean>;
/**
 * 检查终端功能是否可用
 */
export declare function isTerminalAvailable(): boolean;
