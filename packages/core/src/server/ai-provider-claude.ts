/**
 * Claude Code Provider - 支持本地 CLI 和 Agent SDK 两种调用方式
 */
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess, execSync } from 'child_process';
import type { AIOptions } from '../shared';
import type { AIContext, AIMessage } from './ai';
import { getEnvVars } from './server';
import chalk from 'chalk';

// ============================================================================
// Provider 统一入口
// ============================================================================

export interface ProviderCallbacks {
  sendSSE: (data: object | string) => void;
  onEnd: () => void;
}

export interface ProviderResult {
  abort: () => void;
}

/**
 * 构建完整的提示信息
 */
function buildPrompt(
  message: string,
  context: AIContext | null,
  history: AIMessage[],
  projectRootPath: string
): string {
  const parts: string[] = [];

  if (projectRootPath) {
    parts.push(`[Project] Working in project: ${projectRootPath}`);
  }

  if (context) {
    const absolutePath = path.resolve(projectRootPath, context.file);
    let fileRef = context.file;
    if (fs.existsSync(absolutePath)) {
      fileRef = `@${context.file}#${context.line}`;
    }
    parts.push(`[Context] I'm looking at a <${context.name}> component located at ${fileRef}.`);
  }

  if (history.length > 0) {
    const historyLines = history.map((msg) => {
      return msg.role === 'user' ? `[Q] ${msg.content}` : `[A] ${msg.content}`;
    });
    parts.push(`[Previous conversation]\n${historyLines.join('\n')}`);
  }

  parts.push(`[Current question] ${message}`);

  return parts.join('\n\n');
}

/**
 * 获取模型信息
 * 优先使用用户配置，否则从本地 Claude Code CLI 配置中读取
 */
export function getModelInfo(aiOptions: AIOptions | undefined): string {
  // 优先使用用户配置的 model
  if (aiOptions?.sdkOptions?.model) {
    return aiOptions.sdkOptions.model;
  }

  // 从本地 CLI 配置文件读取
  const home = process.env.HOME;
  if (!home) return '';

  try {
    const settingsPath = path.join(home, '.claude', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      // settings.model 是简写（如 "opus"），env.ANTHROPIC_MODEL 是完整 model ID
      if (settings.env?.ANTHROPIC_MODEL) {
        return settings.env.ANTHROPIC_MODEL;
      }
      if (settings.model) {
        return settings.model;
      }
    }
  } catch {
    // 读取失败，忽略
  }

  return '';
}

/**
 * Claude provider 统一入口
 * ai.ts 只需调用此函数，不感知 CLI/SDK 细节
 */
export function handleClaudeRequest(
  message: string,
  context: AIContext | null,
  history: AIMessage[],
  sessionId: string | undefined,
  cwd: string,
  aiOptions: AIOptions | undefined,
  callbacks: ProviderCallbacks,
): ProviderResult {
  const { sendSSE, onEnd } = callbacks;

  const agentType = aiOptions?.agent || 'cli';
  const cliPath = agentType === 'cli' ? findClaudeCodeCli() : null;

  let childProcess: ChildProcess | null = null;
  let aborted = false;
  const model = getModelInfo(aiOptions);

  if (agentType === 'cli' && cliPath) {
    // 使用本地 CLI
    // 有 sessionId 时使用 --resume 恢复会话，prompt 只需当前消息
    // 无 sessionId 时为首次对话，构建包含 context 的完整 prompt
    const prompt = sessionId ? message : buildPrompt(message, context, history, cwd);

    sendSSE({ type: 'info', message: 'Using local Claude Code CLI', cwd, model });

    childProcess = queryViaCli(
      cliPath,
      prompt,
      cwd,
      aiOptions,
      (jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          sendSSE(data);
        } catch {
          sendSSE({ type: 'text', content: jsonData });
        }
      },
      (error) => {
        sendSSE({ error });
      },
      () => {
        sendSSE('[DONE]');
        onEnd();
      },
      sessionId,
      (newSessionId) => {
        sendSSE({ type: 'session', sessionId: newSessionId });
      }
    );
  } else {
    // 使用 SDK（agent='sdk' 或 agent='cli' 但 CLI 未找到时回退）
    (async () => {
      try {
        sendSSE({ type: 'info', message: 'Using Claude Agent SDK', cwd, model });

        const sdkPrompt = buildPrompt(message, context, history, cwd);

        await queryViaSdk(
          sdkPrompt,
          cwd,
          aiOptions,
          sendSSE,
          () => aborted
        );

        sendSSE('[DONE]');
        onEnd();
      } catch (error: any) {
        console.log(chalk.red('[code-inspector-plugin] AI error:') + error.message);
        sendSSE({
          error: `Failed to communicate with Claude: ${error.message}. Install Claude Code CLI or configure apiKey.`,
        });
        sendSSE('[DONE]');
        onEnd();
      }
    })();
  }

  return {
    abort: () => {
      aborted = true;
      if (childProcess) {
        childProcess.kill('SIGTERM');
      }
    },
  };
}

