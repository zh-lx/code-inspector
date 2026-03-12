import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockHandleCodexRequest = vi.hoisted(() => vi.fn());
const mockHandleOpenCodeRequest = vi.hoisted(() => vi.fn());
const mockHandleClaudeRequest = vi.hoisted(() => vi.fn());
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

import { handleAIModelRequest, handleAIRequest, getAIOptions } from '@/core/src/server/ai';

function createMockReq(rawBody: string) {
  const listeners: Record<string, Function[]> = {};
  return {
    on: vi.fn((event: string, cb: Function) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    }),
    emit: (event: string) => {
      for (const cb of listeners[event] || []) cb();
    },
    [Symbol.asyncIterator]: async function* () {
      yield rawBody;
    },
  } as any;
}

function createMockRes() {
  const chunks: string[] = [];
  const listeners: Record<string, Function[]> = {};
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
    on: vi.fn((event: string, cb: Function) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    }),
    emit: (event: string) => {
      for (const cb of listeners[event] || []) cb();
    },
  } as any;
  return { res, chunks };
}

describe('ai module branch coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleCodexRequest.mockReturnValue({ abort: vi.fn() });
    mockHandleOpenCodeRequest.mockReturnValue({ abort: vi.fn() });
    mockHandleClaudeRequest.mockReturnValue({ abort: vi.fn() });
  });

  it('should return 400 for invalid JSON body', async () => {
    const req = createMockReq('{bad-json');
    const { res } = createMockRes();

    await handleAIRequest(req, res, { a: 'b' }, undefined, '/project');

    expect(res.writeHead).toHaveBeenCalledWith(400, { a: 'b' });
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Invalid JSON' }));
  });

  it('should send error and done when AI provider is not configured', async () => {
    const req = createMockReq(JSON.stringify({ message: 'hello', context: null }));
    const { res, chunks } = createMockRes();

    await handleAIRequest(req, res, {}, undefined, '/project');

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'text/event-stream',
    }));
    expect(chunks.join('')).toContain('AI provider is not configured');
    expect(chunks.join('')).toContain('[DONE]');
    expect(res.end).toHaveBeenCalled();
  });

  it('should fallback to configured provider when requested provider is invalid', async () => {
    const req = createMockReq(JSON.stringify({
      message: 'hello',
      context: null,
      provider: 'invalid-provider',
    }));
    const { res } = createMockRes();
    const aiOptions = getAIOptions({ ai: { codex: true, claudeCode: true } });

    await handleAIRequest(req, res, {}, aiOptions, '/project');

    expect(mockHandleCodexRequest).toHaveBeenCalledTimes(1);
    expect(mockHandleClaudeRequest).not.toHaveBeenCalled();
  });

  it('should route request to claude provider when requested', async () => {
    const req = createMockReq(JSON.stringify({
      message: 'hello',
      context: null,
      provider: 'claudeCode',
    }));
    const { res } = createMockRes();
    const aiOptions = getAIOptions({ ai: { codex: true, claudeCode: true } });

    await handleAIRequest(req, res, {}, aiOptions, '/project');

    expect(mockHandleClaudeRequest).toHaveBeenCalledTimes(1);
    expect(mockHandleCodexRequest).toHaveBeenCalledTimes(0);
    expect(mockHandleOpenCodeRequest).toHaveBeenCalledTimes(0);
  });

  it('should route request to opencode provider when requested', async () => {
    const req = createMockReq(JSON.stringify({
      message: 'hello',
      context: null,
      provider: 'opencode',
    }));
    const { res } = createMockRes();
    const aiOptions = getAIOptions({ ai: { opencode: true, codex: true } });

    await handleAIRequest(req, res, {}, aiOptions, '/project');

    expect(mockHandleOpenCodeRequest).toHaveBeenCalledTimes(1);
    expect(mockHandleCodexRequest).toHaveBeenCalledTimes(0);
    expect(mockHandleClaudeRequest).toHaveBeenCalledTimes(0);
  });

  it('should normalize history/cwd and execute codex onEnd callback', async () => {
    const req = createMockReq(JSON.stringify({
      message: 'hello',
      context: null,
      history: 'invalid-history',
      provider: 'codex',
      model: 'gpt-5.1-codex',
    }));
    const { res } = createMockRes();
    const aiOptions = getAIOptions({ ai: { codex: {} as any } });

    await handleAIRequest(req, res, {}, aiOptions, '');

    expect(mockHandleCodexRequest).toHaveBeenCalledTimes(1);
    const codexArgs = mockHandleCodexRequest.mock.calls[0];
    expect(codexArgs[2]).toEqual([]);
    expect(codexArgs[4]).toBe(process.cwd());
    expect(codexArgs[5]?.options?.model).toBe('gpt-5.1-codex');
    codexArgs[6].onEnd();
    expect(res.end).toHaveBeenCalled();
  });

  it('should pass history array through when provided', async () => {
    const req = createMockReq(JSON.stringify({
      message: 'hello',
      context: null,
      history: [{ role: 'assistant', content: 'previous' }],
      provider: 'codex',
    }));
    const { res } = createMockRes();
    const aiOptions = getAIOptions({ ai: { codex: true } });

    await handleAIRequest(req, res, {}, aiOptions, '/project');

    expect(mockHandleCodexRequest).toHaveBeenCalledTimes(1);
    const codexArgs = mockHandleCodexRequest.mock.calls[0];
    expect(codexArgs[2]).toEqual([{ role: 'assistant', content: 'previous' }]);
  });

  it('should execute claude onEnd callback passed by ai module', async () => {
    const req = createMockReq(JSON.stringify({
      message: 'hello',
      context: null,
      provider: 'claudeCode',
    }));
    const { res } = createMockRes();
    const aiOptions = getAIOptions({ ai: { claudeCode: true } });

    await handleAIRequest(req, res, {}, aiOptions, '/project');
    expect(mockHandleClaudeRequest).toHaveBeenCalledTimes(1);
    const claudeArgs = mockHandleClaudeRequest.mock.calls[0];
    claudeArgs[6].onEnd();
    expect(res.end).toHaveBeenCalled();
  });

  it('should abort provider when request is aborted', async () => {
    const abort = vi.fn();
    mockHandleCodexRequest.mockReturnValueOnce({ abort });

    const req = createMockReq(JSON.stringify({ message: 'hello', context: null, provider: 'codex' }));
    const { res } = createMockRes();
    const aiOptions = getAIOptions({ ai: { codex: true } });

    await handleAIRequest(req, res, {}, aiOptions, '/project');
    req.emit('aborted');

    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('should abort provider on response close before writable end', async () => {
    const abort = vi.fn();
    mockHandleCodexRequest.mockReturnValueOnce({ abort });

    const req = createMockReq(JSON.stringify({ message: 'hello', context: null, provider: 'codex' }));
    const { res } = createMockRes();
    const aiOptions = getAIOptions({ ai: { codex: true } });

    await handleAIRequest(req, res, {}, aiOptions, '/project');
    res.emit('close');

    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('should not abort on response close after writable end', async () => {
    const abort = vi.fn();
    mockHandleCodexRequest.mockReturnValueOnce({ abort });

    const req = createMockReq(JSON.stringify({ message: 'hello', context: null, provider: 'codex' }));
    const { res } = createMockRes();
    const aiOptions = getAIOptions({ ai: { codex: true } });

    await handleAIRequest(req, res, {}, aiOptions, '/project');
    res.writableEnded = true;
    res.emit('close');

    expect(abort).not.toHaveBeenCalled();
  });

  it('should return empty model payload when no provider configured for model route', async () => {
    const { res } = createMockRes();

    await handleAIModelRequest(res, { x: 'y' }, undefined, 'codex');

    expect(res.writeHead).toHaveBeenCalledWith(200, {
      x: 'y',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual({
      model: '',
      models: [],
      provider: null,
      providers: [],
    });
  });

  it('should return opencode model info', async () => {
    mockGetOpenCodeModelInfo.mockResolvedValueOnce('open-code-model');
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
    const { res } = createMockRes();

    await handleAIModelRequest(res, {}, aiOptions, 'opencode');

    const payload = JSON.parse(res.end.mock.calls[0][0]);
    expect(payload.provider).toBe('opencode');
    expect(payload.model).toBe('open-code-model');
    expect(payload.models).toEqual(['open-code-model', 'open-code-model-next']);
    expect(payload.providers).toEqual(['opencode']);
  });

  it('should return claude model info with deduped configured models', async () => {
    mockGetClaudeModelInfo.mockResolvedValueOnce('claude-sonnet-4-5');
    const aiOptions = getAIOptions({
      ai: {
        claudeCode: {
          options: {
            model: 'claude-sonnet-4-5',
            models: ['  ', 'claude-sonnet-4-5', 'claude-opus-4-1'],
          },
        },
      },
    });
    const { res } = createMockRes();

    await handleAIModelRequest(res, {}, aiOptions, 'claudeCode');

    const payload = JSON.parse(res.end.mock.calls[0][0]);
    expect(payload.provider).toBe('claudeCode');
    expect(payload.model).toBe('claude-sonnet-4-5');
    expect(payload.models).toEqual(['claude-sonnet-4-5', 'claude-opus-4-1']);
    expect(payload.providers).toEqual(['claudeCode']);
  });

  it('should fallback model to configured list when detected model is empty', async () => {
    mockGetCodexModelInfo.mockResolvedValueOnce('   ');
    const aiOptions = getAIOptions({
      ai: {
        codex: {
          options: {
            models: ['  ', 'gpt-5-codex'],
            model: 'gpt-5.1-codex',
          },
        } as any,
      },
    });
    const { res } = createMockRes();

    await handleAIModelRequest(res, {}, aiOptions, 'codex');

    const payload = JSON.parse(res.end.mock.calls[0][0]);
    expect(payload.model).toBe('gpt-5-codex');
    expect(payload.models).toEqual(['gpt-5-codex', 'gpt-5.1-codex']);
    expect(payload.provider).toBe('codex');
  });

  it('should return empty model list when detected/configured models are absent', async () => {
    mockGetCodexModelInfo.mockResolvedValueOnce('');
    const aiOptions = getAIOptions({ ai: { codex: {} as any } });
    const { res } = createMockRes();

    await handleAIModelRequest(res, {}, aiOptions, 'codex');

    const payload = JSON.parse(res.end.mock.calls[0][0]);
    expect(payload.model).toBe('');
    expect(payload.models).toEqual([]);
    expect(payload.provider).toBe('codex');
  });
});
