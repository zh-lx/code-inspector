/**
 * AI 功能模块 - 处理与 AI Agent 的交互
 * 通过 provider 模式支持不同的 AI 后端
 */
import http from 'http';
import type { AIOptions, CodexOptions } from '../shared';
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
  history: AIMessage[];
  sessionId?: string;
}

export type AIProviderType = 'claudeCode' | 'codex';

export type ActiveAIOptions =
  | {
    provider: 'claudeCode';
    options: AIOptions;
  }
  | {
    provider: 'codex';
    options: CodexOptions;
  };

// ============================================================================
// 公共 API
// ============================================================================

/**
 * 从 behavior 配置中提取 AI 选项
 */
export function getAIOptions(
  behavior?: { ai?: { claudeCode?: boolean | AIOptions; codex?: boolean | CodexOptions } }
): ActiveAIOptions | undefined {
  if (behavior?.ai?.codex) {
    return {
      provider: 'codex',
      options: typeof behavior.ai.codex === 'boolean' ? {} : behavior.ai.codex,
    };
  }

  if (behavior?.ai?.claudeCode) {
    return {
      provider: 'claudeCode',
      options: typeof behavior.ai.claudeCode === 'boolean' ? {} : behavior.ai.claudeCode,
    };
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
  aiOptions: ActiveAIOptions | undefined,
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

  const { message, context, history, sessionId } = aiRequest;

  // 设置 SSE 响应头
  res.writeHead(200, {
    ...corsHeaders,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const sendSSE = createSSESender(res);
  const cwd = projectRootPath || process.cwd();

  if (!aiOptions) {
    sendSSE({ error: 'AI provider is not configured. Please set behavior.ai.claudeCode or behavior.ai.codex.' });
    sendSSE('[DONE]');
    res.end();
    return;
  }

  let provider: ProviderResult;
  if (aiOptions.provider === 'codex') {
    provider = handleCodexRequest(
      message,
      context,
      history,
      sessionId,
      cwd,
      aiOptions.options,
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
      aiOptions.options,
      {
        sendSSE,
        onEnd: () => res.end(),
      },
    );
  }

  // 处理客户端断开连接
  req.on('close', () => {
    provider.abort();
  });
}

/**
 * 处理 AI 模型信息请求
 */
export async function handleAIModelRequest(
  res: http.ServerResponse,
  corsHeaders: Record<string, string>,
  aiOptions: ActiveAIOptions | undefined,
): Promise<void> {
  const model = aiOptions?.provider === 'codex'
    ? await getCodexModelInfo(aiOptions.options)
    : await getClaudeModelInfo(aiOptions?.options);
  res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ model }));
}
