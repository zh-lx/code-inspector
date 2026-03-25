/**
 * 终端模块 - 基于 node-pty 和 WebSocket 提供原生 CLI 终端体验
 */
import http from 'http';
import type {
  ClaudeCliOptions,
  CodexCliOptions,
} from '../shared';
import type { AIProviderType, ResolvedAIOptions } from './ai';
import { getEnvVars } from './server';
import { findClaudeCodeCli } from './ai-provider-claude';
import { findCodexCli, CODEX_PROVIDER_RUNTIME } from './ai-provider-common';
import { OPENCODE_PROVIDER_RUNTIME } from './ai-provider-opencode';

// ============================================================================
// 动态加载 node-pty 和 ws（可选依赖，加载失败则终端功能不可用）
// ============================================================================

type NodePtyModule = typeof import('node-pty');
type WsModule = any;

let terminalFeatureAvailable = false;

function getRuntimeRequire(): NodeJS.Require | null {
  try {
    return Function(
      'return typeof require !== "undefined" ? require : null',
    )() as NodeJS.Require | null;
  } catch {
    return null;
  }
}

async function tryDynamicImport(specifier: string): Promise<any | null> {
  try {
    return await Function(
      's',
      'return import(s)',
    )(specifier);
  } catch {
    return null;
  }
}

function tryRequire(specifier: string): any | null {
  const runtimeRequire = getRuntimeRequire();
  if (!runtimeRequire) return null;
  try {
    return runtimeRequire(specifier);
  } catch {
    return null;
  }
}

/**
 * 通用可选模块加载器：动态 import → require，加载后通过 normalize 校验/提取
 */
async function loadOptionalModule<T>(
  specifier: string,
  cache: { value: T | null },
  normalize: (mod: any) => T | null,
): Promise<T | null> {
  if (cache.value) return cache.value;
  const imported = normalize(await tryDynamicImport(specifier));
  if (imported) {
    cache.value = imported;
    return imported;
  }
  const required = normalize(tryRequire(specifier));
  if (required) {
    cache.value = required;
    return required;
  }
  return null;
}

function normalizeNodePtyModule(mod: any): NodePtyModule | null {
  const candidates = [mod, mod?.default];
  for (const candidate of candidates) {
    if (candidate && typeof candidate.spawn === 'function') {
      return candidate as NodePtyModule;
    }
  }
  return null;
}

function normalizeWsModule(mod: any): WsModule | null {
  const candidates = [mod, mod?.default];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const WebSocketServer = candidate.WebSocketServer || candidate.Server;
    if (!WebSocketServer) continue;
    if (typeof candidate === 'function') {
      const wsCtor = candidate;
      return Object.assign(wsCtor, {
        WebSocket: wsCtor.WebSocket || wsCtor,
        WebSocketServer,
        Server: candidate.Server || WebSocketServer,
      });
    }
    return {
      ...candidate,
      WebSocket: candidate.WebSocket || candidate.default || null,
      WebSocketServer,
      Server: candidate.Server || WebSocketServer,
    };
  }
  return null;
}

const nodePtyCache = { value: null as NodePtyModule | null };
const wsCache = { value: null as WsModule | null };

const loadNodePty = () => loadOptionalModule('node-pty', nodePtyCache, normalizeNodePtyModule);
const loadWs = () => loadOptionalModule('ws', wsCache, normalizeWsModule);

// ============================================================================
// 终端会话管理
// ============================================================================

interface TerminalSession {
  id: string;
  pty: import('node-pty').IPty;
  provider: AIProviderType;
  cwd: string;
  createdAt: number;
}

const sessions = new Map<string, TerminalSession>();

