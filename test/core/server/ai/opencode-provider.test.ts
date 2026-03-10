import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockHandleCodexRequest = vi.hoisted(() => vi.fn(() => ({ abort: vi.fn() })));
const mockGetCodexModelInfo = vi.hoisted(() => vi.fn(async () => ''));

vi.mock('@/core/src/server/ai-provider-common', () => ({
  handleCodexRequest: mockHandleCodexRequest,
  getModelInfo: mockGetCodexModelInfo,
}));

import {
  getModelInfo,
  handleOpenCodeRequest,
} from '@/core/src/server/ai-provider-opencode';

describe('opencode provider wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should inject big-pickle as the default model in cli mode', () => {
    handleOpenCodeRequest(
      'hello',
      null,
      [],
      undefined,
      process.cwd(),
      undefined as any,
      { sendSSE: vi.fn(), onEnd: vi.fn() },
    );

    expect(mockHandleCodexRequest).toHaveBeenCalledTimes(1);
    const passedOptions = mockHandleCodexRequest.mock.calls[0][5];
    expect(passedOptions?.options?.model).toBe('opencode/big-pickle');
  });

  it('should keep configured model when provided in cli mode', () => {
    handleOpenCodeRequest(
      'hello',
      null,
      [],
      undefined,
      process.cwd(),
      { options: { model: 'openai/gpt-4.1' } } as any,
      { sendSSE: vi.fn(), onEnd: vi.fn() },
    );

    const passedOptions = mockHandleCodexRequest.mock.calls[0][5];
    expect(passedOptions?.options?.model).toBe('openai/gpt-4.1');
  });

  it('should fallback model info to big-pickle', async () => {
    mockGetCodexModelInfo.mockResolvedValueOnce('');
    await expect(getModelInfo(undefined as any)).resolves.toBe(
      'opencode/big-pickle',
    );
  });

  it('should stream events via the opencode sdk path', async () => {
    const OriginalFunction = globalThis.Function;
    const sent: any[] = [];
    const onEnd = vi.fn();
    const close = vi.fn();
    const sessionAbort = vi.fn(async () => ({}));
    try {
      (globalThis as any).Function = vi.fn(() => {
        return async () => ({
          createOpencode: vi.fn(async () => ({
            client: {
              global: {
                event: vi.fn(async () => ({
                  stream: (async function* () {
                    yield {
                      directory: process.cwd(),
                      payload: {
                        type: 'message.updated',
                        properties: {
                          info: {
                            id: 'assistant-1',
                            role: 'assistant',
                            sessionID: 'sid-sdk',
                            providerID: 'opencode',
                            modelID: 'big-pickle',
                          },
                        },
                      },
                    };
                    yield {
                      directory: process.cwd(),
                      payload: {
                        type: 'message.part.updated',
                        properties: {
                          part: {
                            id: 'part-text',
                            type: 'text',
                            sessionID: 'sid-sdk',
                            messageID: 'assistant-1',
                            text: 'hello from sdk',
                          },
                          delta: 'hello from sdk',
                        },
                      },
                    };
                    yield {
                      directory: process.cwd(),
                      payload: {
                        type: 'message.part.updated',
                        properties: {
                          part: {
                            id: 'tool-1',
                            type: 'tool',
                            sessionID: 'sid-sdk',
                            messageID: 'assistant-1',
                            tool: 'Bash',
                            state: {
                              status: 'completed',
                              input: { command: 'pwd' },
                              output: '/tmp/project',
                            },
                          },
                        },
                      },
                    };
                    yield {
                      directory: process.cwd(),
                      payload: {
                        type: 'session.idle',
                        properties: {
                          sessionID: 'sid-sdk',
                        },
                      },
                    };
                  })(),
                })),
              },
              session: {
                create: vi.fn(async () => ({ data: { id: 'sid-sdk' } })),
                promptAsync: vi.fn(async () => ({ data: {} })),
                abort: sessionAbort,
              },
            },
            server: { close },
          })),
        });
      });

      handleOpenCodeRequest(
        'hello',
        null,
        [],
        undefined,
        process.cwd(),
        { type: 'sdk', options: {} } as any,
        {
          sendSSE: (data: any) => sent.push(data),
          onEnd,
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(
        sent.some(
          (item) =>
            item?.type === 'info' &&
            item.message === 'Using OpenCode SDK package: @opencode-ai/sdk',
        ),
      ).toBe(true);
      expect(
        sent.some(
          (item) => item?.type === 'session' && item.sessionId === 'sid-sdk',
        ),
      ).toBe(true);
      expect(
        sent.some(
          (item) => item?.type === 'info' && item.model === 'opencode/big-pickle',
        ),
      ).toBe(true);
      expect(
        sent.some(
          (item) => item?.type === 'text' && item.content === 'hello from sdk',
        ),
      ).toBe(true);
      expect(
        sent.some(
          (item) => item?.type === 'tool_start' && item.toolId === 'tool-1',
        ),
      ).toBe(true);
      expect(
        sent.some(
          (item) =>
            item?.type === 'tool_result' && item.content === '/tmp/project',
        ),
      ).toBe(true);
      expect(sent.some((item) => item === '[DONE]')).toBe(true);
      expect(onEnd).toHaveBeenCalled();
      expect(close).toHaveBeenCalled();
    } finally {
      (globalThis as any).Function = OriginalFunction;
    }
  });
});
