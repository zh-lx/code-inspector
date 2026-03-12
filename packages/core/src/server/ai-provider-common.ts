/**
 * Codex Provider - 支持本地 CLI 和 SDK 两种调用方式
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn, ChildProcess, execSync } from 'child_process';
import type {
  CodexOptions,
  CodexCliOptions,
  CodexSdkOptions,
  CodexAgentOptions,
} from '../shared';
import type { AIContext, AIMessage } from './ai';
import type { ProviderCallbacks, ProviderResult } from './ai-provider-claude';
import { getEnvVars } from './server';
import chalk from 'chalk';

export type CodexProviderRuntime = {
  providerId: 'codex' | 'opencode';
  displayName: 'Codex' | 'OpenCode';
  cliBinaryName: 'codex' | 'opencode';
  sdkPackages: string[];
  sdkInstallCommand: string;
};

/** Parsed JSON event from Codex/OpenCode CLI or SDK stream */
interface CliStreamEvent {
  type: string;
  sessionID?: string;
  sessionId?: string;
  thread_id?: string;
  info?: {
    id?: string;
    modelID?: string;
    model?: { modelID?: string };
    error?: { message?: string; data?: { message?: string } };
  };
  part?: {
    type?: string;
    id?: string;
    callID?: string;
    tool?: string;
    name?: string;
    text?: string;
    state?: any;
    files?: any[];
  };
  properties?: Record<string, any>;
  item?: any;
  field?: string;
  delta?: any;
  text?: string;
  output_text?: string;
  partID?: string;
  message?: any;
  error?: any;
  model?: string;
  modelID?: string;
  response?: { model?: string };
  metadata?: { model?: string };
  last_agent_message?: string;
  result?: string;
  content?: any;
}

export const CODEX_PROVIDER_RUNTIME: CodexProviderRuntime = {
  providerId: 'codex',
  displayName: 'Codex',
  cliBinaryName: 'codex',
  sdkPackages: ['@openai/codex-sdk'],
  sdkInstallCommand: 'npm install @openai/codex-sdk',
};

/**
 * 构建完整的提示信息
 */
