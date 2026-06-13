/**
 * AI 功能模块 - 处理与 AI Agent 的交互
 * 通过 provider 模式支持不同的 AI 后端
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import type { ClaudeCodeOptions, CodexOptions, OpenCodeOptions } from '../shared';
import { handleClaudeRequest, getModelInfo as getClaudeModelInfo } from './ai-provider-claude';
import { handleCodexRequest, getModelInfo as getCodexModelInfo } from './ai-provider-codex';
import { handleOpenCodeRequest, getModelInfo as getOpenCodeModelInfo } from './ai-provider-opencode';
import type { ProviderResult } from './ai-provider-claude';
import { isTerminalAvailable } from './ai-terminal';
import {
  abortRuntimeSession,
  completeRuntimeSession,
  createRuntimeSession,
  emitRuntimeEvent,
  getRuntimeSessionSnapshot,
  markRuntimeSessionRunning,
  setRuntimeSessionHooks,
  subscribeRuntimeSession,
  unsubscribeRuntimeSession,
  updateRuntimeSessionMetadata,
} from './runtime-session';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * AI 上下文信息
 */
export interface AIContext {
  file: string;
  line: number;
  column: number;
  name: string;
}

/**
 * AI 消息
 */
export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * AI 请求体
 */
export interface AIRequest {
  message: string;
  context: AIContext | null;
  history?: AIMessage[];
  sessionId?: string;
  provider?: AIProviderType;
  model?: string;
}

interface RuntimeAbortRequest {
  runtimeSessionId?: string;
}

export type AIProviderType = 'claudeCode' | 'codex' | 'opencode';

type AIProviderOptionsMap = {
  claudeCode: ClaudeCodeOptions;
  codex: CodexOptions;
  opencode: OpenCodeOptions;
};

export type ResolvedAIOptions = Partial<AIProviderOptionsMap>;

export type ActiveAIOptions<T extends AIProviderType = AIProviderType> = {
  provider: T;
  options: AIProviderOptionsMap[T];
};

const PROVIDER_PRIORITY: AIProviderType[] = ['codex', 'opencode', 'claudeCode'];

// ============================================================================
// 公共 API
// ============================================================================

/**
 * 从 behavior 配置中提取 AI 选项
 */
export function getAIOptions(
  behavior?: {
    ai?: {
      claudeCode?: boolean | ClaudeCodeOptions;
      codex?: boolean | CodexOptions;
      opencode?: boolean | OpenCodeOptions;
    };
  }
): ResolvedAIOptions | undefined {
  const resolved: ResolvedAIOptions = {};

  if (behavior?.ai?.codex) {
    resolved.codex = typeof behavior.ai.codex === 'boolean' ? {} : behavior.ai.codex;
  }

  if (behavior?.ai?.claudeCode) {
    resolved.claudeCode = typeof behavior.ai.claudeCode === 'boolean' ? {} : behavior.ai.claudeCode;
  }

  if (behavior?.ai?.opencode) {
    resolved.opencode = typeof behavior.ai.opencode === 'boolean' ? {} : behavior.ai.opencode;
  }

  return Object.keys(resolved).length > 0 ? resolved : undefined;
}

/**
 * 从 behavior 配置中提取 expireDays
 */
export function getExpireDays(
  behavior?: { ai?: { expireDays?: number } }
): number {
  return behavior?.ai?.expireDays ?? 0;
}

function normalizeAIProviderType(provider?: string | null): AIProviderType | undefined {
  if (provider === 'codex' || provider === 'claudeCode' || provider === 'opencode') {
    return provider;
  }
  return undefined;
}

function normalizeModelName(model?: string | null): string | undefined {
  if (typeof model !== 'string') {
    return undefined;
  }
  const trimmed = model.trim();
  return trimmed ? trimmed : undefined;
}

function dedupeModels(models: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const item of models) {
    const normalized = normalizeModelName(item);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    deduped.push(normalized);
  }
  return deduped;
}

function getConfiguredModels(aiOption: ActiveAIOptions): string[] {
  const options = (aiOption.options as { options?: { model?: string; models?: string[] } })?.options || {};
  return dedupeModels([
    ...(Array.isArray(options.models) ? options.models : []),
    ...(options.model ? [options.model] : []),
  ]);
}

