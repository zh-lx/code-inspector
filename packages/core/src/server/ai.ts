/**
 * AI 功能模块 - 处理与 AI Agent 的交互
 * 通过 provider 模式支持不同的 AI 后端
 */
import http from 'http';
import type { ClaudeCodeOptions, CodexOptions } from '../shared';
import { handleClaudeRequest, getModelInfo as getClaudeModelInfo } from './ai-provider-claude';
import { handleCodexRequest, getModelInfo as getCodexModelInfo } from './ai-provider-codex';
import type { ProviderResult } from './ai-provider-claude';

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
}

export type AIProviderType = 'claudeCode' | 'codex';

type AIProviderOptionsMap = {
  claudeCode: ClaudeCodeOptions;
  codex: CodexOptions;
};

export type ResolvedAIOptions = Partial<AIProviderOptionsMap>;

export type ActiveAIOptions<T extends AIProviderType = AIProviderType> = {
  provider: T;
  options: AIProviderOptionsMap[T];
};

const PROVIDER_PRIORITY: AIProviderType[] = ['codex', 'claudeCode'];

// ============================================================================
// 公共 API
// ============================================================================

/**
 * 从 behavior 配置中提取 AI 选项
 */
export function getAIOptions(
  behavior?: { ai?: { claudeCode?: boolean | ClaudeCodeOptions; codex?: boolean | CodexOptions } }
): ResolvedAIOptions | undefined {
  const resolved: ResolvedAIOptions = {};

  if (behavior?.ai?.codex) {
    resolved.codex = typeof behavior.ai.codex === 'boolean' ? {} : behavior.ai.codex;
  }

  if (behavior?.ai?.claudeCode) {
    resolved.claudeCode = typeof behavior.ai.claudeCode === 'boolean' ? {} : behavior.ai.claudeCode;
  }

  return Object.keys(resolved).length > 0 ? resolved : undefined;
}

function normalizeAIProviderType(provider?: string | null): AIProviderType | undefined {
  if (provider === 'codex' || provider === 'claudeCode') {
    return provider;
  }
  return undefined;
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

/**
 * 发送 SSE 消息
 */
function createSSESender(res: http.ServerResponse): (data: object | string) => void {
  return (data: object | string) => {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    res.write(`data: ${message}\n\n`);
  };
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
  const history = Array.isArray(aiRequest.history) ? aiRequest.history : [];

  // 设置 SSE 响应头
  res.writeHead(200, {
    ...corsHeaders,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const sendSSE = createSSESender(res);
  const cwd = projectRootPath || process.cwd();

  const activeAIOptions = resolveAIOptions(aiOptions, requestedProvider);
  if (!activeAIOptions) {
    sendSSE({ error: 'AI provider is not configured. Please set behavior.ai.claudeCode or behavior.ai.codex.' });
    sendSSE('[DONE]');
    res.end();
    return;
  }

  let provider: ProviderResult;
  if (activeAIOptions.provider === 'codex') {
    provider = handleCodexRequest(
      message,
      context,
      history,
      sessionId,
      cwd,
      activeAIOptions.options as CodexOptions,
      {
        sendSSE,
        onEnd: () => res.end(),
      },
    );
  } else {
    provider = handleClaudeRequest(
      message,
      context,
      history,
      sessionId,
      cwd,
      activeAIOptions.options as ClaudeCodeOptions,
      {
        sendSSE,
        onEnd: () => res.end(),
      },
    );
  }

  // 仅在客户端真正中断时取消任务，避免请求体读取完成后误触发中断
  const abortProvider = () => {
    provider.abort();
  };
  req.on('aborted', abortProvider);
  res.on('close', () => {
    if (!res.writableEnded) {
      abortProvider();
    }
  });
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
  const model = activeAIOptions?.provider === 'codex'
    ? await getCodexModelInfo(activeAIOptions.options as CodexOptions)
    : await getClaudeModelInfo(activeAIOptions?.options as ClaudeCodeOptions | undefined);
  res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    model,
    provider: activeAIOptions?.provider || null,
    providers: availableProviders,
  }));
}