export function buildPrompt(
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
export function buildResumeTurnPrompt(
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

export interface InlineImagePayload {
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

export const INLINE_IMAGE_DATA_URL_REGEX =
  /data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g;

export function stripInlineImageDataUrls(text: string): string {
  return text.replace(
    INLINE_IMAGE_DATA_URL_REGEX,
    '[Inline image data omitted]',
  );
}

export function extractInlineImages(text: string): {
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

export function mediaTypeToExtension(mediaType: string): string {
  const normalized = mediaType.toLowerCase();
  if (normalized === 'image/jpeg') return 'jpg';
  if (normalized === 'image/svg+xml') return 'svg';
  if (normalized === 'image/x-icon') return 'ico';
  const subtype = normalized.split('/')[1] || 'png';
  return subtype.split('+')[0] || 'png';
}

function persistInlineImagesToTempFiles(
  images: InlineImagePayload[],
): TempImageWriteResult {
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

function buildCodexSdkRunInput(
  promptText: string,
  imagePaths: string[],
): string | CodexRunInputItem[] {
  if (imagePaths.length === 0) {
    return promptText;
  }
  return [
    { type: 'text', text: promptText },
    ...imagePaths.map((filePath) => ({
      type: 'local_image' as const,
      path: filePath,
    })),
  ];
}

export const __TEST_ONLY__ = {
  buildPrompt,
  buildResumeTurnPrompt,
  stripInlineImageDataUrls,
  extractInlineImages,
  mediaTypeToExtension,
  persistInlineImagesToTempFiles,
  cleanupTempFiles,
  buildCodexSdkRunInput,
  buildCodexExecArgs,
  buildOpenCodeRunArgs,
  buildCliArgs,
  getCodexAgentOptions,
  getCodexCliOptions,
  getCodexSdkOptions,
  formatConfigValue,
  buildCommonArgs,
  extractTextFromContent,
  extractModelFromEvent,
  extractTextEvent,
  shouldIgnorePlainLine,
  findCodexCli,
  queryViaCli,
  getCodexSDKCtor,
  buildCodexSDKClientOptions,
  buildCodexSDKThreadOptions,
  stringifyUnknown,
  truncateDiffText,
  readFileText,
  resolveChangePath,
  ensureFileSnapshot,
  getFileSnapshot,
  getItemText,
  buildToolEventFromItem,
  detectReadCommand,
  stripNlLineNumbers,
  buildSDKErrorMessage,
  queryViaSdk,
  setCodexSDKCtor: (ctor: any, pkg = '') => {
    CodexSDKCtor = ctor;
    loadedCodexSdkPackage = pkg;
    lastCodexSdkLoadIssue = '';
  },
  resetCaches: () => {
    cachedCliModel = undefined;
    cachedCliPathMap.clear();
    CodexSDKCtor = null;
    loadedCodexSdkPackage = '';
    lastCodexSdkLoadIssue = '';
  },
};

/**
 * 缓存 CLI 检测到的模型名
 */
let cachedCliModel: string | undefined;

function getCodexAgentOptions(codexOptions?: CodexOptions): CodexAgentOptions {
  return codexOptions?.options || {};
}

function getCodexCliOptions(codexOptions?: CodexOptions): CodexCliOptions {
  if (codexOptions?.type === 'sdk') {
    return {};
  }
  return codexOptions?.options || {};
}

function getCodexSdkOptions(codexOptions?: CodexOptions): CodexSdkOptions {
  if (
    !codexOptions ||
    codexOptions.type === 'cli' ||
    codexOptions.type === undefined
  ) {
    return {};
  }
  return codexOptions.options || {};
}

/**
 * 获取模型信息
 * 优先使用用户配置（Codex 暂不通过额外请求探测模型）
 */
export async function getModelInfo(
  codexOptions: CodexOptions | undefined,
): Promise<string> {
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
  runtime: CodexProviderRuntime = CODEX_PROVIDER_RUNTIME,
): ProviderResult {
  const { sendSSE, onEnd } = callbacks;
  const agentType = codexOptions?.type || 'cli';
  const options = getCodexAgentOptions(codexOptions);
  const cliPath = findCodexCli(runtime);
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

    sendSSE({
      type: 'info',
      message: `Using local ${runtime.displayName} CLI`,
      cwd,
      model,
    });

    const cliOptions = getCodexCliOptions(codexOptions);
    const cliImageFiles = persistInlineImagesToTempFiles(extracted.images);
    if (cliImageFiles.imagePaths.length > 0) {
      sendSSE({
        type: 'info',
        message: `Detected ${cliImageFiles.imagePaths.length} image(s). Sending via ${runtime.displayName} CLI --image.`,
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
      () => aborted,
      runtime,
    );
  } else {
    // 使用 SDK（type='sdk' 或 type='cli' 但 CLI 未找到时回退）
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
      const sdkInput = buildCodexSdkRunInput(
        sdkPrompt,
        sdkImageFiles.imagePaths,
      );

      if (sdkImageFiles.imagePaths.length > 0) {
        sendSSE({
          type: 'info',
          message: `Detected ${sdkImageFiles.imagePaths.length} image(s). Sending as ${runtime.displayName} SDK multimodal input.`,
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
          sendSSE({
            type: 'info',
            message: `${runtime.displayName} CLI not found. Falling back to ${runtime.displayName} SDK`,
            cwd,
          });
        }
        sendSSE({
          type: 'info',
          message: `Using ${runtime.displayName} SDK`,
          cwd,
          model,
        });

        activeThread = await queryViaSdk(
          sdkInput,
          cwd,
          sdkOptions,
          sessionId,
          sendSSE,
          () => aborted,
          sdkImageFiles.imagePaths,
          runtime,
        );

        sendSSE('[DONE]');
        onEnd();
      } catch (error: any) {
        let finalError = error;
        if (!aborted && extracted.images.length > 0 && cliPath) {
          sendSSE({
            type: 'info',
            message: `${runtime.displayName} SDK image input failed. Falling back to local ${runtime.displayName} CLI. (${error.message})`,
          });
          const cliOptions = getCodexCliOptions(codexOptions);
          const fallbackImageFiles = persistInlineImagesToTempFiles(
            extracted.images,
          );
          if (fallbackImageFiles.imagePaths.length > 0) {
            sendSSE({
              type: 'info',
              message: `Detected ${fallbackImageFiles.imagePaths.length} image(s). Sending via ${runtime.displayName} CLI --image.`,
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
            () => aborted,
            runtime,
          );
          return;
        }
        if (!aborted && extracted.images.length > 0 && !cliPath) {
          sendSSE({
            type: 'info',
            message:
              `${runtime.displayName} SDK image input failed and local ${runtime.displayName} CLI is unavailable. ` +
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
              [],
              runtime,
            );
            sendSSE('[DONE]');
            onEnd();
            return;
          } catch (retryError: any) {
            finalError = retryError;
          }
        }
        if (!aborted) {
          console.log(
            chalk.red(
              `[code-inspector-plugin] ${runtime.displayName} AI error:`,
            ) + finalError.message,
          );
          sendSSE({
            error:
              `Failed to communicate with ${runtime.displayName}: ${finalError.message}. ` +
              `Install ${runtime.displayName} CLI or configure ${runtime.displayName} SDK.`,
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
const cachedCliPathMap = new Map<string, string | null | undefined>();

/**
 * 查找本地 Codex CLI 路径
 */
function findCodexCli(
  runtime: CodexProviderRuntime = CODEX_PROVIDER_RUNTIME,
): string | null {
  const cachedCliPath = cachedCliPathMap.get(runtime.cliBinaryName);
  if (cachedCliPath !== undefined) {
    return cachedCliPath || null;
  }

  try {
    const command =
      process.platform === 'win32'
        ? `where ${runtime.cliBinaryName}`
        : `which ${runtime.cliBinaryName}`;
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (result) {
      const foundPath = result.split('\n')[0];
      cachedCliPathMap.set(runtime.cliBinaryName, foundPath);
      return foundPath;
    }
  } catch {
    // 命令未找到
  }

  const possiblePaths = [
    path.join(
      process.env.HOME || '',
      '.npm-global',
      'bin',
      runtime.cliBinaryName,
    ),
    path.join(process.env.HOME || '', '.yarn', 'bin', runtime.cliBinaryName),
    path.join(
      process.env.HOME || '',
      '.local',
      'share',
      'pnpm',
      runtime.cliBinaryName,
    ),
    `/usr/local/bin/${runtime.cliBinaryName}`,
    `/opt/homebrew/bin/${runtime.cliBinaryName}`,
    `/usr/bin/${runtime.cliBinaryName}`,
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      cachedCliPathMap.set(runtime.cliBinaryName, p);
      return p;
    }
  }

  cachedCliPathMap.set(runtime.cliBinaryName, null);
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
  outputFile: string,
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

function buildOpenCodeRunArgs(
  codexOptions: CodexCliOptions,
  imagePaths: string[],
  prompt: string,
  sessionId?: string,
): string[] {
  const args = ['run', '--format', 'json'];

  if (codexOptions?.model) {
    args.push('-m', codexOptions.model);
  }

  // OpenCode uses agent name; reuse profile if provided to stay backward compatible.
  if (codexOptions?.profile) {
    args.push('--agent', codexOptions.profile);
  }

  if (sessionId) {
    args.push('--session', sessionId);
  }

  for (const filePath of imagePaths) {
    args.push('--file', filePath);
  }

  // When --file is present the opencode CLI treats the positional argument as
  // a file path, causing "File not found" errors. In that case the prompt is
  // sent via stdin instead (see queryViaCli).
  if (imagePaths.length === 0) {
    args.push(prompt);
  }
  return args;
}

function buildCodexExecArgs(
  codexOptions: CodexCliOptions,
  outputFile: string,
  imagePaths: string[],
  prompt: string,
  sessionId?: string,
): string[] {
  const commonArgs = buildCommonArgs(codexOptions, outputFile);
  const imageArgs = imagePaths.flatMap((filePath) => ['--image', filePath]);
  const separatorArgs = imageArgs.length > 0 ? ['--'] : [];

  if (sessionId) {
    return [
      'exec',
      'resume',
      ...commonArgs,
      ...imageArgs,
      ...separatorArgs,
      sessionId,
      prompt,
    ];
  }
  return ['exec', ...commonArgs, ...imageArgs, ...separatorArgs, prompt];
}

function buildCliArgs(
  codexOptions: CodexCliOptions,
  outputFile: string,
  imagePaths: string[],
  prompt: string,
  sessionId: string | undefined,
  runtime: CodexProviderRuntime,
): string[] {
  if (runtime.providerId === 'opencode') {
    return buildOpenCodeRunArgs(codexOptions, imagePaths, prompt, sessionId);
  }
  return buildCodexExecArgs(
    codexOptions,
    outputFile,
    imagePaths,
    prompt,
    sessionId,
  );
}

function extractTextFromContent(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (!item) return '';
        if (typeof item === 'string') return item;
        if (typeof item.text === 'string') return item.text;
        if (typeof item.content === 'string') return item.content;
        return '';
      })
      .join('');
  }

  return '';
}

function extractModelFromEvent(event: CliStreamEvent): string {
  if (typeof event.model === 'string') {
    return event.model;
  }
  if (typeof event.modelID === 'string') {
    return event.modelID;
  }
  if (typeof event.response?.model === 'string') {
    return event.response.model;
  }
  if (typeof event.metadata?.model === 'string') {
    return event.metadata.model;
  }
  if (typeof event.info?.modelID === 'string') {
    return event.info.modelID;
  }
  if (typeof event.info?.model?.modelID === 'string') {
    return event.info.model.modelID;
  }
  return '';
}

function extractEventErrorMessage(event: CliStreamEvent): string {
  if (typeof event.message === 'string' && event.message) {
    return event.message;
  }
  if (typeof event.error === 'string' && event.error) {
    return event.error;
  }
  if (typeof event.error?.message === 'string' && event.error.message) {
    return event.error.message;
  }
  if (
    typeof event.error?.data?.message === 'string' &&
    event.error.data.message
  ) {
    return event.error.data.message;
  }
  if (
    typeof event.info?.error?.message === 'string' &&
    event.info.error.message
  ) {
    return event.info.error.message;
  }
  if (
    typeof event.info?.error?.data?.message === 'string' &&
    event.info.error.data.message
  ) {
    return event.info.error.data.message;
  }
  return '';
}

function extractTextEvent(
  event: CliStreamEvent,
): { text: string; delta: boolean } | null {
  if (event.type === 'text' && typeof event.part?.text === 'string') {
    return { text: event.part.text, delta: false };
  }
  if (event.type === 'reasoning' && typeof event.part?.text === 'string') {
    return { text: event.part.text, delta: false };
  }
  if (
    event.type === 'response.output_text.delta' &&
    typeof event.delta === 'string'
  ) {
    return { text: event.delta, delta: true };
  }
  if (
    event.type === 'response.output_text.done' &&
    typeof event.text === 'string'
  ) {
    return { text: event.text, delta: false };
  }
  if (typeof event.delta === 'string') {
    return { text: event.delta, delta: true };
  }
  if (typeof event.delta?.text === 'string') {
    return { text: event.delta.text, delta: true };
  }
  if (typeof event.text === 'string') {
    return { text: event.text, delta: false };
  }
  if (typeof event.output_text === 'string') {
    return { text: event.output_text, delta: false };
  }

  const messageText = extractTextFromContent(event.message?.content);
  if (messageText) {
    return { text: messageText, delta: false };
  }

  const contentText = extractTextFromContent(event.content);
  if (contentText) {
    return { text: contentText, delta: false };
  }

  return null;
}

function shouldIgnorePlainLine(line: string): boolean {
  if (!line.trim()) return true;
  if (
    line.startsWith('WARNING: proceeding, even though we could not update PATH')
  )
    return true;
  if (line.startsWith('Performing one time database migration')) return true;
  if (line.startsWith('sqlite-migration:done')) return true;
  if (line.startsWith('Database migration complete.')) return true;
  if (/^ERROR\s+\d{4}-\d{2}-\d{2}T/.test(line)) return true;
  if (/^\d{4}-\d{2}-\d{2}T.*\sERROR\s/.test(line)) return true;
  return false;
}

function stripAnsiCodes(line: string): string {
  return line.replace(/\u001b\[[0-9;]*m/g, '');
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
  isAborted?: () => boolean,
  runtime: CodexProviderRuntime = CODEX_PROVIDER_RUNTIME,
): ChildProcess {
  const outputFile = path.join(
    os.tmpdir(),
    `code-inspector-${runtime.providerId}-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`,
  );
  const cliArgs = buildCliArgs(
    codexOptions,
    outputFile,
    imagePaths,
    prompt,
    sessionId,
    runtime,
  );
  const env = { ...getEnvVars(), ...codexOptions?.env };

  const child = spawn(cliPath, cliArgs, {
    cwd,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // For opencode with images the prompt is omitted from the positional args
  // (--file causes it to be treated as a file path). Send it via stdin instead.
  if (runtime.providerId === 'opencode' && imagePaths.length > 0) {
    child.stdin?.write(prompt, () => child.stdin?.end());
  } else {
    child.stdin?.end();
  }

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
  const partTextMap = new Map<string, string>();
  const fileSnapshotStore = new Map<string, Map<string, FileSnapshot>>();
  const readOutputStore = new Map<string, string>();

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
      readOutputStore,
      done,
      providerId: runtime.providerId,
    });
    if (!toolEvent) return;

    let index = toolIndexMap.get(toolEvent.toolId);
    let isNewTool = false;
    if (index === undefined) {
      index = toolIndex++;
      isNewTool = true;
      toolIndexMap.set(toolEvent.toolId, index);
      hasAnyContent = true;
      onData(
        JSON.stringify({
          type: 'tool_start',
          toolId: toolEvent.toolId,
          toolName: toolEvent.toolName,
          index,
        }),
      );
      if (toolEvent.input) {
        onData(
          JSON.stringify({
            type: 'tool_input',
            toolUseId: toolEvent.toolId,
            index,
            input: toolEvent.input,
          }),
        );
      }
    }

    if (done && toolEvent.result !== undefined) {
      if (
        !isNewTool &&
        (toolEvent.toolName === 'Edit' || toolEvent.toolName === 'Read') &&
        toolEvent.input
      ) {
        hasAnyContent = true;
        onData(
          JSON.stringify({
            type: 'tool_input',
            toolUseId: toolEvent.toolId,
            index,
            input: toolEvent.input,
          }),
        );
      }
      hasAnyContent = true;
      onData(
        JSON.stringify({
          type: 'tool_result',
          toolUseId: toolEvent.toolId,
          content: toolEvent.result,
          isError: toolEvent.isError,
        }),
      );
    }
  };

  const handleLine = (line: string) => {
    const normalizedLine = stripAnsiCodes(line).trimEnd();

    if (isAborted?.()) {
      return;
    }

    if (shouldIgnorePlainLine(normalizedLine)) {
      return;
    }

    const sessionMatch = normalizedLine.match(/session id:\s*([a-zA-Z0-9-]+)/i);
    if (sessionMatch?.[1] && onSessionId) {
      onSessionId(sessionMatch[1]);
      return;
    }

    const modelMatch = normalizedLine.match(/^model:\s*(.+)$/i);
    if (modelMatch?.[1] && onModel) {
      knownModel = modelMatch[1].trim();
      onModel(knownModel);
      return;
    }

    try {
      let parsed = JSON.parse(normalizedLine);

      // Unwrap GlobalEvent format: { directory, payload: Event }
      if (parsed?.payload?.type) {
        parsed = parsed.payload;
      }

      if (!parsed || typeof parsed.type !== 'string') return;
      const event: CliStreamEvent = parsed;

      if (event.sessionID && onSessionId) {
        onSessionId(String(event.sessionID));
      } else if (event.sessionId && onSessionId) {
        onSessionId(String(event.sessionId));
      } else if (event.info?.id && onSessionId) {
        onSessionId(String(event.info.id));
      }

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
        const message =
          extractEventErrorMessage(event) || `${runtime.displayName} CLI error`;
        if (message.startsWith('Reconnecting...')) {
          return;
        }
        hasError = true;
        onError(message);
        return;
      }

      if (event.type === 'turn.failed') {
        hasError = true;
        const message =
          extractEventErrorMessage(event) ||
          `${runtime.displayName} turn failed`;
        onError(message);
        return;
      }

      if (event.type === 'message.updated') {
        const message = extractEventErrorMessage(event);
        if (message) {
          hasError = true;
          onError(message);
        }
        return;
      }

      // OpenCode CLI: tool_use events (e.g. read, edit, bash)
      if (event.type === 'tool_use' && event.part?.type === 'tool') {
        const part = event.part;
        const toolPartId =
          part.id || part.callID || `opencode-tool-${toolIndex}`;
        const toolName = part.tool || 'Tool';
        const stateObj = part.state || {};

        if (!toolIndexMap.has(toolPartId)) {
          const idx = toolIndex++;
          toolIndexMap.set(toolPartId, idx);
          hasAnyContent = true;
          onData(
            JSON.stringify({
              type: 'tool_start',
              toolId: toolPartId,
              toolName: toolName.charAt(0).toUpperCase() + toolName.slice(1),
              index: idx,
            }),
          );
        }

        const rawInput =
          stateObj.input && typeof stateObj.input === 'object'
            ? stateObj.input
            : {};
        // Normalize field names: filePath → file_path, oldString/newString
        const normalizedInput: Record<string, any> = {
          _provider: runtime.providerId,
          ...rawInput,
        };
        if (rawInput.filePath && !normalizedInput.file_path) {
          normalizedInput.file_path = rawInput.filePath;
        }
        if (rawInput.oldString && !normalizedInput.old_string) {
          normalizedInput.old_string = rawInput.oldString;
        }
        if (rawInput.newString && !normalizedInput.new_string) {
          normalizedInput.new_string = rawInput.newString;
        }
        // Use filediff for richer before/after when available
        const filediff = stateObj.metadata?.filediff;
        if (
          filediff &&
          typeof filediff.before === 'string' &&
          typeof filediff.after === 'string' &&
          !normalizedInput.old_string &&
          !normalizedInput.new_string
        ) {
          normalizedInput.file_path =
            normalizedInput.file_path || filediff.file || '';
          normalizedInput.old_string = filediff.before;
          normalizedInput.new_string = filediff.after;
        }

        onData(
          JSON.stringify({
            type: 'tool_input',
            toolUseId: toolPartId,
            index: toolIndexMap.get(toolPartId),
            input: normalizedInput,
          }),
        );

        if (stateObj.status === 'completed' || stateObj.status === 'error') {
          hasAnyContent = true;
          onData(
            JSON.stringify({
              type: 'tool_result',
              toolUseId: toolPartId,
              content:
                stateObj.status === 'completed'
                  ? stateObj.output || ''
                  : stateObj.error || '',
              isError: stateObj.status === 'error',
            }),
          );
        }

        if (event.sessionID && onSessionId) {
          onSessionId(String(event.sessionID));
        }
        return;
      }

      // OpenCode CLI: text events
      if (event.type === 'text' && event.part?.type === 'text') {
        if (typeof event.part.text === 'string' && event.part.text) {
          hasAnyContent = true;
          onData(JSON.stringify({ type: 'text', content: event.part.text }));
        }
        if (event.sessionID && onSessionId) {
          onSessionId(String(event.sessionID));
        }
        return;
      }

      // OpenCode CLI: step_start / step_finish (informational, extract session)
      if (event.type === 'step_start' || event.type === 'step_finish') {
        if (event.sessionID && onSessionId) {
          onSessionId(String(event.sessionID));
        }
        return;
      }

      if (event.type === 'message.part.delta') {
        if (
          event.field === 'text' &&
          typeof event.delta === 'string' &&
          event.delta
        ) {
          hasAnyContent = true;
          onData(JSON.stringify({ type: 'text', content: event.delta }));
          if (event.partID) {
            const key = String(event.partID);
            partTextMap.set(key, (partTextMap.get(key) || '') + event.delta);
          }
        }
        return;
      }

      if (event.type === 'message.part.updated') {
        const part = event.part || event.properties?.part;
        if (!part) return;

        if (part.type === 'text' && typeof part.text === 'string') {
          const partId = typeof part.id === 'string' ? part.id : '';
          const prev = partId ? partTextMap.get(partId) || '' : '';
          const delta =
            typeof event.properties?.delta === 'string'
              ? event.properties.delta
              : typeof event.delta === 'string'
                ? event.delta
                : part.text.startsWith(prev)
                  ? part.text.slice(prev.length)
                  : part.text;
          if (delta) {
            hasAnyContent = true;
            onData(JSON.stringify({ type: 'text', content: delta }));
          }
          if (partId) {
            partTextMap.set(partId, part.text);
          }
          return;
        }

        // OpenCode CLI: tool events via message.part.updated
        if (part.type === 'tool') {
          const toolPartId =
            part.id || part.callID || `opencode-tool-${toolIndex}`;
          const toolName = part.tool || part.name || 'Tool';
          // state can be an object { status, input, output, error } or a string
          const stateObj =
            typeof part.state === 'object' && part.state !== null
              ? part.state
              : typeof part.state === 'string'
                ? { status: part.state }
                : {};

          if (!toolIndexMap.has(toolPartId)) {
            const idx = toolIndex++;
            toolIndexMap.set(toolPartId, idx);
            hasAnyContent = true;
            onData(
              JSON.stringify({
                type: 'tool_start',
                toolId: toolPartId,
                toolName,
                index: idx,
              }),
            );
          }

          onData(
            JSON.stringify({
              type: 'tool_input',
              toolUseId: toolPartId,
              index: toolIndexMap.get(toolPartId),
              input: {
                _provider: runtime.providerId,
                ...(stateObj.input && typeof stateObj.input === 'object'
                  ? stateObj.input
                  : {}),
              },
            }),
          );

          if (stateObj.status === 'completed' || stateObj.status === 'error') {
            hasAnyContent = true;
            onData(
              JSON.stringify({
                type: 'tool_result',
                toolUseId: toolPartId,
                content:
                  stateObj.status === 'completed'
                    ? stateObj.output || ''
                    : stateObj.error || '',
                isError: stateObj.status === 'error',
              }),
            );
          }
          return;
        }

        // OpenCode CLI: patch events
        if (part.type === 'patch' && Array.isArray(part.files)) {
          const patchId = part.id || `patch-${Date.now()}`;
          if (!toolIndexMap.has(patchId)) {
            const idx = toolIndex++;
            toolIndexMap.set(patchId, idx);
            hasAnyContent = true;
            onData(
              JSON.stringify({
                type: 'tool_start',
                toolId: patchId,
                toolName: 'Edit',
                index: idx,
              }),
            );
          }
          const changes = part.files.map((f: any) => ({
            path: f?.path || '',
            kind: f?.status || 'edit',
          }));
          onData(
            JSON.stringify({
              type: 'tool_input',
              toolUseId: patchId,
              index: toolIndexMap.get(patchId),
              input: {
                _provider: runtime.providerId,
                file_path: changes[0]?.path || '',
                changes,
              },
            }),
          );
          hasAnyContent = true;
          onData(
            JSON.stringify({
              type: 'tool_result',
              toolUseId: patchId,
              content: `Patched ${part.files.length} file(s)`,
            }),
          );
          return;
        }

        return;
      }

      // OpenCode CLI: session.idle signals completion
      if (event.type === 'session.idle') {
        return;
      }

      // OpenCode CLI: session.error
      if (event.type === 'session.error') {
        const errorMessage =
          event.properties?.error?.data?.message ||
          event.properties?.error?.message ||
          'OpenCode session error';
        hasError = true;
        onError(errorMessage);
        return;
      }

      // OpenCode CLI: session.diff carries file diffs
      if (
        event.type === 'session.diff' &&
        event.properties &&
        Array.isArray(event.properties.diff)
      ) {
        for (const fileDiff of event.properties.diff) {
          if (!fileDiff?.file) continue;
          const diffId = `diff-${fileDiff.file}-${Date.now()}`;
          const idx = toolIndex++;
          toolIndexMap.set(diffId, idx);
          hasAnyContent = true;
          onData(
            JSON.stringify({
              type: 'tool_start',
              toolId: diffId,
              toolName: 'Edit',
              index: idx,
            }),
          );
          onData(
            JSON.stringify({
              type: 'tool_input',
              toolUseId: diffId,
              index: idx,
              input: {
                _provider: runtime.providerId,
                file_path: fileDiff.file,
                old_string: fileDiff.before || '',
                new_string: fileDiff.after || '',
              },
            }),
          );
          const summary =
            typeof fileDiff.additions === 'number' &&
            typeof fileDiff.deletions === 'number'
              ? `+${fileDiff.additions} -${fileDiff.deletions}`
              : '';
          onData(
            JSON.stringify({
              type: 'tool_result',
              toolUseId: diffId,
              content: summary || 'Edit applied',
            }),
          );
        }
        return;
      }

      // OpenCode CLI: file.edited notification
      if (event.type === 'file.edited' && event.properties?.file) {
        return; // Already handled via session.diff or tool part
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
          const delta = current.startsWith(previous)
            ? current.slice(previous.length)
            : current;
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
          const delta = current.startsWith(previous)
            ? current.slice(previous.length)
            : current;
          if (delta) {
            hasAnyContent = true;
            onData(JSON.stringify({ type: 'text', content: delta }));
          }
          messageTextMap.delete(item.id);
        } else if (item?.type === 'reasoning') {
          // Reasoning items: internal model thinking, skip silently
        } else if (
          item?.type === 'error' &&
          typeof item.message === 'string' &&
          item.message
        ) {
          // Error items: emit as info message (e.g., model mismatch warnings)
          hasAnyContent = true;
          onData(JSON.stringify({ type: 'info', message: item.message }));
        } else {
          emitToolFromItem(item, true);
        }
        return;
      }

      if (event.type === 'task_complete') {
        if (
          !hasAnyContent &&
          typeof event.last_agent_message === 'string' &&
          event.last_agent_message
        ) {
          hasAnyContent = true;
          onData(
            JSON.stringify({ type: 'text', content: event.last_agent_message }),
          );
        } else if (
          !hasAnyContent &&
          typeof event.result === 'string' &&
          event.result
        ) {
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

    if (normalizedLine.startsWith('ERROR:')) {
      hasError = true;
      onError(normalizedLine.replace(/^ERROR:\s*/, ''));
      return;
    }

    hasAnyContent = true;
    onData(JSON.stringify({ type: 'text', content: normalizedLine + '\n' }));
  };

  const handleChunk = (chunk: Buffer, source: 'stdout' | 'stderr') => {
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
    console.log(
      chalk.red(`[${runtime.cliBinaryName}-cli error] `) + err.message,
    );
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
      onError(`${runtime.displayName} CLI exited with code ${code}`);
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
let lastCodexSdkLoadIssue = '';

async function getCodexSDKCtor(
  runtime: CodexProviderRuntime = CODEX_PROVIDER_RUNTIME,
): Promise<any | null> {
  if (
    CodexSDKCtor &&
    loadedCodexSdkPackage &&
    !runtime.sdkPackages.includes(loadedCodexSdkPackage)
  ) {
    CodexSDKCtor = null;
    loadedCodexSdkPackage = '';
    lastCodexSdkLoadIssue = '';
  }

  if (!CodexSDKCtor) {
    for (const pkg of runtime.sdkPackages) {
      try {
        const sdk: any = await Function(`return import("${pkg}")`)();
        const ctor =
          sdk.Codex ||
          sdk.OpenCode ||
          sdk.default?.Codex ||
          sdk.default?.OpenCode ||
          sdk.default;
        if (ctor) {
          CodexSDKCtor = ctor;
          loadedCodexSdkPackage = pkg;
          lastCodexSdkLoadIssue = '';
          break;
        }

        const hasOpenCodeSdkShape = Boolean(
          sdk.OpencodeClient ||
          sdk.createOpencode ||
          sdk.createOpencodeClient ||
          sdk.default?.OpencodeClient ||
          sdk.default?.createOpencode ||
          sdk.default?.createOpencodeClient,
        );
        if (runtime.providerId === 'opencode' && hasOpenCodeSdkShape) {
          lastCodexSdkLoadIssue =
            `${runtime.displayName} SDK package "${pkg}" is installed, ` +
            'but the current integration only supports Codex-style SDK constructors ' +
            'with startThread/resumeThread methods.';
        }
      } catch {
        // ignore
      }
    }
  }
  return CodexSDKCtor;
}

function buildCodexSDKClientOptions(
  options: CodexSdkOptions,
): Record<string, any> {
  const clientOptions: Record<string, any> = {};
  const opencodePathOverride = (options as any).opencodePathOverride;

  if (options.codexPathOverride)
    clientOptions.codexPathOverride = options.codexPathOverride;
  if (opencodePathOverride)
    clientOptions.opencodePathOverride = opencodePathOverride;
  if (options.baseUrl) clientOptions.baseUrl = options.baseUrl;
  if (options.apiKey) clientOptions.apiKey = options.apiKey;
  if (options.config) clientOptions.config = options.config;
  if (options.env) clientOptions.env = { ...getEnvVars(), ...options.env };

  return clientOptions;
}

function buildCodexSDKThreadOptions(
  options: CodexSdkOptions,
  cwd: string,
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

/**
 * 从 shell 命令中提取被读取的文件路径。
 * 支持 nl -ba / cat / head / tail / sed -n 等常见读取命令，
 * 也支持 `/bin/zsh -lc "cd ... && nl -ba file | sed ..."` 格式。
 * 返回 { filePath, cdDir? }，其中 cdDir 是命令中 cd 到的目录（用于正确解析相对路径）。
 * 未检测到时返回 null。
 */
function detectReadCommand(
  command: string,
): { filePath: string; cdDir?: string } | null {
  // Strip shell wrapper: /bin/zsh -lc "..." or /bin/bash -lc "..." or /bin/sh -c "..."
  let inner = command;
  const shellWrap = command.match(/\/bin\/(?:ba|z)?sh\s+-\w*c\s+"([\s\S]+)"$/);
  if (shellWrap) {
    inner = shellWrap[1];
  }

  // Extract and strip cd prefix: cd /some/path && actual_command
  let cdDir: string | undefined;
  const cdMatch = inner.match(/^cd\s+(\S+)\s*&&\s*/);
  if (cdMatch) {
    cdDir = cdMatch[1];
    inner = inner.slice(cdMatch[0].length);
  }

  const found = (filePath: string): { filePath: string; cdDir?: string } => {
    return cdDir ? { filePath, cdDir } : { filePath };
  };

  // Match common file-reading commands
  // nl -ba <file>, cat <file>, head <file>, tail <file>
  // Strategy: skip all flags (starting with -) and their values, find the first non-flag argument
  const readCmds = ['nl', 'cat', 'head', 'tail'];
  for (const cmd of readCmds) {
    if (!inner.startsWith(cmd + ' ') && inner !== cmd) continue;
    const args = inner.slice(cmd.length).trim().split(/\s+/);
    let skipNext = false;
    for (const arg of args) {
      if (skipNext) {
        skipNext = false;
        continue;
      }
      if (arg.startsWith('-')) {
        // Flags that take a value argument: -n, -c, etc.
        if (/^-[nc]$/.test(arg)) {
          skipNext = true;
        }
        continue;
      }
      // First non-flag, non-numeric argument is the file path
      if (!/^\d+$/.test(arg)) {
        return found(arg);
      }
    }
  }

  // Match sed -n 'range' <file> (when used standalone to view file)
  const sedMatch = inner.match(
    /^sed\s+(?:-\S+\s+)*(?:'[^']*'\s+|"[^"]*"\s+)(\S+)/,
  );
  if (sedMatch && sedMatch[1] && !sedMatch[1].startsWith('-')) {
    return found(sedMatch[1]);
  }

  return null;
}

/**
 * 去除 nl -ba 输出的行号前缀（如 "     1\t..."）。
 */
function stripNlLineNumbers(output: string): string {
  return output.replace(/^\s*\d+\t/gm, '');
}

const MAX_DIFF_CHARS_PER_FILE = 12000;

function truncateDiffText(text: string): string {
  if (text.length <= MAX_DIFF_CHARS_PER_FILE) {
    return text;
  }
  return (
    text.slice(0, MAX_DIFF_CHARS_PER_FILE) +
    `\n...[truncated ${text.length - MAX_DIFF_CHARS_PER_FILE} chars]`
  );
}

function readFileText(absolutePath: string): {
  exists: boolean;
  content: string;
} {
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
    return {
      exists: fs.existsSync(absolutePath),
      content: '[unable to read file content]',
    };
  }
}

function resolveChangePath(
  changePath: string,
  cwd: string,
): { absolutePath: string; displayPath: string } {
  if (path.isAbsolute(changePath)) {
    return { absolutePath: changePath, displayPath: changePath };
  }
  return {
    absolutePath: path.resolve(cwd, changePath),
    displayPath: changePath,
  };
}

function ensureFileSnapshot(
  toolId: string,
  displayPath: string,
  absolutePath: string,
  store: Map<string, Map<string, FileSnapshot>>,
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
  store: Map<string, Map<string, FileSnapshot>>,
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
    readOutputStore?: Map<string, string>;
    done?: boolean;
    providerId?: 'codex' | 'opencode';
  },
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
  const providerId = context?.providerId || 'codex';

  if (item.type === 'command_execution') {
    const command: string =
      typeof item.command === 'string' ? item.command : '';
    const output = item.aggregated_output || item.output || '';
    const exitCode =
      typeof item.exit_code === 'number' ? item.exit_code : undefined;
    const status = String(item.status || '');
    const isError =
      status === 'failed' || (exitCode !== undefined && exitCode !== 0);

    // Detect read-like commands and map to "Read" tool
    // Check command pattern first (even before output is available, e.g., item.started)
    // so that tool_start always emits "Read" instead of "Bash"
    const readInfo = detectReadCommand(command);
    if (readInfo && !isError) {
      const strippedContent = output
        ? stripNlLineNumbers(output).trimEnd()
        : '';
      // Use cdDir from the command (e.g., cd /project/sub && sed ... file)
      // to correctly resolve relative file paths
      const resolveBase = readInfo.cdDir || context?.cwd || '';
      const resolvedPath = resolveBase
        ? path.isAbsolute(readInfo.filePath)
          ? readInfo.filePath
          : path.resolve(resolveBase, readInfo.filePath)
        : readInfo.filePath;

      // Store full file content (not truncated command output) as before-snapshot
      if (context?.readOutputStore && context.done) {
        const fullFile = readFileText(resolvedPath);
        if (fullFile.exists && fullFile.content) {
          context.readOutputStore.set(resolvedPath, fullFile.content);
        }
      }

      return {
        toolId: String(item.id),
        toolName: 'Read',
        input: { _provider: providerId, file_path: readInfo.filePath },
        // Only set result when output is available (item.completed)
        result: strippedContent || undefined,
        isError: false,
      };
    }

    return {
      toolId: String(item.id),
      toolName: 'Bash',
      input:
        command !== ''
          ? { _provider: providerId, command }
          : { _provider: providerId },
      result: output || (exitCode !== undefined ? `exit code ${exitCode}` : ''),
      isError,
    };
  }

  if (item.type === 'file_change') {
    const changes = Array.isArray(item.changes) ? item.changes : [];
    const firstPath =
      typeof changes[0]?.path === 'string' ? changes[0].path : '';
    let input: Record<string, any> = {
      _provider: providerId,
      file_path: firstPath,
      changes,
    };

    // Codex file_change 仅包含文件级元信息，这里通过快照补齐前后文本，用于前端红绿 diff
    if (context?.cwd && context.fileSnapshots && changes.length > 0) {
      const toolId = String(item.id);
      const oldSections: string[] = [];
      const newSections: string[] = [];
      const diffBlocks: Array<{
        file_path: string;
        old_string: string;
        new_string: string;
      }> = [];

      for (const change of changes) {
        const changePath = typeof change?.path === 'string' ? change.path : '';
        if (!changePath) continue;

        const { absolutePath, displayPath } = resolveChangePath(
          changePath,
          context.cwd,
        );
        if (!context.done) {
          ensureFileSnapshot(
            toolId,
            displayPath,
            absolutePath,
            context.fileSnapshots,
          );
          continue;
        }

        const snapshot = getFileSnapshot(
          toolId,
          absolutePath,
          context.fileSnapshots,
        );
        const after = readFileText(absolutePath);
        const kind = String(change?.kind || '');
        if (kind !== 'add' && !snapshot) {
          // Fallback: try readOutputStore for before-content
          const readBefore = context.readOutputStore?.get(absolutePath);
          if (readBefore === undefined) {
            continue;
          }
          const afterText = kind === 'delete' ? '' : after.content;
          if (readBefore === afterText) {
            continue;
          }
          let oldString = truncateDiffText(readBefore);
          let newString = truncateDiffText(afterText);
          if (readBefore !== afterText && oldString === newString) {
            oldString = readBefore;
            newString = afterText;
          }
          diffBlocks.push({
            file_path: displayPath,
            old_string: oldString,
            new_string: newString,
          });
          if (readBefore !== '') {
            oldSections.push(`# ${displayPath}\n${oldString}`);
          }
          if (afterText !== '') {
            newSections.push(`# ${displayPath}\n${newString}`);
          }
          continue;
        }

        const beforeText = kind === 'add' ? '' : snapshot?.beforeContent || '';
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
        if (afterText !== '') {
          newSections.push(`# ${displayPath}\n${newString}`);
        }
      }

      if (context.done) {
        input = {
          _provider: providerId,
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
      result:
        changes.length > 0
          ? `Applied ${changes.length} file changes`
          : 'Applied file changes',
      isError: item.status === 'failed',
    };
  }

  if (item.type === 'web_search') {
    return {
      toolId: String(item.id),
      toolName: 'WebSearch',
      input: item.query
        ? { _provider: providerId, query: item.query }
        : { _provider: providerId },
      result: stringifyUnknown(item.result || item.output),
      isError: item.status === 'failed',
    };
  }

  if (item.type === 'mcp_tool_call') {
    const mcpInput: Record<string, any> = { _provider: providerId };
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

function buildSDKErrorMessage(
  event: CliStreamEvent,
  runtime: CodexProviderRuntime = CODEX_PROVIDER_RUNTIME,
): string {
  if (typeof event.message === 'string') return event.message;
  if (typeof event.error === 'string') return event.error;
  if (typeof event.error?.message === 'string') return event.error.message;
  return `${runtime.displayName} SDK error`;
}

async function queryViaSdk(
  input: string | CodexRunInputItem[],
  cwd: string,
  codexOptions: CodexSdkOptions,
  sessionId: string | undefined,
  sendSSE: (data: object | string) => void,
  isAborted: () => boolean,
  tempImagePaths: string[],
  runtime: CodexProviderRuntime = CODEX_PROVIDER_RUNTIME,
): Promise<{ interrupt?: () => Promise<void> | void } | null> {
  const CodexSDK = await getCodexSDKCtor(runtime);
  if (!CodexSDK) {
    if (lastCodexSdkLoadIssue) {
      console.log(
        chalk.blue('[code-inspector-plugin]'),
        chalk.yellow(lastCodexSdkLoadIssue),
      );
      sendSSE({
        type: 'text',
        content:
          `**${runtime.displayName} SDK is installed, but this integration is incompatible with its API.**\n\n` +
          `${lastCodexSdkLoadIssue}\n\n` +
          "Use CLI mode by setting `type: 'cli'` in your config.",
      });
    } else {
      console.log(
        chalk.blue('[code-inspector-plugin]'),
        chalk.yellow(`${runtime.displayName} SDK not found.`),
        'Install it with:',
        chalk.green(runtime.sdkInstallCommand),
      );
      sendSSE({
        type: 'text',
        content:
          `**${runtime.displayName} SDK not installed.**\n\n` +
          'Please install it in your project:\n\n' +
          '```bash\n' +
          `${runtime.sdkInstallCommand}\n` +
          '```\n\n' +
          "Or use CLI mode by setting `type: 'cli'` in your config.",
      });
    }
    return null;
  }

  if (loadedCodexSdkPackage) {
    sendSSE({
      type: 'info',
      message: `Using ${runtime.displayName} SDK package: ${loadedCodexSdkPackage}`,
    });
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

  const runResult = await thread?.runStreamed?.(input as any);
  const events = runResult?.events || runResult;

  const toolIndexMap = new Map<string, number>();
  const messageTextMap = new Map<string, string>();
  let hasAnyText = false;
  let toolIndex = 0;
  const fileSnapshotStore = new Map<string, Map<string, FileSnapshot>>();
  const readOutputStore = new Map<string, string>();

  const emitToolFromItem = (item: any, done = false) => {
    const toolEvent = buildToolEventFromItem(item, {
      cwd,
      fileSnapshots: fileSnapshotStore,
      readOutputStore,
      done,
      providerId: runtime.providerId,
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
        !isNewTool &&
        (toolEvent.toolName === 'Edit' || toolEvent.toolName === 'Read') &&
        toolEvent.input
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
    for await (const rawEvent of events) {
      if (isAborted()) {
        await Promise.resolve(thread?.interrupt?.()).catch(() => undefined);
        break;
      }

      if (!rawEvent || typeof rawEvent.type !== 'string') continue;
      const event: CliStreamEvent = rawEvent;

      if (event.type === 'error' || event.type === 'turn.failed') {
        sendSSE({ error: buildSDKErrorMessage(event, runtime) });
        continue;
      }

      if (event.type === 'item.started') {
        emitToolFromItem(event.item, false);
        continue;
      }

      if (event.type === 'item.updated') {
        const item = event.item;
        if (item?.type === 'agent_message' && item?.id) {
          const current = getItemText(item);
          const previous = messageTextMap.get(item.id) || '';
          const delta = current.startsWith(previous)
            ? current.slice(previous.length)
            : current;
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

      if (event.type === 'item.completed') {
        const item = event.item;
        if (item?.type === 'agent_message' && item?.id) {
          const current = getItemText(item);
          const previous = messageTextMap.get(item.id) || '';
          const delta = current.startsWith(previous)
            ? current.slice(previous.length)
            : current;
          if (delta) {
            hasAnyText = true;
            sendSSE({ type: 'text', content: delta });
          }
          messageTextMap.delete(item.id);
        } else if (item?.type === 'reasoning') {
          // Reasoning items: internal model thinking, skip silently
        } else if (
          item?.type === 'error' &&
          typeof item.message === 'string' &&
          item.message
        ) {
          hasAnyText = true;
          sendSSE({ type: 'info', message: item.message });
        } else {
          emitToolFromItem(item, true);
        }
        continue;
      }

      if (event.type === 'task_complete') {
        if (
          !hasAnyText &&
          typeof event.last_agent_message === 'string' &&
          event.last_agent_message
        ) {
          hasAnyText = true;
          sendSSE({ type: 'text', content: event.last_agent_message });
        } else if (
          !hasAnyText &&
          typeof event.result === 'string' &&
          event.result
        ) {
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