// ============================================================================
// CLI 检测和调用
// ============================================================================

/** 缓存的 CLI 路径 */
let cachedCliPath: string | null | undefined = undefined;

/**
 * 查找本地 Claude Code CLI 路径
 */
function findClaudeCodeCli(): string | null {
  if (cachedCliPath !== undefined) {
    return cachedCliPath;
  }

  try {
    const command = process.platform === 'win32' ? 'where claude' : 'which claude';
    const result = execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (result) {
      cachedCliPath = result.split('\n')[0];
      return cachedCliPath;
    }
  } catch {
    // 命令未找到
  }

  const possiblePaths = [
    path.join(process.env.HOME || '', '.npm-global', 'bin', 'claude'),
    path.join(process.env.HOME || '', '.yarn', 'bin', 'claude'),
    path.join(process.env.HOME || '', '.local', 'share', 'pnpm', 'claude'),
    '/usr/local/bin/claude',
    '/opt/homebrew/bin/claude',
    '/usr/bin/claude',
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      cachedCliPath = p;
      return cachedCliPath;
    }
  }

  cachedCliPath = null;
  return null;
}

/**
 * 通过 CLI 执行查询
 */
function queryViaCli(
  cliPath: string,
  prompt: string,
  cwd: string,
  aiOptions: AIOptions | undefined,
  onData: (data: string) => void,
  onError: (error: string) => void,
  onEnd: () => void,
  sessionId?: string,
  onSessionId?: (id: string) => void
): ChildProcess {
  const opts = aiOptions?.sdkOptions;
  const args = [
    '-p', prompt,
    '--output-format', 'stream-json',
    '--verbose',
    '--permission-mode', opts?.permissionMode || 'bypassPermissions',
  ];

  if (sessionId) {
    args.push('--resume', sessionId);
  }

  if (opts?.model) {
    args.push('--model', opts.model);
  }
  if (opts?.allowedTools && opts.allowedTools.length > 0) {
    args.push('--allowedTools', opts.allowedTools.join(','));
  }

  const env = { ...getEnvVars(), ...opts?.env };

  const child = spawn(cliPath, args, {
    cwd,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stdin?.end();

  let buffer = '';
  let hasDeltaStreaming = false;
  let hasAnyContent = false;
  const toolInputBuffers: Map<number, { id: string; name: string; json: string }> = new Map();

  child.stdout?.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const event = JSON.parse(line);

        if (event.type === 'system') {
          if (event.session_id && onSessionId) {
            onSessionId(event.session_id);
          }
          if (event.model) {
            onData(JSON.stringify({ type: 'info', model: event.model }));
          }

        } else if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
          hasDeltaStreaming = true;
          hasAnyContent = true;
          const toolUse = event.content_block;
          toolInputBuffers.set(event.index, { id: toolUse.id, name: toolUse.name, json: '' });
          onData(JSON.stringify({
            type: 'tool_start',
            toolId: toolUse.id,
            toolName: toolUse.name,
            index: event.index,
          }));

        } else if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          hasDeltaStreaming = true;
          hasAnyContent = true;
          onData(JSON.stringify({ type: 'text', content: event.delta.text }));

        } else if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
          const buf = toolInputBuffers.get(event.index);
          if (buf) {
            buf.json += event.delta.partial_json || '';
          }

        } else if (event.type === 'content_block_stop') {
          const buf = toolInputBuffers.get(event.index);
          if (buf) {
            try {
              const input = JSON.parse(buf.json);
              onData(JSON.stringify({ type: 'tool_input', toolId: buf.id, index: event.index, input }));
            } catch {
              // 忽略解析错误
            }
            toolInputBuffers.delete(event.index);
          }

        } else if (event.type === 'assistant') {
          if (!hasDeltaStreaming && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'text') {
                hasAnyContent = true;
                onData(JSON.stringify({ type: 'text', content: block.text }));
              } else if (block.type === 'tool_use') {
                hasAnyContent = true;
                onData(JSON.stringify({
                  type: 'tool_start',
                  toolId: block.id,
                  toolName: block.name,
                }));
                onData(JSON.stringify({
                  type: 'tool_input',
                  toolId: block.id,
                  input: block.input,
                }));
              }
            }
          }
        } else if (event.type === 'user') {
          if (event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'tool_result') {
                onData(JSON.stringify({
                  type: 'tool_result',
                  toolUseId: block.tool_use_id,
                  content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
                  isError: block.is_error,
                }));
              }
            }
          }
        } else if (event.type === 'result') {
          if (event.session_id && onSessionId) {
            onSessionId(event.session_id);
          }
          if (!hasAnyContent && event.result) {
            onData(JSON.stringify({ type: 'text', content: event.result }));
          }
        }
      } catch {
        if (line.trim()) {
          onData(JSON.stringify({ type: 'text', content: line + '\n' }));
        }
      }
    }
  });

  child.stderr?.on('data', (chunk: Buffer) => {
    const text = chunk.toString();
    console.log(chalk.red('[claude-cli stderr]') + text);
  });

  child.on('error', (err) => {
    onError(err.message);
    onEnd();
  });

  child.on('close', (code) => {
    if (buffer.trim()) {
      try {
        const event = JSON.parse(buffer);
        if (event.type === 'result' && event.result) {
          onData(JSON.stringify({ type: 'text', content: event.result }));
        }
      } catch {
        if (buffer.trim()) {
          onData(JSON.stringify({ type: 'text', content: buffer + '\n' }));
        }
      }
    }
    if (code !== 0 && code !== null) {
      onError(`CLI exited with code ${code}`);
    }
    onEnd();
  });

  return child;
}