function resolveProviderType(
  type?: string,
): 'cli' | 'sdk' | 'terminal' {
  if (type === 'sdk') {
    return 'sdk';
  }
  if (type === 'terminal') {
    return isTerminalAvailable() ? 'terminal' : 'cli';
  }
  return 'cli';
}

function resolveRequestedModel(aiOption: ActiveAIOptions, requestedModel?: string): string | undefined {
  const normalizedRequestedModel = normalizeModelName(requestedModel);
  if (!normalizedRequestedModel) {
    return undefined;
  }
  const configuredModels = getConfiguredModels(aiOption);
  if (configuredModels.length === 0 || configuredModels.includes(normalizedRequestedModel)) {
    return normalizedRequestedModel;
  }
  return undefined;
}

function withModelOverride<T extends AIProviderType>(
  aiOption: ActiveAIOptions<T>,
  model?: string
): ActiveAIOptions<T> {
  const normalizedModel = normalizeModelName(model);
  if (!normalizedModel) {
    return aiOption;
  }

  const nextOptions = {
    ...(aiOption.options as Record<string, unknown>),
    options: {
      ...(((aiOption.options as { options?: Record<string, unknown> })?.options) || {}),
      model: normalizedModel,
    },
  } as AIProviderOptionsMap[T];

  return {
    provider: aiOption.provider,
    options: nextOptions,
  };
}

export function getAvailableAIProviders(aiOptions?: ResolvedAIOptions): AIProviderType[] {
  if (!aiOptions) return [];
  return PROVIDER_PRIORITY.filter((provider) => Boolean(aiOptions[provider]));
}

export function resolveAIOptions(
  aiOptions: ResolvedAIOptions | undefined,
  requestedProvider?: AIProviderType
): ActiveAIOptions | undefined {
  if (!aiOptions) {
    return undefined;
  }

  if (requestedProvider && aiOptions[requestedProvider]) {
    return {
      provider: requestedProvider,
      options: aiOptions[requestedProvider] as AIProviderOptionsMap[AIProviderType],
    };
  }

  for (const provider of PROVIDER_PRIORITY) {
    const options = aiOptions[provider];
    if (options) {
      return {
        provider,
        options: options as AIProviderOptionsMap[AIProviderType],
      };
    }
  }

  return undefined;
}

function writeSSEEvent(res: http.ServerResponse, data: object | string): void {
  const message = typeof data === 'string' ? data : JSON.stringify(data);
  res.write(`data: ${message}\n\n`);
}

function isFinalRuntimeStateEvent(event: Record<string, unknown>): boolean {
  return (
    event.type === 'runtime_state' &&
    (event.status === 'completed' ||
      event.status === 'aborted' ||
      event.status === 'failed')
  );
}

/**
 * 处理 AI 请求
 */
