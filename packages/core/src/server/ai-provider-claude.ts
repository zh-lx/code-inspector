/**
 * Claude Code Provider - 支持本地 CLI 和 Agent SDK 两种调用方式
 */
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess, execSync } from 'child_process';
import type {
  ClaudeCodeOptions,
  ClaudeCliOptions,
  ClaudeSdkOptions,
  ClaudeAgentOptions,
} from '../shared';
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

interface InlineImagePayload {
  mediaType: string;
  data: string;
}

interface ClaudeCliInputMessage {
  type: 'user';
  session_id: string;
  parent_tool_use_id: null;
  message: {
    role: 'user';
    content: Array<
      | { type: 'text'; text: string }
      | {
          type: 'image';
          source: { type: 'base64'; media_type: string; data: string };
        }
    >;
  };
}

const INLINE_IMAGE_DATA_URL_REGEX =
  /data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g;

function stripInlineImageDataUrls(text: string): string {
  return text.replace(
    INLINE_IMAGE_DATA_URL_REGEX,
    '[Inline image data omitted]',
  );
}

function extractInlineImages(text: string): {
  text: string;
  images: InlineImagePayload[];
} {
  const images: InlineImagePayload[] = [];
  let imageIndex = 0;
  const rewritten = text.replace(
    INLINE_IMAGE_DATA_URL_REGEX,
    (_match, mediaType: string, data: string) => {
      imageIndex += 1;
      images.push({ mediaType, data });
      return `[Inline image ${imageIndex} attached separately (${mediaType})]`;
    },
  );

  return { text: rewritten, images };
}

function buildClaudeCliInputMessage(
  promptText: string,
  images: InlineImagePayload[],
  sessionId?: string,
): ClaudeCliInputMessage {
  return {
    type: 'user',
    session_id: sessionId || '',
    parent_tool_use_id: null,
    message: {
      role: 'user',
      content: [
        { type: 'text', text: promptText },
        ...images.map((image) => ({
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: image.mediaType,
            data: image.data,
          },
        })),
      ],
    },
  };
}

/**
 * 构建完整的提示信息
 */
