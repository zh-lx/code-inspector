/**
 * AI 功能模块 - 处理与 AI Agent 的交互
 * 通过 provider 模式支持不同的 AI 后端
 */
import http from 'http';
import type { AIOptions } from '../shared';
import { handleClaudeRequest, getModelInfo } from './ai-provider-claude';
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
  context: AIContext;
  history: AIMessage[];
  sessionId?: string;
}

// ============================================================================
// 公共 API
// ============================================================================

/**
 * 从 behavior 配置中提取 AI 选项
 */
export function getAIOptions(behavior?: { claudeCode?: boolean | AIOptions }): AIOptions | undefined {
  if (!behavior?.claudeCode) return undefined;
  if (typeof behavior.claudeCode === 'boolean') return {};
  return behavior.claudeCode;
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
  aiOptions: AIOptions | undefined,
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

  // 调用 provider
  // 目前仅支持 Claude，后续可根据 aiOptions 的配置分发到不同 provider
  const provider: ProviderResult = handleClaudeRequest(
    message,
    context,
    history,
    sessionId,
    cwd,
    aiOptions,
    {
      sendSSE,
      onEnd: () => res.end(),
    },
  );

  // 处理客户端断开连接
  req.on('close', () => {
    provider.abort();
  });
}

/**
 * 处理 AI 模型信息请求
 */
export function handleAIModelRequest(
  res: http.ServerResponse,
  corsHeaders: Record<string, string>,
  aiOptions: AIOptions | undefined,
): void {
  const model = getModelInfo(aiOptions);
  res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ model }));
}
