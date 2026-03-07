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
 * 构建续会话单轮提示：
 * - 保留当前轮 context，避免模型长期锚定首轮 context
 * - 不重复拼接历史（由 session/resume 自身维护）
 */
function buildResumeTurnPrompt(
  message: string,
  context: AIContext | null,
  projectRootPath: string
): string {
  const scopeNote = context
    ? '[Note] Context above applies to this turn only. Prior turn context may be outdated.'
    : '[Note] This turn is in Global mode with no selected DOM element. Ignore any element-specific context from prior turns.';
  return buildPrompt(message, context, [], projectRootPath) + `\n\n${scopeNote}`;
}

interface InlineImagePayload {
  mediaType: string;
  data: string;
}

type TempImageWriteResult = {
  imagePaths: string[];
  failedCount: number;
};

type CodexRunInputItem =
  | { type: 'text'; text: string }
  | { type: 'local_image'; path: string };

const INLINE_IMAGE_DATA_URL_REGEX = /data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g;

function stripInlineImageDataUrls(text: string): string {
  return text.replace(INLINE_IMAGE_DATA_URL_REGEX, '[Inline image data omitted]');
}

function extractInlineImages(text: string): { text: string; images: InlineImagePayload[] } {
  const images: InlineImagePayload[] = [];
  let imageIndex = 0;
  const rewritten = text.replace(INLINE_IMAGE_DATA_URL_REGEX, (_match, mediaType: string, data: string) => {
    imageIndex += 1;
    images.push({ mediaType, data });
    return `[Inline image ${imageIndex} attached separately (${mediaType})]`;
  });

  return { text: rewritten, images };
}

function mediaTypeToExtension(mediaType: string): string {
  const normalized = mediaType.toLowerCase();
  if (normalized === 'image/jpeg') return 'jpg';
  if (normalized === 'image/svg+xml') return 'svg';
  if (normalized === 'image/x-icon') return 'ico';
  const subtype = normalized.split('/')[1] || 'png';
  return subtype.split('+')[0] || 'png';
}

