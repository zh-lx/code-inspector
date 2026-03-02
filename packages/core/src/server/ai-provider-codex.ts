/**
 * Codex Provider - 仅支持本地 CLI 调用
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn, ChildProcess, execSync } from 'child_process';
import type { CodexOptions } from '../shared';
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

/**
 * 获取模型信息
 * 优先使用用户配置（Codex 暂不通过额外请求探测模型）
 */
export async function getModelInfo(codexOptions: CodexOptions | undefined): Promise<string> {
  if (codexOptions?.model) {
    return codexOptions.model;
  }

  if (typeof codexOptions?.config?.model === 'string') {
    return codexOptions.config.model;
  }

  if (cachedCliModel !== undefined) {
    return cachedCliModel;
  }

  cachedCliModel = '';
  return cachedCliModel;
}

/**
 * Codex provider 统一入口（仅 CLI）
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
  const cliPath = findCodexCli();
  const model = codexOptions?.model || '';

  if (!cliPath) {
    sendSSE({
      error: 'Codex CLI not found. Please install Codex CLI and ensure the `codex` command is available.',
    });
    sendSSE('[DONE]');
    onEnd();
    return { abort: () => undefined };
  }

  // 有 sessionId 时使用 resume 恢复会话，prompt 只需当前消息
  // 无 sessionId 时为首次对话，构建包含 context 的完整 prompt
  const prompt = sessionId ? message : buildPrompt(message, context, history, cwd);

  sendSSE({ type: 'info', message: 'Using local Codex CLI', cwd, model });

  let aborted = false;
  const childProcess = queryViaCli(
    cliPath,
    prompt,
    cwd,
    codexOptions,
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

  return {
    abort: () => {
      aborted = true;
      childProcess.kill('SIGTERM');
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
  codexOptions: CodexOptions | undefined,
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
  codexOptions: CodexOptions | undefined,
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