function buildPrompt(
  message: string,
  context: AIContext | null,
  history: AIMessage[],
  projectRootPath: string,
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
    parts.push(
      `[Context] I'm looking at a <${context.name}> component located at ${fileRef}.`,
    );
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
 * 构建续会话单轮提示：
 * - 保留当前轮 context，避免模型长期锚定首轮 context
 * - 不重复拼接历史（由 session/resume 自身维护）
 */
function buildResumeTurnPrompt(
  message: string,
  context: AIContext | null,
  projectRootPath: string,
): string {
  const scopeNote = context
    ? '[Note] Context above applies to this turn only. Prior turn context may be outdated.'
    : '[Note] This turn is in Global mode with no selected DOM element. Ignore any element-specific context from prior turns.';
  return (
    buildPrompt(message, context, [], projectRootPath) + `\n\n${scopeNote}`
  );
}

/**
 * 缓存 CLI 检测到的模型名
 */
let cachedCliModel: string | undefined;

function getClaudeAgentOptions(
  aiOptions?: ClaudeCodeOptions,
): ClaudeAgentOptions {
  return aiOptions?.options || {};
}

function getClaudeCliOptions(aiOptions?: ClaudeCodeOptions): ClaudeCliOptions {
  if (aiOptions?.type === 'sdk') {
    return {};
  }
  return aiOptions?.options || {};
}

function getClaudeSdkOptions(aiOptions?: ClaudeCodeOptions): ClaudeSdkOptions {
  if (!aiOptions || aiOptions.type === 'cli' || aiOptions.type === undefined) {
    return {};
  }
  return aiOptions.options || {};
}

/**
 * 获取模型信息
 * 优先使用用户配置，否则通过 CLI 的 system 事件获取（无 API 消耗）
 */
export async function getModelInfo(
  aiOptions: ClaudeCodeOptions | undefined,
): Promise<string> {
  const options = getClaudeAgentOptions(aiOptions);
  if (options.model) {
    return options.model;
  }

  // 有缓存直接返回
  if (cachedCliModel !== undefined) {
    return cachedCliModel;
  }

  // 通过 CLI stream-json 的 system init 事件获取 model
  // system 事件在 API 调用前发出，读取后立即 kill 进程，无 token 消耗
  const cliPath = findClaudeCodeCli();
  if (!cliPath) {
    cachedCliModel = '';
    return '';
  }

  try {
    const model = await new Promise<string>((resolve) => {
      const child = spawn(
        cliPath,
        ['-p', 'hi', '--output-format', 'stream-json', '--verbose'],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: getEnvVars(),
        },
      );
      child.stdin?.end();

      let buffer = '';
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        resolve('');
      }, 10000);

      child.stdout?.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === 'system' && event.model) {
              clearTimeout(timeout);
              child.kill('SIGTERM');
              resolve(event.model);
              return;
            }
          } catch {
            // 忽略解析错误
          }
        }
      });

      child.on('error', () => {
        clearTimeout(timeout);
        resolve('');
      });

      child.on('close', () => {
        clearTimeout(timeout);
        resolve('');
      });
    });

    cachedCliModel = model;
    return model;
  } catch {
    cachedCliModel = '';
    return '';
  }
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
  aiOptions: ClaudeCodeOptions | undefined,
  callbacks: ProviderCallbacks,
): ProviderResult {
  const { sendSSE, onEnd } = callbacks;

  const agentType = aiOptions?.type || 'cli';
  const cliPath = findClaudeCodeCli();

  let childProcess: ChildProcess | null = null;
  let aborted = false;
  const model = getClaudeAgentOptions(aiOptions).model || '';

  if (agentType === 'cli' && cliPath) {
    // 使用本地 CLI
    // 有 sessionId 时使用 --resume 恢复会话，同时注入本轮 context，避免首轮 context 锚定
    // 无 sessionId 时为首次对话，构建包含 context 的完整 prompt
    const cliHistory: AIMessage[] = history.map((msg) => ({
      role: msg.role,
      content: stripInlineImageDataUrls(msg.content),
    }));
    const extracted = extractInlineImages(message);
    const prompt = sessionId
      ? buildResumeTurnPrompt(extracted.text, context, cwd)
      : buildPrompt(extracted.text, context, cliHistory, cwd);
    const cliInputMessage =
      extracted.images.length > 0
        ? buildClaudeCliInputMessage(prompt, extracted.images, sessionId)
        : undefined;

    sendSSE({
      type: 'info',
      message: 'Using local Claude Code CLI',
      cwd,
      model,
    });
    if (extracted.images.length > 0) {
      sendSSE({
        type: 'info',
        message: `Detected ${extracted.images.length} image(s). Sending via Claude CLI stream-json input.`,
      });
    }

    childProcess = queryViaCli(
      cliPath,
      prompt,
      cliInputMessage,
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
      },
    );
  } else {
    // 使用 SDK（type='sdk' 或 type='cli' 但 CLI 未找到时回退）
    (async () => {
      try {
        sendSSE({
          type: 'info',
          message: 'Using Claude Agent SDK',
          cwd,
          model,
        });

        const sdkHistory: AIMessage[] = history.map((msg) => ({
          role: msg.role,
          content: stripInlineImageDataUrls(msg.content),
        }));
        const extracted = extractInlineImages(message);
        const sdkPromptText = sessionId
          ? buildResumeTurnPrompt(extracted.text, context, cwd)
          : buildPrompt(extracted.text, context, sdkHistory, cwd);
        const sdkPromptInput: string | AsyncIterable<any> =
          extracted.images.length > 0
            ? {
                [Symbol.asyncIterator]() {
                  let emitted = false;
                  return {
                    next: async () => {
                      if (emitted) {
                        return { value: undefined, done: true };
                      }
                      emitted = true;
                      return {
                        value: {
                          type: 'user',
                          session_id: sessionId || '',
                          parent_tool_use_id: null,
                          message: {
                            role: 'user',
                            content: [
                              { type: 'text', text: sdkPromptText },
                              ...extracted.images.map((image) => ({
                                type: 'image',
                                source: {
                                  type: 'base64',
                                  media_type: image.mediaType,
                                  data: image.data,
                                },
                              })),
                            ],
                          },
                        },
                        done: false,
                      };
                    },
                  };
                },
              }
            : sdkPromptText;

        if (extracted.images.length > 0) {
          sendSSE({
            type: 'info',
            message: `Detected ${extracted.images.length} image(s). Sending as multimodal input.`,
          });
        }

        const sdkRunState = await queryViaSdk(
          sdkPromptInput,
          cwd,
          aiOptions,
          sessionId,
          sendSSE,
          () => aborted,
        );

        if (sdkRunState.timedOut && cliPath) {
          sendSSE({
            type: 'info',
            message:
              'Claude SDK timed out without response. Falling back to local Claude CLI.',
          });
          const fallbackHistory: AIMessage[] = history.map((msg) => ({
            role: msg.role,
            content: stripInlineImageDataUrls(msg.content),
          }));
          const fallbackExtracted = extractInlineImages(message);
          const fallbackPrompt = sessionId
            ? buildResumeTurnPrompt(fallbackExtracted.text, context, cwd)
            : buildPrompt(
                fallbackExtracted.text,
                context,
                fallbackHistory,
                cwd,
              );
          const fallbackCliInputMessage =
            fallbackExtracted.images.length > 0
              ? buildClaudeCliInputMessage(
                  fallbackPrompt,
                  fallbackExtracted.images,
                  sessionId,
                )
              : undefined;
          if (fallbackExtracted.images.length > 0) {
            sendSSE({
              type: 'info',
              message: `Detected ${fallbackExtracted.images.length} image(s). Sending via Claude CLI stream-json input.`,
            });
          }
          childProcess = queryViaCli(
            cliPath,
            fallbackPrompt,
            fallbackCliInputMessage,
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
            },
          );
          return;
        }

        sendSSE('[DONE]');
        onEnd();
      } catch (error: any) {
        console.log(
          chalk.red('[code-inspector-plugin] AI error:') + error.message,
        );
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
    const command =
      process.platform === 'win32' ? 'where claude' : 'which claude';
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
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
  inputMessage: ClaudeCliInputMessage | undefined,
  cwd: string,
  aiOptions: ClaudeCodeOptions | undefined,
  onData: (data: string) => void,
  onError: (error: string) => void,
  onEnd: () => void,
  sessionId?: string,
  onSessionId?: (id: string) => void,
): ChildProcess {
  const opts = getClaudeCliOptions(aiOptions);
  const args = inputMessage
    ? [
        '-p',
        '--output-format',
        'stream-json',
        '--input-format',
        'stream-json',
        '--verbose',
        '--permission-mode',
        opts?.permissionMode || 'bypassPermissions',
      ]
    : [
        '-p',
        prompt,
        '--output-format',
        'stream-json',
        '--verbose',
        '--permission-mode',
        opts?.permissionMode || 'bypassPermissions',
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
  if (opts?.disallowedTools && opts.disallowedTools.length > 0) {
    args.push('--disallowedTools', opts.disallowedTools.join(','));
  }
  if (
    typeof opts?.maxTurns === 'number' &&
    Number.isFinite(opts.maxTurns) &&
    opts.maxTurns > 0
  ) {
    args.push('--max-turns', String(opts.maxTurns));
  }
  if (
    typeof opts?.maxCost === 'number' &&
    Number.isFinite(opts.maxCost) &&
    opts.maxCost > 0
  ) {
    args.push('--max-cost', String(opts.maxCost));
  }
  const systemPrompt = opts?.systemPrompt;
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
  if (opts?.mcpServers && Object.keys(opts.mcpServers).length > 0) {
    // Claude CLI 支持 --mcp-config 传入 JSON 字符串
    args.push('--mcp-config', JSON.stringify({ mcpServers: opts.mcpServers }));
  }

  const env = { ...getEnvVars(), ...opts?.env };

  const child = spawn(cliPath, args, {
    cwd,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (inputMessage) {
    child.stdin?.write(`${JSON.stringify(inputMessage)}\n`);
  }
  child.stdin?.end();

  let buffer = '';
  let hasDeltaStreaming = false;
  let hasAnyContent = false;
  const toolInputBuffers: Map<
    number,
    { id: string; name: string; json: string }
  > = new Map();

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
        } else if (
          event.type === 'content_block_start' &&
          event.content_block?.type === 'tool_use'
        ) {
          hasDeltaStreaming = true;
          hasAnyContent = true;
          const toolUse = event.content_block;
          toolInputBuffers.set(event.index, {
            id: toolUse.id,
            name: toolUse.name,
            json: '',
          });
          onData(
            JSON.stringify({
              type: 'tool_start',
              toolId: toolUse.id,
              toolName: toolUse.name,
              index: event.index,
            }),
          );
        } else if (
          event.type === 'content_block_delta' &&
          event.delta?.type === 'text_delta'
        ) {
          hasDeltaStreaming = true;
          hasAnyContent = true;
          onData(JSON.stringify({ type: 'text', content: event.delta.text }));
        } else if (
          event.type === 'content_block_delta' &&
          event.delta?.type === 'input_json_delta'
        ) {
          const buf = toolInputBuffers.get(event.index);
          if (buf) {
            buf.json += event.delta.partial_json || '';
          }
        } else if (event.type === 'content_block_stop') {
          const buf = toolInputBuffers.get(event.index);
          if (buf) {
            try {
              const input = JSON.parse(buf.json);
              onData(
                JSON.stringify({
                  type: 'tool_input',
                  toolId: buf.id,
                  index: event.index,
                  input,
                }),
              );
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
                onData(
                  JSON.stringify({
                    type: 'tool_start',
                    toolId: block.id,
                    toolName: block.name,
                  }),
                );
                onData(
                  JSON.stringify({
                    type: 'tool_input',
                    toolId: block.id,
                    input: block.input,
                  }),
                );
              }
            }
          }
        } else if (event.type === 'user') {
          if (event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'tool_result') {
                onData(
                  JSON.stringify({
                    type: 'tool_result',
                    toolUseId: block.tool_use_id,
                    content:
                      typeof block.content === 'string'
                        ? block.content
                        : JSON.stringify(block.content),
                    isError: block.is_error,
                  }),
                );
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
      const sdk: any = await Function(
        'return import("@anthropic-ai/claude-agent-sdk")',
      )();
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

function setupSdkEnvironment(aiOptions?: ClaudeCodeOptions): void {
  const rawOptions =
    aiOptions?.type === 'sdk'
      ? getClaudeSdkOptions(aiOptions)
      : getClaudeAgentOptions(aiOptions);
  const env = { ...getEnvVars(), ...rawOptions.env };
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

function buildSdkQueryOptions(
  aiOptions: ClaudeCodeOptions | undefined,
  cwd: string,
  sessionId?: string,
): Record<string, any> {
  const rawOptions =
    aiOptions?.type === 'sdk'
      ? getClaudeSdkOptions(aiOptions)
      : getClaudeAgentOptions(aiOptions);
  const { env, ...queryOpts } = rawOptions;
  const options: Record<string, any> = {
    maxTurns: 20,
    permissionMode: 'bypassPermissions',
    allowedTools: DEFAULT_ALLOWED_TOOLS,
    includePartialMessages: true,
    settingSources: ['user', 'project', 'local'],
    env: { ...getEnvVars(), ...env },
    ...queryOpts,
    cwd,
  };

  if (!options.pathToClaudeCodeExecutable) {
    const cliPath = findClaudeCodeCli();
    if (cliPath) {
      options.pathToClaudeCodeExecutable = cliPath;
    }
  }

  // Claude SDK requires this flag when bypassPermissions is enabled.
  if (
    options.permissionMode === 'bypassPermissions' &&
    options.allowDangerouslySkipPermissions === undefined
  ) {
    options.allowDangerouslySkipPermissions = true;
  }

  if (
    sessionId &&
    options.resume === undefined &&
    options.continue === undefined
  ) {
    options.resume = sessionId;
  }

  if (!options.extraArgs || typeof options.extraArgs !== 'object') {
    options.extraArgs = {};
  }
  if (
    !Object.prototype.hasOwnProperty.call(
      options.extraArgs,
      'enable-auth-status',
    )
  ) {
    options.extraArgs['enable-auth-status'] = null;
  }

  return options;
}

async function queryViaSdk(
  prompt: string | AsyncIterable<any>,
  cwd: string,
  aiOptions: ClaudeCodeOptions | undefined,
  sessionId: string | undefined,
  sendSSE: (data: object | string) => void,
  isAborted: () => boolean,
): Promise<{ timedOut: boolean }> {
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
        "Or use CLI mode by setting `type: 'cli'` in your config.",
    });
    return { timedOut: false };
  }

  const queryOptions = buildSdkQueryOptions(aiOptions, cwd, sessionId);
  if (typeof queryOptions.stderr !== 'function') {
    queryOptions.stderr = (data: string) => {
      const text = String(data || '').trim();
      if (text) {
        sendSSE({ type: 'info', message: text });
      }
    };
  }
  const conversation = query({
    prompt,
    options: queryOptions,
  });

  let hasStreamContent = false;
  let hasBusinessEvent = false;
  let timedOut = false;
  let emittedSessionId = '';
  const toolInputBuffers: Map<number, string> = new Map();
  const assistantTextBuffers: Map<string, string> = new Map();
  const sdkIdleTimeoutMs = 100000;
  const idleTimer = setTimeout(() => {
    if (!hasBusinessEvent && !isAborted()) {
      timedOut = true;
      sendSSE({
        error:
          `Claude SDK timeout: no response after ${Math.floor(sdkIdleTimeoutMs / 1000)}s. ` +
          'This is usually caused by gateway/network issues.',
      });
      conversation.interrupt();
    }
  }, sdkIdleTimeoutMs);

  const emitSessionId = (msg: any) => {
    const sid = msg?.session_id;
    if (typeof sid === 'string' && sid && sid !== emittedSessionId) {
      emittedSessionId = sid;
      sendSSE({ type: 'session', sessionId: sid });
    }
  };

  try {
    for await (const sdkMessage of conversation) {
      if (isAborted()) {
        conversation.interrupt();
        break;
      }
      emitSessionId(sdkMessage);

      if (sdkMessage.type === 'stream_event') {
        hasBusinessEvent = true;
        const event = sdkMessage.event as any;

        if (
          event.type === 'content_block_delta' &&
          event.delta?.type === 'text_delta'
        ) {
          hasStreamContent = true;
          sendSSE({ type: 'text', content: event.delta.text });
        }

        if (
          event.type === 'content_block_start' &&
          event.content_block?.type === 'tool_use'
        ) {
          const toolUse = event.content_block;
          toolInputBuffers.set(event.index, '');
          sendSSE({
            type: 'tool_start',
            toolId: toolUse.id,
            toolName: toolUse.name,
            index: event.index,
          });
        }

        if (
          event.type === 'content_block_delta' &&
          event.delta?.type === 'input_json_delta'
        ) {
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
        hasBusinessEvent = true;
        const message = sdkMessage as any;
        if (message.message?.content) {
          let combinedText = '';
          for (const block of message.message.content) {
            if (block.type === 'text' && typeof block.text === 'string') {
              combinedText += block.text;
            }
            if (block.type === 'tool_use') {
              sendSSE({
                type: 'tool_start',
                toolId: block.id,
                toolName: block.name,
              });
              if (block.input) {
                sendSSE({
                  type: 'tool_input',
                  toolId: block.id,
                  input: block.input,
                });
              }
            }
            if (block.type === 'tool_result') {
              sendSSE({
                type: 'tool_result',
                toolUseId: block.tool_use_id,
                content:
                  typeof block.content === 'string'
                    ? block.content
                    : JSON.stringify(block.content),
                isError: block.is_error,
              });
            }
          }

          if (combinedText) {
            const messageId = String(message.uuid || '');
            const previous = assistantTextBuffers.get(messageId) || '';
            const delta = combinedText.startsWith(previous)
              ? combinedText.slice(previous.length)
              : combinedText;
            if (delta) {
              hasStreamContent = true;
              sendSSE({ type: 'text', content: delta });
            }
            if (messageId) {
              assistantTextBuffers.set(messageId, combinedText);
            }
          }
        }
      } else if (sdkMessage.type === 'user') {
        hasBusinessEvent = true;
        const message = sdkMessage as any;
        if (message.message?.content) {
          for (const block of message.message.content) {
            if (block.type === 'tool_result') {
              sendSSE({
                type: 'tool_result',
                toolUseId: block.tool_use_id,
                content:
                  typeof block.content === 'string'
                    ? block.content
                    : JSON.stringify(block.content),
                isError: block.is_error,
              });
            }
          }
        }
      } else if (sdkMessage.type === 'system') {
        const systemMessage = sdkMessage as any;
        if (
          systemMessage.subtype === 'init' &&
          typeof systemMessage.model === 'string'
        ) {
          sendSSE({ type: 'info', model: systemMessage.model });
          if (typeof systemMessage.apiKeySource === 'string') {
            sendSSE({
              type: 'info',
              message: `Claude auth source: ${systemMessage.apiKeySource}`,
            });
          }
        }
      } else if (sdkMessage.type === 'auth_status') {
        const authStatus = sdkMessage as any;
        if (Array.isArray(authStatus.output) && authStatus.output.length > 0) {
          sendSSE({ type: 'info', message: authStatus.output.join('\n') });
        }
        if (authStatus.error) {
          sendSSE({ error: `Claude auth error: ${authStatus.error}` });
        }
      } else if (sdkMessage.type === 'result') {
        hasBusinessEvent = true;
        if (
          !hasStreamContent &&
          sdkMessage.subtype === 'success' &&
          (sdkMessage as any).result
        ) {
          sendSSE({ type: 'text', content: (sdkMessage as any).result });
        } else if (sdkMessage.subtype !== 'success') {
          const errorDetails = Array.isArray((sdkMessage as any).errors)
            ? (sdkMessage as any).errors.filter(Boolean).join('\n')
            : '';
          sendSSE({
            error:
              errorDetails ||
              `Claude SDK request failed: ${sdkMessage.subtype}`,
          });
        }
      }
    }
  } finally {
    clearTimeout(idleTimer);
  }
  return { timedOut };
}