function generateSessionId(): string {
  return `term-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function destroySession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    try {
      session.pty.kill();
    } catch {
      // 进程可能已退出
    }
    sessions.delete(sessionId);
  }
}

function destroyAllSessions(): void {
  sessions.forEach((_session, sessionId) => {
    destroySession(sessionId);
  });
}

// ============================================================================
// CLI 命令构建（原生模式，不带 JSON 输出格式参数）
// ============================================================================

interface NativeCliCommand {
  command: string;
  args: string[];
  env: Record<string, string | undefined>;
}

function buildClaudeNativeCommand(
  cliPath: string,
  prompt: string,
  sessionId: string | undefined,
  options: ClaudeCliOptions,
): NativeCliCommand {
  const args: string[] = [];

  // 有 prompt 时使用非交互模式，无 prompt 时启动交互式终端
  if (prompt) {
    args.push('-p', prompt, '--verbose');
  }

  // 权限模式：交互式终端（无 prompt）不强制设置，让 CLI 用自身默认值
  const permissionMode = options.permissionMode || (prompt ? 'bypassPermissions' : '');
  if (permissionMode) {
    args.push('--permission-mode', permissionMode);
  }

  if (sessionId) {
    args.push('--resume', sessionId);
  }
  if (options.model) {
    args.push('--model', options.model);
  }
  if (options.allowedTools && options.allowedTools.length > 0) {
    args.push('--allowedTools', options.allowedTools.join(','));
  }
  if (options.disallowedTools && options.disallowedTools.length > 0) {
    args.push('--disallowedTools', options.disallowedTools.join(','));
  }
  if (
    typeof options.maxTurns === 'number' &&
    Number.isFinite(options.maxTurns) &&
    options.maxTurns > 0
  ) {
    args.push('--max-turns', String(options.maxTurns));
  }
  if (
    typeof options.maxCost === 'number' &&
    Number.isFinite(options.maxCost) &&
    options.maxCost > 0
  ) {
    args.push('--max-cost', String(options.maxCost));
  }
  const systemPrompt = options.systemPrompt;
  if (typeof systemPrompt === 'string' && systemPrompt.trim()) {
    args.push('--system-prompt', systemPrompt);
  } else if (
    systemPrompt &&
    typeof systemPrompt === 'object' &&
    systemPrompt.type === 'preset' &&
    systemPrompt.append?.trim()
  ) {
    args.push('--append-system-prompt', systemPrompt.append);
  }
  if (options.mcpServers && Object.keys(options.mcpServers).length > 0) {
    args.push('--mcp-config', JSON.stringify({ mcpServers: options.mcpServers }));
  }

  return {
    command: cliPath,
    args,
    env: { ...getEnvVars(), ...options.env },
  };
}

function buildCodexNativeCommand(
  cliPath: string,
  prompt: string,
  sessionId: string | undefined,
  options: CodexCliOptions,
): NativeCliCommand {
  const args: string[] = [];

  // 有 prompt 时使用 exec 模式，无 prompt 时启动交互式终端
  if (prompt || sessionId) {
    if (sessionId) {
      args.push('exec', 'resume');
    } else {
      args.push('exec');
    }
  }

  // 模型
  if (options.model) {
    args.push('-m', options.model);
  }
  if (options.profile) {
    args.push('-p', options.profile);
  }
  if (options.sandbox) {
    args.push('-s', options.sandbox);
  }
  if (options.fullAuto) {
    args.push('--full-auto');
  }
  if (options.skipGitRepoCheck) {
    args.push('--skip-git-repo-check');
  }
  if (options.ephemeral) {
    args.push('--ephemeral');
  }
  if (options.config) {
    for (const [key, value] of Object.entries(options.config)) {
      args.push('-c', `${key}=${value}`);
    }
  }

  if (sessionId) {
    args.push(sessionId);
    if (prompt) args.push(prompt);
  } else if (prompt) {
    args.push(prompt);
  }

  return {
    command: cliPath,
    args,
    env: { ...getEnvVars(), ...options.env },
  };
}

function buildOpenCodeNativeCommand(
  cliPath: string,
  prompt: string,
  sessionId: string | undefined,
  options: CodexCliOptions,
): NativeCliCommand {
  const args = ['run'];

  if (options.model) {
    args.push('-m', options.model);
  }
  if (options.profile) {
    args.push('--agent', options.profile);
  }
  if (sessionId) {
    args.push('--session', sessionId);
  }

  if (prompt) {
    args.push(prompt);
  }

  return {
    command: cliPath,
    args,
    env: { ...getEnvVars(), ...options.env },
  };
}

/**
 * 为指定 provider 构建原生 CLI 命令
 */
function buildNativeCliCommand(
  provider: AIProviderType,
  prompt: string,
  sessionId: string | undefined,
  model: string | undefined,
  aiOptions: ResolvedAIOptions | undefined,
): NativeCliCommand | null {
  // 交互式终端模式（无 prompt）：只启动裸 CLI，完全复用本地终端配置
  const interactive = !prompt && !sessionId;

  if (provider === 'claudeCode') {
    const cliPath = findClaudeCodeCli();
    if (!cliPath) return null;
    if (interactive) {
      return { command: cliPath, args: [], env: getEnvVars() };
    }
    const providerOpts = aiOptions?.claudeCode;
    const cliOpts: ClaudeCliOptions =
      providerOpts && providerOpts.type !== 'sdk'
        ? (providerOpts.options || {})
        : {};
    if (model) cliOpts.model = model;
    return buildClaudeNativeCommand(cliPath, prompt, sessionId, cliOpts);
  }

  if (provider === 'codex') {
    const cliPath = findCodexCli(CODEX_PROVIDER_RUNTIME);
    if (!cliPath) return null;
    if (interactive) {
      return { command: cliPath, args: [], env: getEnvVars() };
    }
    const providerOpts = aiOptions?.codex;
    const cliOpts: CodexCliOptions =
      providerOpts && providerOpts.type !== 'sdk'
        ? (providerOpts.options || {})
        : {};
    if (model) cliOpts.model = model;
    return buildCodexNativeCommand(cliPath, prompt, sessionId, cliOpts);
  }

  if (provider === 'opencode') {
    const cliPath = findCodexCli(OPENCODE_PROVIDER_RUNTIME);
    if (!cliPath) return null;
    if (interactive) {
      return { command: cliPath, args: [], env: getEnvVars() };
    }
    const providerOpts = aiOptions?.opencode;
    const cliOpts: CodexCliOptions =
      providerOpts && providerOpts.type !== 'sdk'
        ? ((providerOpts.options || {}) as CodexCliOptions)
        : {};
    if (model) cliOpts.model = model;
    return buildOpenCodeNativeCommand(cliPath, prompt, sessionId, cliOpts);
  }

  return null;
}

// ============================================================================
// WebSocket 通信协议
// ============================================================================

/** 客户端 → 服务端消息 */
type ClientMessage =
  | {
      type: 'create';
      provider: AIProviderType;
      prompt?: string;
      sessionId?: string;
      cwd: string;
      model?: string;
    }
  | { type: 'input'; data: string }
  | { type: 'resize'; cols: number; rows: number };

/** 服务端 → 客户端消息 */
type ServerMessage =
  | { type: 'output'; data: string }
  | { type: 'exit'; code: number }
  | { type: 'error'; message: string };

function sendWsMessage(ws: any, msg: ServerMessage): void {
  try {
    ws.send(JSON.stringify(msg));
  } catch {
    // WebSocket 可能已关闭
  }
}

// ============================================================================
// WebSocket 升级处理
// ============================================================================

/**
 * 将终端 WebSocket 挂载到 HTTP 服务器
 * 使用 `noServer` 模式，通过 `upgrade` 事件仅处理 `/ai/terminal` 路径
 */
export async function attachTerminalWebSocket(
  server: http.Server,
  getAIOptionsFn: () => ResolvedAIOptions | undefined,
  projectRootPath: string,
): Promise<boolean> {
  const pty = await loadNodePty();
  const WS = await loadWs();

  if (!pty || !WS) {
    terminalFeatureAvailable = false;
    return false;
  }

  // ws 的 ESM/CJS 互操作在不同打包/运行环境下可能拿到不同形态的导出：
  // - `require('ws')` => WebSocket (含 .Server/.WebSocketServer)
  // - `import('ws')`  => { default: WebSocket }
  // 这里不要兜底到 `WS` 本身，否则可能误把 WebSocket 当成 WebSocketServer，
  // 从而触发 `new WebSocket({ noServer: true })` → Invalid URL。
  const WebSocketServerCtor = (WS as any).WebSocketServer || (WS as any).Server;
  if (!WebSocketServerCtor) {
    terminalFeatureAvailable = false;
    return false;
  }

  let wss: any;
  try {
    wss = new WebSocketServerCtor({ noServer: true });
    if (typeof wss?.handleUpgrade !== 'function') {
      terminalFeatureAvailable = false;
      return false;
    }
  } catch {
    terminalFeatureAvailable = false;
    return false;
  }

  terminalFeatureAvailable = true;

  server.on('upgrade', (req: http.IncomingMessage, socket: any, head: Buffer) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    if (url.pathname !== '/ai/terminal') {
      return; // 不处理非终端路径，留给其他 WebSocket 处理
    }

    wss.handleUpgrade(req, socket, head, (ws: any) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws: any) => {
    let currentSessionId: string | null = null;

    ws.on('message', (rawData: any) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(typeof rawData === 'string' ? rawData : rawData.toString());
      } catch {
        sendWsMessage(ws, { type: 'error', message: 'Invalid JSON message' });
        return;
      }

      if (msg.type === 'create') {
        // 如果已有会话，先销毁
        if (currentSessionId) {
          destroySession(currentSessionId);
        }

        const aiOptions = getAIOptionsFn();
        const cmd = buildNativeCliCommand(
          msg.provider,
          msg.prompt || '',
          msg.sessionId,
          msg.model,
          aiOptions,
        );

        if (!cmd) {
          sendWsMessage(ws, {
            type: 'error',
            message: `CLI for ${msg.provider} not found. Please install it first.`,
          });
          return;
        }

        const cwd = msg.cwd || projectRootPath || process.cwd();
        const sessionId = generateSessionId();
        currentSessionId = sessionId;

        try {
          const ptyProcess = pty!.spawn(cmd.command, cmd.args, {
            name: 'xterm-256color',
            cols: 80,
            rows: 24,
            cwd,
            env: cmd.env as Record<string, string>,
          });

          const session: TerminalSession = {
            id: sessionId,
            pty: ptyProcess,
            provider: msg.provider,
            cwd,
            createdAt: Date.now(),
          };
          sessions.set(sessionId, session);

          // PTY 输出 → WebSocket
          ptyProcess.onData((data: string) => {
            sendWsMessage(ws, { type: 'output', data });
          });

          // PTY 退出
          ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
            sendWsMessage(ws, { type: 'exit', code: exitCode });
            sessions.delete(sessionId);
            if (currentSessionId === sessionId) {
              currentSessionId = null;
            }
          });
        } catch (err: any) {
          sendWsMessage(ws, {
            type: 'error',
            message: `Failed to spawn PTY: ${err?.message || err}`,
          });
        }
      } else if (msg.type === 'input') {
        if (currentSessionId) {
          const session = sessions.get(currentSessionId);
          if (session) {
            session.pty.write(msg.data);
          }
        }
      } else if (msg.type === 'resize') {
        if (currentSessionId) {
          const session = sessions.get(currentSessionId);
          if (
            session &&
            typeof msg.cols === 'number' &&
            typeof msg.rows === 'number' &&
            msg.cols > 0 &&
            msg.rows > 0
          ) {
            try {
              session.pty.resize(msg.cols, msg.rows);
            } catch {
              // resize 偶尔在进程退出后调用
            }
          }
        }
      }
    });

    ws.on('close', () => {
      if (currentSessionId) {
        destroySession(currentSessionId);
        currentSessionId = null;
      }
    });

    ws.on('error', () => {
      if (currentSessionId) {
        destroySession(currentSessionId);
        currentSessionId = null;
      }
    });
  });

  // 服务器关闭时清理所有 PTY 会话
  server.on('close', () => {
    destroyAllSessions();
  });

  return true;
}

/**
 * 检查终端功能是否可用
 */
export function isTerminalAvailable(): boolean {
  return terminalFeatureAvailable;
}
