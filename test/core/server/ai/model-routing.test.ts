import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockHandleCodexRequest = vi.hoisted(() => vi.fn(() => ({ abort: vi.fn() })));
const mockHandleOpenCodeRequest = vi.hoisted(() => vi.fn(() => ({ abort: vi.fn() })));
const mockHandleClaudeRequest = vi.hoisted(() => vi.fn(() => ({ abort: vi.fn() })));
const mockGetCodexModelInfo = vi.hoisted(() => vi.fn(async () => ''));
const mockGetOpenCodeModelInfo = vi.hoisted(() => vi.fn(async () => ''));
const mockGetClaudeModelInfo = vi.hoisted(() => vi.fn(async () => ''));

vi.mock('@/core/src/server/ai-provider-codex', () => ({
  handleCodexRequest: mockHandleCodexRequest,
  getModelInfo: mockGetCodexModelInfo,
}));

vi.mock('@/core/src/server/ai-provider-opencode', () => ({
  handleOpenCodeRequest: mockHandleOpenCodeRequest,
  getModelInfo: mockGetOpenCodeModelInfo,
}));

vi.mock('@/core/src/server/ai-provider-claude', () => ({
  handleClaudeRequest: mockHandleClaudeRequest,
  getModelInfo: mockGetClaudeModelInfo,
}));

import {
  getAIOptions,
  handleAIModelRequest,
  handleAIRequest,
} from '@/core/src/server/ai';

function createMockReq(body: Record<string, unknown>) {
  const payload = JSON.stringify(body);
  return {
    on: vi.fn(),
    [Symbol.asyncIterator]: async function* () {
      yield payload;
    },
  } as any;
}

function createMockRes() {
  const chunks: string[] = [];
  const res = {
    writableEnded: false,
    writeHead: vi.fn(),
    write: vi.fn((chunk: string) => {
      chunks.push(chunk);
    }),
    end: vi.fn((chunk?: string) => {
      if (chunk) chunks.push(chunk);
      res.writableEnded = true;
    }),
    on: vi.fn(),
  } as any;
  return { res, chunks };
}

function parseJsonFromEndCall(res: any) {
  const endArg = res.end.mock.calls[0]?.[0];
  return JSON.parse(endArg);
}

describe('AI model routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should override request model when it is in configured models', async () => {
    const aiOptions = getAIOptions({
      ai: {
        codex: {
          options: {
            model: 'gpt-5-codex',
            models: ['gpt-5-codex', 'gpt-5.1-codex'],
          },
        },
      },
    });

    const req = createMockReq({
      message: 'hello',
      context: null,
      provider: 'codex',
      model: 'gpt-5.1-codex',
    });
    const { res } = createMockRes();
    await handleAIRequest(req, res, {}, aiOptions, process.cwd());

    expect(mockHandleCodexRequest).toHaveBeenCalledTimes(1);
    const options = mockHandleCodexRequest.mock.calls[0][5];
    expect(options.options.model).toBe('gpt-5.1-codex');
  });

  it('should ignore request model when it is not in configured models', async () => {
    const aiOptions = getAIOptions({
      ai: {
        codex: {
          options: {
            model: 'gpt-5-codex',
            models: ['gpt-5-codex', 'gpt-5.1-codex'],
          },
        },
      },
    });

    const req = createMockReq({
      message: 'hello',
      context: null,
      provider: 'codex',
      model: 'gpt-x',
    });
    const { res } = createMockRes();
    await handleAIRequest(req, res, {}, aiOptions, process.cwd());

    expect(mockHandleCodexRequest).toHaveBeenCalledTimes(1);
    const options = mockHandleCodexRequest.mock.calls[0][5];
    expect(options.options.model).toBe('gpt-5-codex');
  });

  it('should return models from config and detected model in /ai/model response', async () => {
    mockGetCodexModelInfo.mockResolvedValueOnce('gpt-5.2-codex');
    const aiOptions = getAIOptions({
      ai: {
        codex: {
          options: {
            model: 'gpt-5-codex',
            models: ['gpt-5-codex', 'gpt-5.1-codex'],
          },
        },
      },
    });

    const { res } = createMockRes();
    await handleAIModelRequest(res, {}, aiOptions, 'codex');

    const payload = parseJsonFromEndCall(res);
    expect(payload.provider).toBe('codex');
    expect(payload.model).toBe('gpt-5.2-codex');
    expect(payload.models).toEqual([
      'gpt-5-codex',
      'gpt-5.1-codex',
      'gpt-5.2-codex',
    ]);
  });

  it('should route opencode provider and override selected model', async () => {
    const aiOptions = getAIOptions({
      ai: {
        opencode: {
          options: {
            model: 'open-code-model',
            models: ['open-code-model', 'open-code-model-next'],
          },
        },
      },
    });

    const req = createMockReq({
      message: 'hello',
      context: null,
      provider: 'opencode',
      model: 'open-code-model-next',
    });
    const { res } = createMockRes();
    await handleAIRequest(req, res, {}, aiOptions, process.cwd());

    expect(mockHandleOpenCodeRequest).toHaveBeenCalledTimes(1);
    const options = mockHandleOpenCodeRequest.mock.calls[0][5];
    expect(options.options.model).toBe('open-code-model-next');
  });
});