function persistInlineImagesToTempFiles(images: InlineImagePayload[]): TempImageWriteResult {
  const imagePaths: string[] = [];
  let failedCount = 0;

  for (const image of images) {
    try {
      const ext = mediaTypeToExtension(image.mediaType);
      const filename = `code-inspector-codex-image-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
      const filePath = path.join(os.tmpdir(), filename);
      const bytes = Buffer.from(image.data, 'base64');
      fs.writeFileSync(filePath, bytes);
      imagePaths.push(filePath);
    } catch {
      failedCount += 1;
    }
  }

  return { imagePaths, failedCount };
}

function cleanupTempFiles(filePaths: string[]): void {
  for (const filePath of filePaths) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // ignore cleanup errors
    }
  }
}

function buildCodexSdkRunInput(promptText: string, imagePaths: string[]): string | CodexRunInputItem[] {
  if (imagePaths.length === 0) {
    return promptText;
  }
  return [
    { type: 'text', text: promptText },
    ...imagePaths.map((filePath) => ({ type: 'local_image' as const, path: filePath })),
  ];
}

export const __TEST_ONLY__ = {
  stripInlineImageDataUrls,
  extractInlineImages,
  persistInlineImagesToTempFiles,
  cleanupTempFiles,
  buildCodexSdkRunInput,
  buildCodexExecArgs,
};

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
  const cliPath = findCodexCli();
  const model = options.model || '';

  let childProcess: ChildProcess | null = null;
  let activeThread: { interrupt?: () => Promise<void> | void } | null = null;
  let aborted = false;

  if (agentType === 'cli' && cliPath) {
    // 有 sessionId 时使用 resume 恢复会话，同时注入本轮 context，避免首轮 context 锚定
    // 无 sessionId 时为首次对话，构建包含 context 的完整 prompt
    const cliHistory: AIMessage[] = history.map((msg) => ({
      role: msg.role,
      content: stripInlineImageDataUrls(msg.content),
    }));
    const extracted = extractInlineImages(message);
    const prompt = sessionId
      ? buildResumeTurnPrompt(extracted.text, context, cwd)
      : buildPrompt(extracted.text, context, cliHistory, cwd);

    sendSSE({ type: 'info', message: 'Using local Codex CLI', cwd, model });

    const cliOptions = getCodexCliOptions(codexOptions);
    const cliImageFiles = persistInlineImagesToTempFiles(extracted.images);
    if (cliImageFiles.imagePaths.length > 0) {
      sendSSE({
        type: 'info',
        message: `Detected ${cliImageFiles.imagePaths.length} image(s). Sending via Codex CLI --image.`,
      });
    }
    if (cliImageFiles.failedCount > 0) {
      sendSSE({
        type: 'info',
        message: `Failed to process ${cliImageFiles.failedCount} inline image(s).`,
      });
    }

    childProcess = queryViaCli(
      cliPath,
      prompt,
      cwd,
      cliOptions,
      cliImageFiles.imagePaths,
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
      const sdkHistory: AIMessage[] = history.map((msg) => ({
        role: msg.role,
        content: stripInlineImageDataUrls(msg.content),
      }));
      const extracted = extractInlineImages(message);
      const sdkPrompt = sessionId
        ? buildResumeTurnPrompt(extracted.text, context, cwd)
        : buildPrompt(extracted.text, context, sdkHistory, cwd);
      const sdkOptions = getCodexSdkOptions(codexOptions);
      const sdkImageFiles = persistInlineImagesToTempFiles(extracted.images);
      const sdkInput = buildCodexSdkRunInput(sdkPrompt, sdkImageFiles.imagePaths);

      if (sdkImageFiles.imagePaths.length > 0) {
        sendSSE({
          type: 'info',
          message: `Detected ${sdkImageFiles.imagePaths.length} image(s). Sending as Codex SDK multimodal input.`,
        });
      }
      if (sdkImageFiles.failedCount > 0) {
        sendSSE({
          type: 'info',
          message: `Failed to process ${sdkImageFiles.failedCount} inline image(s).`,
        });
      }

      try {
        if (agentType === 'cli' && !cliPath) {
          sendSSE({ type: 'info', message: 'Codex CLI not found. Falling back to Codex SDK', cwd });
        }
        sendSSE({ type: 'info', message: 'Using Codex SDK', cwd, model });

        activeThread = await queryViaSdk(
          sdkInput,
          cwd,
          sdkOptions,
          sessionId,
          sendSSE,
          () => aborted,
          sdkImageFiles.imagePaths
        );

        sendSSE('[DONE]');
        onEnd();
      } catch (error: any) {
        let finalError = error;
        if (!aborted && extracted.images.length > 0 && cliPath) {
          sendSSE({
            type: 'info',
            message: `Codex SDK image input failed. Falling back to local Codex CLI. (${error.message})`,
          });
          const cliOptions = getCodexCliOptions(codexOptions);
          const fallbackImageFiles = persistInlineImagesToTempFiles(extracted.images);
          if (fallbackImageFiles.imagePaths.length > 0) {
            sendSSE({
              type: 'info',
              message: `Detected ${fallbackImageFiles.imagePaths.length} image(s). Sending via Codex CLI --image.`,
            });
          }
          if (fallbackImageFiles.failedCount > 0) {
            sendSSE({
              type: 'info',
              message: `Failed to process ${fallbackImageFiles.failedCount} inline image(s).`,
            });
          }
          childProcess = queryViaCli(
            cliPath,
            sdkPrompt,
            cwd,
            cliOptions,
            fallbackImageFiles.imagePaths,
            (jsonData) => {
              try {
                const data = JSON.parse(jsonData);
                sendSSE(data);
              } catch {
                sendSSE({ type: 'text', content: jsonData });
              }
            },
            (sdkFallbackError) => {
              sendSSE({ error: sdkFallbackError });
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
          return;
        }
        if (!aborted && extracted.images.length > 0 && !cliPath) {
          sendSSE({
            type: 'info',
            message:
              `Codex SDK image input failed and local Codex CLI is unavailable. ` +
              `Retrying with text-only prompt. (${error.message})`,
          });
          try {
            activeThread = await queryViaSdk(
              sdkPrompt,
              cwd,
              sdkOptions,
              sessionId,
              sendSSE,
              () => aborted,
              []
            );
            sendSSE('[DONE]');
            onEnd();
            return;
          } catch (retryError: any) {
            finalError = retryError;
          }
        }
        if (!aborted) {
          console.log(chalk.red('[code-inspector-plugin] Codex AI error:') + finalError.message);
          sendSSE({
            error:
              `Failed to communicate with Codex: ${finalError.message}. ` +
              'Install Codex CLI or configure Codex SDK.',
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

function buildCodexExecArgs(
  codexOptions: CodexCliOptions,
  outputFile: string,
  imagePaths: string[],
  prompt: string,
  sessionId?: string
): string[] {
  const commonArgs = buildCommonArgs(codexOptions, outputFile);
  const imageArgs = imagePaths.flatMap((filePath) => ['--image', filePath]);
  const separatorArgs = imageArgs.length > 0 ? ['--'] : [];

  if (sessionId) {
    return ['exec', 'resume', ...commonArgs, ...imageArgs, ...separatorArgs, sessionId, prompt];
  }
  return ['exec', ...commonArgs, ...imageArgs, ...separatorArgs, prompt];
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
  imagePaths: string[],
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
  const args = buildCodexExecArgs(codexOptions, outputFile, imagePaths, prompt, sessionId);
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
  let toolIndex = 0;
  const toolIndexMap = new Map<string, number>();
  const messageTextMap = new Map<string, string>();
  const fileSnapshotStore = new Map<string, Map<string, FileSnapshot>>();

  const finish = () => {
    if (ended) return;
    ended = true;
    onEnd();
  };

  let cleanedArtifacts = false;
  const cleanupArtifacts = () => {
    if (cleanedArtifacts) return;
    cleanedArtifacts = true;
    try {
      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
      }
    } catch {
      // 忽略清理错误
    }
    cleanupTempFiles(imagePaths);
  };

  const emitToolFromItem = (item: any, done = false) => {
    const toolEvent = buildToolEventFromItem(item, {
      cwd,
      fileSnapshots: fileSnapshotStore,
      done,
    });
    if (!toolEvent) return;

    let index = toolIndexMap.get(toolEvent.toolId);
    let isNewTool = false;
    if (index === undefined) {
      index = toolIndex++;
      isNewTool = true;
      toolIndexMap.set(toolEvent.toolId, index);
      hasAnyContent = true;
      onData(JSON.stringify({
        type: 'tool_start',
        toolId: toolEvent.toolId,
        toolName: toolEvent.toolName,
        index,
      }));
      if (toolEvent.input) {
        onData(JSON.stringify({
          type: 'tool_input',
          toolUseId: toolEvent.toolId,
          index,
          input: toolEvent.input,
        }));
      }
    }

    if (done && toolEvent.result !== undefined) {
      if (
        !isNewTool
        && index !== undefined
        && toolEvent.toolName === 'Edit'
        && toolEvent.input
      ) {
        hasAnyContent = true;
        onData(JSON.stringify({
          type: 'tool_input',
          toolUseId: toolEvent.toolId,
          index,
          input: toolEvent.input,
        }));
      }
      hasAnyContent = true;
      onData(JSON.stringify({
        type: 'tool_result',
        toolUseId: toolEvent.toolId,
        content: toolEvent.result,
        isError: toolEvent.isError,
      }));
    }
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
        return;
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

      if (event.type === 'item.started') {
        emitToolFromItem(event.item, false);
        return;
      }

      if (event.type === 'item.updated') {
        const item = event.item;
        if (item?.type === 'agent_message' && item?.id) {
          const current = getItemText(item);
          const previous = messageTextMap.get(item.id) || '';
          const delta = current.startsWith(previous) ? current.slice(previous.length) : current;
          if (delta) {
            hasAnyContent = true;
            onData(JSON.stringify({ type: 'text', content: delta }));
          }
          messageTextMap.set(item.id, current);
        } else {
          emitToolFromItem(item, false);
        }
        return;
      }

      if (event.type === 'item.completed') {
        const item = event.item;
        if (item?.type === 'agent_message' && item?.id) {
          const current = getItemText(item);
          const previous = messageTextMap.get(item.id) || '';
          const delta = current.startsWith(previous) ? current.slice(previous.length) : current;
          if (delta) {
            hasAnyContent = true;
            onData(JSON.stringify({ type: 'text', content: delta }));
          }
          messageTextMap.delete(item.id);
        } else {
          emitToolFromItem(item, true);
        }
        return;
      }

      if (event.type === 'task_complete') {
        if (!hasAnyContent && typeof event.last_agent_message === 'string' && event.last_agent_message) {
          hasAnyContent = true;
          onData(JSON.stringify({ type: 'text', content: event.last_agent_message }));
        } else if (!hasAnyContent && typeof event.result === 'string' && event.result) {
          hasAnyContent = true;
          onData(JSON.stringify({ type: 'text', content: event.result }));
        }
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
    cleanupArtifacts();
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

    cleanupArtifacts();
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

type FileSnapshot = {
  absolutePath: string;
  displayPath: string;
  beforeContent: string;
};

const MAX_DIFF_CHARS_PER_FILE = 12000;

function truncateDiffText(text: string): string {
  if (text.length <= MAX_DIFF_CHARS_PER_FILE) {
    return text;
  }
  return text.slice(0, MAX_DIFF_CHARS_PER_FILE) + `\n...[truncated ${text.length - MAX_DIFF_CHARS_PER_FILE} chars]`;
}

function readFileText(absolutePath: string): { exists: boolean; content: string } {
  try {
    if (!fs.existsSync(absolutePath)) {
      return { exists: false, content: '' };
    }
    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) {
      return { exists: true, content: '[not a regular file]' };
    }
    return { exists: true, content: fs.readFileSync(absolutePath, 'utf-8') };
  } catch {
    return { exists: fs.existsSync(absolutePath), content: '[unable to read file content]' };
  }
}

function resolveChangePath(changePath: string, cwd: string): { absolutePath: string; displayPath: string } {
  if (path.isAbsolute(changePath)) {
    return { absolutePath: changePath, displayPath: changePath };
  }
  return { absolutePath: path.resolve(cwd, changePath), displayPath: changePath };
}

function ensureFileSnapshot(
  toolId: string,
  displayPath: string,
  absolutePath: string,
  store: Map<string, Map<string, FileSnapshot>>
): FileSnapshot {
  let toolSnapshots = store.get(toolId);
  if (!toolSnapshots) {
    toolSnapshots = new Map();
    store.set(toolId, toolSnapshots);
  }

  let snapshot = toolSnapshots.get(absolutePath);
  if (!snapshot) {
    const before = readFileText(absolutePath);
    snapshot = {
      absolutePath,
      displayPath,
      beforeContent: before.content,
    };
    toolSnapshots.set(absolutePath, snapshot);
  }

  return snapshot;
}

function getFileSnapshot(
  toolId: string,
  absolutePath: string,
  store: Map<string, Map<string, FileSnapshot>>
): FileSnapshot | null {
  return store.get(toolId)?.get(absolutePath) || null;
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

function buildToolEventFromItem(
  item: any,
  context?: {
    cwd?: string;
    fileSnapshots?: Map<string, Map<string, FileSnapshot>>;
    done?: boolean;
  }
): {
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
    const command = typeof item.command === 'string' ? item.command : '';
    const output = item.aggregated_output || item.output || '';
    const exitCode = typeof item.exit_code === 'number' ? item.exit_code : undefined;
    const status = String(item.status || '');
    const isError = status === 'failed' || (exitCode !== undefined && exitCode !== 0);

    return {
      toolId: String(item.id),
      toolName: 'Bash',
      input: command ? { _provider: 'codex', command } : { _provider: 'codex' },
      result: output || (exitCode !== undefined ? `exit code ${exitCode}` : ''),
      isError,
    };
  }

  if (item.type === 'file_change') {
    const changes = Array.isArray(item.changes) ? item.changes : [];
    const firstPath = typeof changes[0]?.path === 'string' ? changes[0].path : '';
    let input: Record<string, any> = { _provider: 'codex', file_path: firstPath, changes };

    // Codex file_change 仅包含文件级元信息，这里通过快照补齐前后文本，用于前端红绿 diff
    if (context?.cwd && context.fileSnapshots && changes.length > 0) {
      const toolId = String(item.id);
      const oldSections: string[] = [];
      const newSections: string[] = [];
      const diffBlocks: Array<{ file_path: string; old_string: string; new_string: string }> = [];

      for (const change of changes) {
        const changePath = typeof change?.path === 'string' ? change.path : '';
        if (!changePath) continue;

        const { absolutePath, displayPath } = resolveChangePath(changePath, context.cwd);
        if (!context.done) {
          ensureFileSnapshot(toolId, displayPath, absolutePath, context.fileSnapshots);
          continue;
        }

        const snapshot = getFileSnapshot(toolId, absolutePath, context.fileSnapshots);
        const after = readFileText(absolutePath);
        const kind = String(change?.kind || '');
        if (kind !== 'add' && !snapshot) {
          // Cannot reliably reconstruct pre-edit content if no runtime snapshot was captured.
          continue;
        }

        const beforeText = kind === 'add' ? '' : (snapshot?.beforeContent || '');
        const afterText = kind === 'delete' ? '' : after.content;
        let oldString = truncateDiffText(beforeText);
        let newString = truncateDiffText(afterText);

        // If truncation hides the change and collapses old/new into the same text, fallback to full content.
        if (beforeText !== afterText && oldString === newString) {
          oldString = beforeText;
          newString = afterText;
        }

        diffBlocks.push({
          file_path: displayPath,
          old_string: oldString,
          new_string: newString,
        });

        if (beforeText) {
          oldSections.push(`# ${displayPath}\n${oldString}`);
        }
        if (afterText) {
          newSections.push(`# ${displayPath}\n${newString}`);
        }
      }

      if (context.done) {
        input = {
          _provider: 'codex',
          file_path: firstPath,
          old_string: oldSections.join('\n\n'),
          new_string: newSections.join('\n\n'),
          diff_blocks: diffBlocks,
          changes,
        };
      }
    }
    return {
      toolId: String(item.id),
      toolName: 'Edit',
      input,
      result: changes.length > 0 ? `Applied ${changes.length} file changes` : 'Applied file changes',
      isError: item.status === 'failed',
    };
  }

  if (item.type === 'web_search') {
    return {
      toolId: String(item.id),
      toolName: 'WebSearch',
      input: item.query ? { _provider: 'codex', query: item.query } : { _provider: 'codex' },
      result: stringifyUnknown(item.result || item.output),
      isError: item.status === 'failed',
    };
  }

  if (item.type === 'mcp_tool_call') {
    const mcpInput: Record<string, any> = { _provider: 'codex' };
    if (item.server) mcpInput.server = item.server;
    if (item.tool) mcpInput.tool = item.tool;
    if (item.arguments !== undefined) mcpInput.arguments = item.arguments;
    if (item.input !== undefined) mcpInput.input = item.input;
    return {
      toolId: String(item.id),
      toolName: item.name || item.tool_name || item.tool || 'MCPTool',
      input: mcpInput,
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
  input: string | CodexRunInputItem[],
  cwd: string,
  codexOptions: CodexSdkOptions,
  sessionId: string | undefined,
  sendSSE: (data: object | string) => void,
  isAborted: () => boolean,
  tempImagePaths: string[]
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

  const runResult = await thread.runStreamed(input as any);
  const events = runResult?.events || runResult;
  const toolIndexMap = new Map<string, number>();
  const messageTextMap = new Map<string, string>();
  let hasAnyText = false;
  let toolIndex = 0;
  const fileSnapshotStore = new Map<string, Map<string, FileSnapshot>>();

  const emitToolFromItem = (item: any, done = false) => {
    const toolEvent = buildToolEventFromItem(item, {
      cwd,
      fileSnapshots: fileSnapshotStore,
      done,
    });
    if (!toolEvent) return;

    let index = toolIndexMap.get(toolEvent.toolId);
    let isNewTool = false;
    if (index === undefined) {
      index = toolIndex++;
      isNewTool = true;
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
          toolUseId: toolEvent.toolId,
          index,
          input: toolEvent.input,
        });
      }
    }

    if (done && toolEvent.result !== undefined) {
      if (
        !isNewTool
        && index !== undefined
        && toolEvent.toolName === 'Edit'
        && toolEvent.input
      ) {
        sendSSE({
          type: 'tool_input',
          toolUseId: toolEvent.toolId,
          index,
          input: toolEvent.input,
        });
      }
      sendSSE({
        type: 'tool_result',
        toolUseId: toolEvent.toolId,
        content: toolEvent.result,
        isError: toolEvent.isError,
      });
    }
  };

  try {
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
  } finally {
    cleanupTempFiles(tempImagePaths);
  }

  return thread;
}