// ============================================================================
// SDK 调用
// ============================================================================

/** 动态导入的 Claude Agent SDK */
let claudeQuery: Function | null = null;

async function getClaudeQuery(): Promise<Function | null> {
  if (!claudeQuery) {
    try {
      const sdk: any = await (Function('return import("@anthropic-ai/claude-agent-sdk")')());
      claudeQuery = sdk.query || sdk.default?.query;
    } catch {
      // SDK 未安装或加载失败
    }
  }
  return claudeQuery;
}

const DEFAULT_ALLOWED_TOOLS = [
  'Read',
  'Write',
  'Edit',
  'Glob',
  'Grep',
  'Bash',
  'WebFetch',
  'WebSearch',
];

function setupSdkEnvironment(aiOptions?: AIOptions): void {
  const env = aiOptions?.sdkOptions?.env;
  if (!process.env) {
    process.env = {};
  }
  if (env) {
    for (const [key, value] of Object.entries(env)) {
      if (value !== undefined) {
        process.env[key] = value;
      }
    }
  }
}

function buildSdkQueryOptions(aiOptions: AIOptions | undefined, cwd: string): Record<string, any> {
  const { env, ...queryOpts } = aiOptions?.sdkOptions || {};
  return {
    maxTurns: 20,
    permissionMode: 'bypassPermissions',
    allowedTools: DEFAULT_ALLOWED_TOOLS,
    includePartialMessages: true,
    env: { ...getEnvVars(), ...env },
    ...queryOpts,
    cwd,
  };
}

async function queryViaSdk(
  prompt: string,
  cwd: string,
  aiOptions: AIOptions | undefined,
  sendSSE: (data: object | string) => void,
  isAborted: () => boolean
): Promise<void> {
  setupSdkEnvironment(aiOptions);

  const query = await getClaudeQuery();
  if (!query) {
    console.log(
      chalk.blue('[code-inspector-plugin]'),
      chalk.yellow('Claude Agent SDK not found.'),
      'Install it with:',
      chalk.green('npm install @anthropic-ai/claude-agent-sdk'),
    );
    sendSSE({
      type: 'text',
      content:
        '**Claude Agent SDK not installed.**\n\n' +
        'Please install it in your project:\n\n' +
        '```bash\n' +
        'npm install @anthropic-ai/claude-agent-sdk\n' +
        '```\n\n' +
        "Or use CLI mode by setting `agent: 'cli'` in your config.",
    });
    return;
  }

  const queryOptions = buildSdkQueryOptions(aiOptions, cwd);
  const conversation = query({
    prompt,
    options: queryOptions,
  });

  let hasStreamContent = false;
  const toolInputBuffers: Map<number, string> = new Map();

  for await (const sdkMessage of conversation) {
    if (isAborted()) {
      conversation.interrupt();
      break;
    }

    if (sdkMessage.type === 'stream_event') {
      const event = sdkMessage.event as any;

      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        hasStreamContent = true;
        sendSSE({ type: 'text', content: event.delta.text });
      }

      if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
        const toolUse = event.content_block;
        toolInputBuffers.set(event.index, '');
        sendSSE({
          type: 'tool_start',
          toolId: toolUse.id,
          toolName: toolUse.name,
          index: event.index,
        });
      }

      if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
        const partial = event.delta.partial_json || '';
        const current = toolInputBuffers.get(event.index) || '';
        toolInputBuffers.set(event.index, current + partial);
      }

      if (event.type === 'content_block_stop') {
        const inputJson = toolInputBuffers.get(event.index);
        if (inputJson !== undefined) {
          try {
            const input = JSON.parse(inputJson);
            sendSSE({
              type: 'tool_input',
              index: event.index,
              input,
            });
          } catch {
            // 忽略解析错误
          }
          toolInputBuffers.delete(event.index);
        }
      }
    } else if (sdkMessage.type === 'assistant') {
      const message = sdkMessage as any;
      if (message.message?.content) {
        for (const block of message.message.content) {
          if (block.type === 'tool_result') {
            sendSSE({
              type: 'tool_result',
              toolUseId: block.tool_use_id,
              content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
              isError: block.is_error,
            });
          }
        }
      }
    } else if (sdkMessage.type === 'result') {
      if (!hasStreamContent && sdkMessage.subtype === 'success' && (sdkMessage as any).result) {
        sendSSE({ type: 'text', content: (sdkMessage as any).result });
      }
    }
  }
}
