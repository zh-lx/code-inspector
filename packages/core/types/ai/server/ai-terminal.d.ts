/// <reference types="node" />
import http from 'http';
import type { ResolvedAIOptions } from './ai';
declare function tryRequire(specifier: string): any | null;
declare function ensureExecutableBit(filePath: string): boolean;
declare function isExecutableFile(filePath: string): boolean;
declare function resolveSpawnCommand(command: string): string | null;
declare function resolveSpawnCwd(requestedCwd: string | undefined, projectRootPath: string): string;
declare function normalizeSpawnEnv(env: Record<string, string | undefined>): Record<string, string>;
export declare const __TEST_ONLY__: {
    isExecutableFile: typeof isExecutableFile;
    ensureExecutableBit: typeof ensureExecutableBit;
    resolveSpawnCommand: typeof resolveSpawnCommand;
    resolveSpawnCwd: typeof resolveSpawnCwd;
    normalizeSpawnEnv: typeof normalizeSpawnEnv;
    tryRequire: typeof tryRequire;
};
/**
 * 将终端 WebSocket 挂载到 HTTP 服务器
 * 使用 `noServer` 模式，通过 `upgrade` 事件仅处理 `/ai/terminal` 路径
 */
export declare function attachTerminalWebSocket(server: http.Server, getAIOptionsFn: () => ResolvedAIOptions | undefined, projectRootPath: string): Promise<boolean>;
/**
 * 检查终端功能是否可用
 */
export declare function isTerminalAvailable(): boolean;
export declare function getTerminalAvailabilityStatus(): {
    available: boolean;
    reason?: string;
};
export {};