export async function handleAIRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  corsHeaders: Record<string, string>,
  aiOptions: ResolvedAIOptions | undefined,
  projectRootPath: string
): Promise<void> {
  // 读取请求体
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  // 解析请求
  let aiRequest: AIRequest;
  try {
    aiRequest = JSON.parse(body);
  } catch {
    res.writeHead(400, corsHeaders);
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const { message, context, sessionId } = aiRequest;
  const requestedProvider = normalizeAIProviderType(aiRequest.provider);
  const requestedModel = normalizeModelName(aiRequest.model);
  const history = Array.isArray(aiRequest.history) ? aiRequest.history : [];

  // 设置 SSE 响应头
  res.writeHead(200, {
    ...corsHeaders,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const cwd = projectRootPath || process.cwd();

  const activeAIOptions = resolveAIOptions(aiOptions, requestedProvider);
  if (!activeAIOptions) {
    writeSSEEvent(res, {
      error:
        'AI provider is not configured. Please set behavior.ai.claudeCode, behavior.ai.codex, or behavior.ai.opencode.',
    });
    writeSSEEvent(res, '[DONE]');
    res.end();
    return;
  }

  const selectedModel = resolveRequestedModel(activeAIOptions, requestedModel);
  const effectiveAIOptions = withModelOverride(activeAIOptions, selectedModel);
  const runtimeSession = createRuntimeSession('agent-turn', {
    metadata: {
      provider: effectiveAIOptions.provider,
      providerSessionId: sessionId || null,
      model: selectedModel || '',
    },
  });
  const subscriberId = `http-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let responseClosed = false;

  const sendRuntimeEventToResponse = (event: Record<string, unknown>) => {
    if (responseClosed || res.writableEnded) return;
    try {
      writeSSEEvent(res, event);
      if (isFinalRuntimeStateEvent(event)) {
        res.end();
      }
    } catch {
      responseClosed = true;
    }
  };

  subscribeRuntimeSession(runtimeSession.id, subscriberId, 0, sendRuntimeEventToResponse);
  markRuntimeSessionRunning(runtimeSession.id);
  emitRuntimeEvent(runtimeSession.id, {
    type: 'runtime_session',
    runtimeSessionId: runtimeSession.id,
    runtimeKind: 'agent-turn',
  });

  const sendSSE = (data: object | string) => {
    if (typeof data === 'string') {
      if (data === '[DONE]') return;
      emitRuntimeEvent(runtimeSession.id, { type: 'text', content: data });
      return;
    }

    emitRuntimeEvent(runtimeSession.id, data as Record<string, unknown>);
    if (
      typeof (data as { sessionId?: unknown }).sessionId === 'string' ||
      typeof (data as { type?: unknown; sessionId?: unknown }).sessionId ===
        'string'
    ) {
      updateRuntimeSessionMetadata(runtimeSession.id, {
        providerSessionId: (data as { sessionId?: string }).sessionId || null,
      });
    }
  };

  let provider: ProviderResult;
  if (effectiveAIOptions.provider === 'codex') {
    provider = handleCodexRequest(
      message,
      context,
      history,
      sessionId,
      cwd,
      effectiveAIOptions.options as CodexOptions,
      {
        sendSSE,
        onEnd: () => {
          completeRuntimeSession(runtimeSession.id, 'completed');
        },
      },
    );
  } else if (effectiveAIOptions.provider === 'opencode') {
    provider = handleOpenCodeRequest(
      message,
      context,
      history,
      sessionId,
      cwd,
      effectiveAIOptions.options as OpenCodeOptions,
      {
        sendSSE,
        onEnd: () => {
          completeRuntimeSession(runtimeSession.id, 'completed');
        },
      },
    );
  } else {
    provider = handleClaudeRequest(
      message,
      context,
      history,
      sessionId,
      cwd,
      effectiveAIOptions.options as ClaudeCodeOptions,
      {
        sendSSE,
        onEnd: () => {
          completeRuntimeSession(runtimeSession.id, 'completed');
        },
      },
    );
  }

  setRuntimeSessionHooks(runtimeSession.id, {
    abort: () => {
      provider.abort();
    },
  });

  req.on('aborted', () => {
    responseClosed = true;
    unsubscribeRuntimeSession(runtimeSession.id, subscriberId);
  });
  res.on('close', () => {
    responseClosed = true;
    unsubscribeRuntimeSession(runtimeSession.id, subscriberId);
  });
}

export async function handleAIRuntimeStreamRequest(
  res: http.ServerResponse,
  corsHeaders: Record<string, string>,
  runtimeSessionId?: string | null,
  cursor?: string | null,
): Promise<void> {
  if (!runtimeSessionId) {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'missing_runtime_session_id' }));
    return;
  }

  const snapshot = getRuntimeSessionSnapshot(runtimeSessionId);
  if (!snapshot) {
    res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'runtime_session_not_found' }));
    return;
  }

  const parsedCursor = Number(cursor || '0');
  const normalizedCursor =
    Number.isFinite(parsedCursor) && parsedCursor > 0 ? parsedCursor : 0;

  res.writeHead(200, {
    ...corsHeaders,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const subscriberId = `http-reattach-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let responseClosed = false;

  const attached = subscribeRuntimeSession(
    runtimeSessionId,
    subscriberId,
    normalizedCursor,
    (event) => {
      if (responseClosed || res.writableEnded) return;
      writeSSEEvent(res, event);
      if (isFinalRuntimeStateEvent(event)) {
        res.end();
      }
    },
  );

  if (!attached) {
    res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'runtime_session_not_found' }));
    return;
  }

  if (attached.isFinal) {
    res.end();
    return;
  }

  res.on('close', () => {
    responseClosed = true;
    unsubscribeRuntimeSession(runtimeSessionId, subscriberId);
  });
}

export async function handleAIRuntimeAbortRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  corsHeaders: Record<string, string>,
): Promise<void> {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  let parsed: RuntimeAbortRequest;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const runtimeSessionId =
    typeof parsed.runtimeSessionId === 'string'
      ? parsed.runtimeSessionId
      : '';
  if (!runtimeSessionId) {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'missing_runtime_session_id' }));
    return;
  }

  const success = abortRuntimeSession(runtimeSessionId);
  res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success }));
}

/**
 * 处理 AI 模型信息请求
 */
export async function handleAIModelRequest(
  res: http.ServerResponse,
  corsHeaders: Record<string, string>,
  aiOptions: ResolvedAIOptions | undefined,
  requestedProvider?: string | null,
): Promise<void> {
  const normalizedProvider = normalizeAIProviderType(requestedProvider);
  const activeAIOptions = resolveAIOptions(aiOptions, normalizedProvider);
  const availableProviders = getAvailableAIProviders(aiOptions);
  if (!activeAIOptions) {
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      model: '',
      models: [],
      provider: null,
      providers: availableProviders,
    }));
    return;
  }

  const configuredModels = getConfiguredModels(activeAIOptions);
  const detectedModel =
    activeAIOptions.provider === 'codex'
      ? await getCodexModelInfo(activeAIOptions.options as CodexOptions)
      : activeAIOptions.provider === 'opencode'
        ? await getOpenCodeModelInfo(activeAIOptions.options as OpenCodeOptions)
        : await getClaudeModelInfo(activeAIOptions.options as ClaudeCodeOptions | undefined);
  const model = normalizeModelName(detectedModel) || configuredModels[0] || '';
  const models = dedupeModels([
    ...configuredModels,
    ...(model ? [model] : []),
  ]);
  const providerType = resolveProviderType(
    (activeAIOptions.options as any)?.type,
  );
  res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    model,
    models,
    provider: activeAIOptions.provider,
    providers: availableProviders,
    providerType,
  }));
}

/**
 * 处理 AI 编辑回退请求
 */
export async function handleAIRevertRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  corsHeaders: Record<string, string>,
  projectRootPath: string,
): Promise<void> {
  const projectRootAbs = projectRootPath ? path.resolve(projectRootPath) : '';
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const edits = Array.isArray(parsed?.edits) ? parsed.edits : [];
  if (edits.length === 0) {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No edits provided' }));
    return;
  }

  const results: Array<{ file_path: string; success: boolean; error?: string }> = [];

  for (const edit of edits) {
    const filePath = typeof edit?.file_path === 'string' ? edit.file_path : '';
    const oldString = typeof edit?.old_string === 'string' ? edit.old_string : '';
    const newString = typeof edit?.new_string === 'string' ? edit.new_string : '';

    if (!filePath) {
      results.push({ file_path: filePath, success: false, error: 'missing_file_path' });
      continue;
    }

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : projectRootAbs
        ? path.resolve(projectRootAbs, filePath)
        : path.resolve(filePath);

    if (projectRootAbs) {
      const resolvedAbsolutePath = path.resolve(absolutePath);
      const relativePath = path.relative(projectRootAbs, resolvedAbsolutePath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        results.push({
          file_path: filePath,
          success: false,
          error: 'outside_project',
        });
        continue;
      }
    }

    if (!fs.existsSync(absolutePath)) {
      results.push({ file_path: filePath, success: false, error: 'file_not_found' });
      continue;
    }

    try {
      const currentContent = fs.readFileSync(absolutePath, 'utf-8');
      let revertedContent: string;

      if (currentContent === newString) {
        revertedContent = oldString;
      } else if (newString && currentContent.includes(newString)) {
        revertedContent = currentContent.replace(newString, oldString);
      } else {
        results.push({ file_path: filePath, success: false, error: 'content_mismatch' });
        continue;
      }

      fs.writeFileSync(absolutePath, revertedContent, 'utf-8');
      results.push({ file_path: filePath, success: true });
    } catch {
      results.push({ file_path: filePath, success: false, error: 'write_error' });
    }
  }

  res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ results }));
}
