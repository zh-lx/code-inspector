/**
 * Codex Provider - 支持本地 CLI 和 SDK 两种调用方式
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn, ChildProcess, execSync } from 'child_process';
import type { CodexOptions, CodexCliOptions, CodexSdkOptions, CodexAgentOptions } from '../shared';
import type { AIContext, AIMessage } from './ai';
import type { ProviderCallbacks, ProviderResult } from './ai-provider-claude';
import { getEnvVars } from './server';
import chalk from 'chalk';

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
 * 缓存 CLI 检测到的模型名
 */
let cachedCliModel: string | undefined;

function getCodexAgentOptions(codexOptions?: CodexOptions): CodexAgentOptions {
  return codexOptions?.options || {};
}

function getCodexCliOptions(codexOptions?: CodexOptions): CodexCliOptions {
  if (codexOptions?.agent === 'sdk') {
    return {};
  }
  return codexOptions?.options || {};
}

function getCodexSdkOptions(codexOptions?: CodexOptions): CodexSdkOptions {
  if (!codexOptions || codexOptions.agent === 'cli' || codexOptions.agent === undefined) {
    return {};
  }
  return codexOptions.options || {};
}

/**
 * 获取模型信息
 * 优先使用用户配置（Codex 暂不通过额外请求探测模型）
 */
export async function getModelInfo(codexOptions: CodexOptions | undefined): Promise<string> {
  const options = getCodexAgentOptions(codexOptions);

  if (options.model) {
    return options.model;
  }

  if (typeof options.config?.model === 'string') {
    return options.config.model;
  }

  if (cachedCliModel !== undefined) {
    return cachedCliModel;
  }

  cachedCliModel = '';
  return cachedCliModel;
}

/**
 * Codex provider 统一入口
 */
export function handleCodexRequest(
  message: string,
  context: AIContext | null,
  history: AIMessage[],
  sessionId: string | undefined,
  cwd: string,
  codexOptions: CodexOptions | undefined,
  callbacks: ProviderCallbacks,
): ProviderResult {
  const { sendSSE, onEnd } = callbacks;
  const agentType = codexOptions?.agent || 'cli';
  const options = getCodexAgentOptions(codexOptions);
  const cliPath = agentType === 'cli' ? findCodexCli() : null;
  const model = options.model || '';

  let childProcess: ChildProcess | null = null;
  let activeThread: { interrupt?: () => Promise<void> | void } | null = null;
  let aborted = false;

  if (agentType === 'cli' && cliPath) {
    // 有 sessionId 时使用 resume 恢复会话，prompt 只需当前消息
    // 无 sessionId 时为首次对话，构建包含 context 的完整 prompt
    const prompt = sessionId ? message : buildPrompt(message, context, history, cwd);

    sendSSE({ type: 'info', message: 'Using local Codex CLI', cwd, model });

    const cliOptions = getCodexCliOptions(codexOptions);

    childProcess = queryViaCli(
      cliPath,
      prompt,
      cwd,
      cliOptions,
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
      (newModel) => {
        if (newModel) {
          sendSSE({ type: 'info', model: newModel });
        }
      },
      () => aborted
    );
  } else {
    // 使用 SDK（agent='sdk' 或 agent='cli' 但 CLI 未找到时回退）
    (async () => {
      try {
        if (agentType === 'cli' && !cliPath) {
          sendSSE({ type: 'info', message: 'Codex CLI not found. Falling back to Codex SDK', cwd });
        }
        sendSSE({ type: 'info', message: 'Using Codex SDK', cwd, model });

        const sdkPrompt = sessionId ? message : buildPrompt(message, context, history, cwd);
        const sdkOptions = getCodexSdkOptions(codexOptions);

        activeThread = await queryViaSdk(
          sdkPrompt,
          cwd,
          sdkOptions,
          sessionId,
          sendSSE,
          () => aborted
        );

        sendSSE('[DONE]');
        onEnd();
      } catch (error: any) {
        if (!aborted) {
          console.log(chalk.red('[code-inspector-plugin] Codex AI error:') + error.message);
          sendSSE({
            error: `Failed to communicate with Codex: ${error.message}. Install Codex CLI or configure Codex SDK.`,
          });
          sendSSE('[DONE]');
          onEnd();
        }
      }
    })();
  }

  return {
    abort: () => {
      aborted = true;
      if (childProcess) {
        childProcess.kill('SIGTERM');
      }
      const interrupt = activeThread?.interrupt;
      if (interrupt) {
        Promise.resolve(interrupt()).catch(() => undefined);
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
 * 查找本地 Codex CLI 路径
 */
function findCodexCli(): string | null {
  if (cachedCliPath !== undefined) {
    return cachedCliPath;
  }

  try {
    const command = process.platform === 'win32' ? 'where codex' : 'which codex';
    const result = execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (result) {
      cachedCliPath = result.split('\n')[0];
      return cachedCliPath;
    }
  } catch {
    // 命令未找到
  }

  const possiblePaths = [
    path.join(process.env.HOME || '', '.npm-global', 'bin', 'codex'),
    path.join(process.env.HOME || '', '.yarn', 'bin', 'codex'),
    path.join(process.env.HOME || '', '.local', 'share', 'pnpm', 'codex'),
    '/usr/local/bin/codex',
    '/opt/homebrew/bin/codex',
    '/usr/bin/codex',
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

function formatConfigValue(value: string | number | boolean): string {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  return String(value);
}

function buildCommonArgs(
  codexOptions: CodexCliOptions,
  outputFile: string
): string[] {
  const args = ['--json', '-o', outputFile];

  if (codexOptions?.model) {
    args.push('-m', codexOptions.model);
  }
  if (codexOptions?.profile) {
    args.push('-p', codexOptions.profile);
  }
  if (codexOptions?.sandbox) {
    args.push('-s', codexOptions.sandbox);
  }
  if (codexOptions?.fullAuto) {
    args.push('--full-auto');
  }
  if (codexOptions?.skipGitRepoCheck) {
    args.push('--skip-git-repo-check');
  }
  if (codexOptions?.ephemeral) {
    args.push('--ephemeral');
  }

  if (codexOptions?.config) {
    for (const [key, value] of Object.entries(codexOptions.config)) {
      args.push('-c', `${key}=${formatConfigValue(value)}`);
    }
  }

  return args;
}

function extractTextFromContent(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content.map((item) => {
      if (!item) return '';
      if (typeof item === 'string') return item;
      if (typeof item.text === 'string') return item.text;
      if (typeof item.content === 'string') return item.content;
      return '';
    }).join('');
  }

  return '';
}

function extractModelFromEvent(event: any): string {
  if (typeof event?.model === 'string') {
    return event.model;
  }
  if (typeof event?.response?.model === 'string') {
    return event.response.model;
  }
  if (typeof event?.metadata?.model === 'string') {
    return event.metadata.model;
  }
  return '';
}

function extractTextEvent(event: any): { text: string; delta: boolean } | null {
  if (event?.type === 'response.output_text.delta' && typeof event.delta === 'string') {
    return { text: event.delta, delta: true };
  }
  if (event?.type === 'response.output_text.done' && typeof event.text === 'string') {
    return { text: event.text, delta: false };
  }
  if (typeof event?.delta === 'string') {
    return { text: event.delta, delta: true };
  }
  if (typeof event?.delta?.text === 'string') {
    return { text: event.delta.text, delta: true };
  }
  if (typeof event?.text === 'string') {
    return { text: event.text, delta: false };
  }
  if (typeof event?.output_text === 'string') {
    return { text: event.output_text, delta: false };
  }

  const messageText = extractTextFromContent(event?.message?.content);
  if (messageText) {
    return { text: messageText, delta: false };
  }

  const contentText = extractTextFromContent(event?.content);
  if (contentText) {
    return { text: contentText, delta: false };
  }

  return null;
}

function shouldIgnorePlainLine(line: string): boolean {
  if (!line.trim()) return true;
  if (line.startsWith('WARNING: proceeding, even though we could not update PATH')) return true;
  if (/^\d{4}-\d{2}-\d{2}T.*\sERROR\s/.test(line)) return true;
  return false;
}

/**
 * 通过 CLI 执行查询
 */
function queryViaCli(
  cliPath: string,
  prompt: string,
  cwd: string,
  codexOptions: CodexCliOptions,
  onData: (data: string) => void,
  onError: (error: string) => void,
  onEnd: () => void,
  sessionId?: string,
  onSessionId?: (id: string) => void,
  onModel?: (model: string) => void,
  isAborted?: () => boolean
): ChildProcess {
  const outputFile = path.join(
    os.tmpdir(),
    `code-inspector-codex-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`
  );
  const commonArgs = buildCommonArgs(codexOptions, outputFile);
  const args = sessionId
    ? ['exec', 'resume', ...commonArgs, sessionId, prompt]
    : ['exec', ...commonArgs, prompt];
  const env = { ...getEnvVars(), ...codexOptions?.env };

  const child = spawn(cliPath, args, {
    cwd,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stdin?.end();

  let stdoutBuffer = '';
  let stderrBuffer = '';
  let hasDeltaStreaming = false;
  let hasAnyContent = false;
  let hasError = false;
  let knownModel = '';
  let ended = false;

  const finish = () => {
    if (ended) return;
    ended = true;
    onEnd();
  };

  const handleLine = (line: string) => {
    if (isAborted?.()) {
      return;
    }

    if (shouldIgnorePlainLine(line)) {
      return;
    }

    const sessionMatch = line.match(/session id:\s*([a-zA-Z0-9-]+)/i);
    if (sessionMatch?.[1] && onSessionId) {
      onSessionId(sessionMatch[1]);
      return;
    }

    const modelMatch = line.match(/^model:\s*(.+)$/i);
    if (modelMatch?.[1] && onModel) {
      knownModel = modelMatch[1].trim();
      onModel(knownModel);
      return;
    }

    try {
      const event = JSON.parse(line);

      if (event.type === 'thread.started' && event.thread_id && onSessionId) {
        onSessionId(event.thread_id);
      }

      const eventModel = extractModelFromEvent(event);
      if (eventModel && onModel && eventModel !== knownModel) {
        knownModel = eventModel;
        onModel(eventModel);
      }

      if (event.type === 'error') {
        const message = String(event.message || 'Codex CLI error');
        if (message.startsWith('Reconnecting...')) {
          return;
        }
        hasError = true;
        onError(message);
        return;
      }

      if (event.type === 'turn.failed') {
        hasError = true;
        const message = event.error?.message || 'Codex turn failed';
        onError(message);
        return;
      }

      const textEvent = extractTextEvent(event);
      if (textEvent?.text) {
        if (textEvent.delta) {
          hasDeltaStreaming = true;
        }
        if (!textEvent.delta && hasDeltaStreaming) {
          return;
        }
        hasAnyContent = true;
        onData(JSON.stringify({ type: 'text', content: textEvent.text }));
      }
      return;
    } catch {
      // 非 JSON 事件，按纯文本兜底处理
    }

    if (line.startsWith('ERROR:')) {
      hasError = true;
      onError(line.replace(/^ERROR:\s*/, ''));
      return;
    }

    hasAnyContent = true;
    onData(JSON.stringify({ type: 'text', content: line + '\n' }));
  };

  const handleChunk = (
    chunk: Buffer,
    source: 'stdout' | 'stderr',
  ) => {
    const text = chunk.toString();
    if (source === 'stdout') {
      stdoutBuffer += text;
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || '';
      for (const line of lines) {
        handleLine(line);
      }
      return;
    }

    stderrBuffer += text;
    const lines = stderrBuffer.split('\n');
    stderrBuffer = lines.pop() || '';
    for (const line of lines) {
      handleLine(line);
    }
  };

  child.stdout?.on('data', (chunk: Buffer) => {
    handleChunk(chunk, 'stdout');
  });

  child.stderr?.on('data', (chunk: Buffer) => {
    handleChunk(chunk, 'stderr');
  });

  child.on('error', (err) => {
    hasError = true;
    console.log(chalk.red('[codex-cli error] ') + err.message);
    onError(err.message);
    finish();
  });

  child.on('close', (code) => {
    if (stdoutBuffer.trim()) {
      handleLine(stdoutBuffer.trim());
    }
    if (stderrBuffer.trim()) {
      handleLine(stderrBuffer.trim());
    }

    if (!hasAnyContent && fs.existsSync(outputFile)) {
      const text = fs.readFileSync(outputFile, 'utf-8').trim();
      if (text) {
        onData(JSON.stringify({ type: 'text', content: text }));
      }
    }

    if (code !== 0 && code !== null && !hasError) {
      onError(`Codex CLI exited with code ${code}`);
    }

    try {
      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
      }
    } catch {
      // 忽略清理错误
    }

    finish();
  });

  return child;
}

// ============================================================================
// SDK 调用
// ============================================================================

let CodexSDKCtor: any = null;
let loadedCodexSdkPackage = '';

async function getCodexSDKCtor(): Promise<any | null> {
  if (!CodexSDKCtor) {
    const pkg = '@openai/codex-sdk';
    try {
      const sdk: any = await (Function(`return import("${pkg}")`)());
      const ctor = sdk.Codex || sdk.default?.Codex || sdk.default;
      if (ctor) {
        CodexSDKCtor = ctor;
        loadedCodexSdkPackage = pkg;
      }
    } catch {
      // ignore
    }
  }
  return CodexSDKCtor;
}

function buildCodexSDKClientOptions(
  options: CodexSdkOptions
): Record<string, any> {
  const clientOptions: Record<string, any> = {};

  if (options.codexPathOverride) clientOptions.codexPathOverride = options.codexPathOverride;
  if (options.baseUrl) clientOptions.baseUrl = options.baseUrl;
  if (options.apiKey) clientOptions.apiKey = options.apiKey;
  if (options.config) clientOptions.config = options.config;
  if (options.env) clientOptions.env = { ...getEnvVars(), ...options.env };

  return clientOptions;
}

function buildCodexSDKThreadOptions(
  options: CodexSdkOptions,
  cwd: string
): Record<string, any> {
  const threadOptions: Record<string, any> = {
    cwd: options.cwd || cwd,
  };

  if (options.model) threadOptions.model = options.model;
  if (options.profile) threadOptions.profile = options.profile;
  if (options.sandboxMode) {
    threadOptions.sandboxMode = options.sandboxMode;
  }
  if (options.skipGitRepoCheck !== undefined) {
    threadOptions.skipGitRepoCheck = options.skipGitRepoCheck;
  }
  if (options.modelReasoningEffort) {
    threadOptions.modelReasoningEffort = options.modelReasoningEffort;
  }
  if (options.webSearchRequest) {
    threadOptions.webSearchRequest = options.webSearchRequest;
  }
  if (options.enableWebSearch !== undefined) {
    threadOptions.enableWebSearch = options.enableWebSearch;
  }
  if (options.approvalPolicy) {
    threadOptions.approvalPolicy = options.approvalPolicy;
  }
  if (options.additionalWritableRoots) {
    threadOptions.additionalWritableRoots = options.additionalWritableRoots;
  }

  return threadOptions;
}

function stringifyUnknown(value: any): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getItemText(item: any): string {
  if (!item) return '';
  if (typeof item.text === 'string') return item.text;
  if (typeof item.message === 'string') return item.message;
  if (typeof item.output_text === 'string') return item.output_text;
  if (typeof item.output === 'string') return item.output;
  if (typeof item.result === 'string') return item.result;
  return '';
}

function buildToolEventFromItem(item: any): {
  toolId: string;
  toolName: string;
  input?: Record<string, any>;
  result?: string;
  isError?: boolean;
} | null {
  if (!item?.id || !item?.type) {
    return null;
  }

  if (item.type === 'command_execution') {
    const exitCode = typeof item.exit_code === 'number' ? item.exit_code : undefined;
    const status = String(item.status || '');
    const isError = status === 'failed' || (exitCode !== undefined && exitCode !== 0);
    return {
      toolId: String(item.id),
      toolName: 'Bash',
      input: item.command ? { command: item.command } : undefined,
      result: item.aggregated_output || item.output || (exitCode !== undefined ? `exit code ${exitCode}` : ''),
      isError,
    };
  }

  if (item.type === 'file_change') {
    const changes = Array.isArray(item.changes) ? item.changes : [];
    return {
      toolId: String(item.id),
      toolName: 'Edit',
      input: changes.length > 0 ? { changes } : undefined,
      result: changes.length > 0 ? `Applied ${changes.length} file changes` : 'Applied file changes',
    };
  }

  if (item.type === 'web_search') {
    return {
      toolId: String(item.id),
      toolName: 'WebSearch',
      input: item.query ? { query: item.query } : undefined,
      result: stringifyUnknown(item.result || item.output),
      isError: item.status === 'failed',
    };
  }

  if (item.type === 'mcp_tool_call') {
    return {
      toolId: String(item.id),
      toolName: item.name || item.tool_name || 'MCPTool',
      input: item.arguments || item.input,
      result: stringifyUnknown(item.result || item.output || item.error),
      isError: Boolean(item.error) || item.status === 'failed',
    };
  }

  return null;
}

function buildSDKErrorMessage(event: any): string {
  if (typeof event?.message === 'string') return event.message;
  if (typeof event?.error === 'string') return event.error;
  if (typeof event?.error?.message === 'string') return event.error.message;
  return 'Codex SDK error';
}

async function queryViaSdk(
  prompt: string,
  cwd: string,
  codexOptions: CodexSdkOptions,
  sessionId: string | undefined,
  sendSSE: (data: object | string) => void,
  isAborted: () => boolean
): Promise<{ interrupt?: () => Promise<void> | void } | null> {
  const CodexSDK = await getCodexSDKCtor();
  if (!CodexSDK) {
    console.log(
      chalk.blue('[code-inspector-plugin]'),
      chalk.yellow('Codex SDK not found.'),
      'Install it with:',
      chalk.green('npm install @openai/codex-sdk'),
    );
    sendSSE({
      type: 'text',
      content:
        '**Codex SDK not installed.**\n\n' +
        'Please install it in your project:\n\n' +
        '```bash\n' +
        'npm install @openai/codex-sdk\n' +
        '```\n\n' +
        "Or use CLI mode by setting `agent: 'cli'` in your config.",
    });
    return null;
  }

  if (loadedCodexSdkPackage) {
    sendSSE({ type: 'info', message: `Using Codex SDK package: ${loadedCodexSdkPackage}` });
  }

  const codex = new CodexSDK(buildCodexSDKClientOptions(codexOptions));
  const threadOptions = buildCodexSDKThreadOptions(codexOptions, cwd);
  const thread = sessionId
    ? await codex.resumeThread(sessionId, threadOptions)
    : await codex.startThread(threadOptions);

  if (thread?.id) {
    sendSSE({ type: 'session', sessionId: thread.id });
  }

  if (threadOptions.model) {
    sendSSE({ type: 'info', model: threadOptions.model });
  }

  const runResult = await thread.runStreamed(prompt);
  const events = runResult?.events || runResult;
  const toolIndexMap = new Map<string, number>();
  const messageTextMap = new Map<string, string>();
  let hasAnyText = false;
  let toolIndex = 0;

  const emitToolFromItem = (item: any, done = false) => {
    const toolEvent = buildToolEventFromItem(item);
    if (!toolEvent) return;

    let index = toolIndexMap.get(toolEvent.toolId);
    if (index === undefined) {
      index = toolIndex++;
      toolIndexMap.set(toolEvent.toolId, index);
      sendSSE({
        type: 'tool_start',
        toolId: toolEvent.toolId,
        toolName: toolEvent.toolName,
        index,
      });
      if (toolEvent.input) {
        sendSSE({
          type: 'tool_input',
          index,
          input: toolEvent.input,
        });
      }
    }

    if (done && toolEvent.result !== undefined) {
      sendSSE({
        type: 'tool_result',
        toolUseId: toolEvent.toolId,
        content: toolEvent.result,
        isError: toolEvent.isError,
      });
    }
  };

  for await (const event of events) {
    if (isAborted()) {
      await Promise.resolve(thread.interrupt?.()).catch(() => undefined);
      break;
    }

    if (event?.type === 'error' || event?.type === 'turn.failed') {
      sendSSE({ error: buildSDKErrorMessage(event) });
      continue;
    }

    if (event?.type === 'item.started') {
      emitToolFromItem(event.item, false);
      continue;
    }

    if (event?.type === 'item.updated') {
      const item = event.item;
      if (item?.type === 'agent_message' && item?.id) {
        const current = getItemText(item);
        const previous = messageTextMap.get(item.id) || '';
        const delta = current.startsWith(previous) ? current.slice(previous.length) : current;
        if (delta) {
          hasAnyText = true;
          sendSSE({ type: 'text', content: delta });
        }
        messageTextMap.set(item.id, current);
      } else {
        emitToolFromItem(item, false);
      }
      continue;
    }

    if (event?.type === 'item.completed') {
      const item = event.item;
      if (item?.type === 'agent_message' && item?.id) {
        const current = getItemText(item);
        const previous = messageTextMap.get(item.id) || '';
        const delta = current.startsWith(previous) ? current.slice(previous.length) : current;
        if (delta) {
          hasAnyText = true;
          sendSSE({ type: 'text', content: delta });
        }
        messageTextMap.delete(item.id);
      } else {
        emitToolFromItem(item, true);
      }
      continue;
    }

    if (event?.type === 'task_complete') {
      if (!hasAnyText && typeof event.last_agent_message === 'string' && event.last_agent_message) {
        hasAnyText = true;
        sendSSE({ type: 'text', content: event.last_agent_message });
      } else if (!hasAnyText && typeof event.result === 'string' && event.result) {
        hasAnyText = true;
        sendSSE({ type: 'text', content: event.result });
      }
    }
  }

  return thread;
}
