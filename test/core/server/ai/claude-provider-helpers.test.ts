import fs from 'fs';
import os from 'os';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __TEST_ONLY__, getModelInfo, handleClaudeRequest } from '@/core/src/server/ai-provider-claude';

const PNG_DATA_URL = 'data:image/png;base64,aGVsbG8=';

describe('claude provider helpers', () => {
  beforeEach(() => {
    __TEST_ONLY__.resetCaches();
  });

  it('should build prompt, images and option helpers', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-prompt-'));
    const rel = 'src/a.ts';
    fs.mkdirSync(path.join(cwd, 'src'), { recursive: true });
    fs.writeFileSync(path.join(cwd, rel), 'export const a = 1;');

    const stripped = __TEST_ONLY__.stripInlineImageDataUrls(`x ${PNG_DATA_URL} y`);
    expect(stripped).not.toContain('data:image/png;base64');
    expect(stripped).toContain('[Inline image data omitted]');

    const extracted = __TEST_ONLY__.extractInlineImages(`x ${PNG_DATA_URL} y`);
    expect(extracted.images).toHaveLength(1);
    expect(extracted.text).toContain('[Inline image 1 attached separately');

    const cliInput = __TEST_ONLY__.buildClaudeCliInputMessage('prompt', extracted.images, 'sid-1');
    expect(cliInput.session_id).toBe('sid-1');
    expect(cliInput.message.content[0]).toEqual({ type: 'text', text: 'prompt' });
    const cliInputNoSession = __TEST_ONLY__.buildClaudeCliInputMessage(
      'prompt',
      extracted.images,
      undefined,
    );
    expect(cliInputNoSession.session_id).toBe('');

    const prompt = __TEST_ONLY__.buildPrompt(
      'hello',
      { name: 'Button', file: rel, line: 2, column: 1 },
      [{ role: 'user', content: 'q1' }, { role: 'assistant', content: 'a1' }],
      cwd,
    );
    expect(prompt).toContain(`[Context] I'm looking at a <Button> component located at @${rel}#2.`);
    expect(prompt).toContain('[Previous conversation]');

    expect(__TEST_ONLY__.buildResumeTurnPrompt('next', null, cwd)).toContain('Global mode');

    expect(__TEST_ONLY__.getClaudeAgentOptions({ options: { model: 'claude-sonnet-4-5' } } as any)).toEqual({
      model: 'claude-sonnet-4-5',
    });
    expect(__TEST_ONLY__.getClaudeCliOptions(undefined as any)).toEqual({});
    expect(__TEST_ONLY__.getClaudeCliOptions({ type: 'sdk', options: { model: 'x' } } as any)).toEqual({});
    expect(__TEST_ONLY__.getClaudeSdkOptions({ type: 'cli', options: { model: 'x' } } as any)).toEqual({});
    expect(__TEST_ONLY__.getClaudeSdkOptions({ type: 'sdk' } as any)).toEqual({});
    expect(__TEST_ONLY__.getClaudeSdkOptions({ type: 'sdk', options: { model: 'x' } } as any)).toEqual({
      model: 'x',
    });
  });

  it('should resolve model info from explicit options first', async () => {
    const explicit = await getModelInfo({ options: { model: 'claude-opus-4-1' } } as any);
    expect(explicit).toBe('claude-opus-4-1');
  });

  it('should setup sdk env and build query options', () => {
    const old = process.env.CLAUDE_API_KEY;
    delete process.env.CLAUDE_API_KEY;

    __TEST_ONLY__.setupSdkEnvironment({
      type: 'sdk',
      options: { env: { CLAUDE_API_KEY: 'k' } },
    } as any);
    expect(process.env.CLAUDE_API_KEY).toBe('k');

    const queryOptions = __TEST_ONLY__.buildSdkQueryOptions(
      {
        type: 'sdk',
        options: {
          model: 'claude-sonnet-4-5',
          permissionMode: 'bypassPermissions',
          extraArgs: {},
          env: { A: '1' },
        },
      } as any,
      '/tmp/project',
      'session-1',
    );
    expect(queryOptions.cwd).toBe('/tmp/project');
    expect(queryOptions.model).toBe('claude-sonnet-4-5');
    expect(queryOptions.resume).toBe('session-1');
    expect(queryOptions.allowDangerouslySkipPermissions).toBe(true);
    expect(queryOptions.extraArgs['enable-auth-status']).toBeNull();

    if (old === undefined) {
      delete process.env.CLAUDE_API_KEY;
    } else {
      process.env.CLAUDE_API_KEY = old;
    }
  });

  it('should stream sdk events and map to sse payloads', async () => {
    const sent: any[] = [];
    const conversation = {
      interrupt: vi.fn(),
      async *[Symbol.asyncIterator]() {
        yield {
          type: 'stream_event',
          session_id: 'sid-1',
          event: { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', id: 't1', name: 'Read' } },
        };
        yield {
          type: 'stream_event',
          event: { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"file":"a.ts"}' } },
        };
        yield {
          type: 'stream_event',
          event: { type: 'content_block_stop', index: 1 },
        };
        yield {
          type: 'stream_event',
          event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'hello' } },
        };
        yield {
          type: 'assistant',
          message: {
            content: [
              { type: 'text', text: 'answer' },
              { type: 'tool_use', id: 't2', name: 'Bash', input: { command: 'pwd' } },
              { type: 'tool_result', tool_use_id: 't2', content: 'ok', is_error: false },
            ],
          },
          uuid: 'u1',
        };
        yield {
          type: 'user',
          message: {
            content: [{ type: 'tool_result', tool_use_id: 't3', content: { ok: true }, is_error: true }],
          },
        };
        yield {
          type: 'system',
          subtype: 'init',
          model: 'claude-sonnet-4-5',
          apiKeySource: 'env',
        };
        yield {
          type: 'auth_status',
          output: ['signed in'],
          error: 'bad auth',
        };
        yield {
          type: 'result',
          subtype: 'error',
          errors: ['failed'],
        };
        yield {
          type: 'result',
          subtype: 'success',
          result: 'final',
        };
      },
    };

    __TEST_ONLY__.setClaudeQuery(({ prompt, options }: any) => {
      expect(prompt).toBe('hello');
      expect(options.cwd).toBe('/tmp/project');
      return conversation as any;
    });

    const result = await __TEST_ONLY__.queryViaSdk(
      'hello',
      '/tmp/project',
      { type: 'sdk', options: { model: 'claude-sonnet-4-5' } } as any,
      'sid-1',
      (data: any) => sent.push(data),
      () => false,
    );

    expect(result.timedOut).toBe(false);
    expect(sent.some((item) => item?.type === 'session' && item.sessionId === 'sid-1')).toBe(true);
    expect(sent.some((item) => item?.type === 'tool_start')).toBe(true);
    expect(sent.some((item) => item?.type === 'tool_input')).toBe(true);
    expect(sent.some((item) => item?.type === 'tool_result')).toBe(true);
    expect(sent.some((item) => item?.type === 'text')).toBe(true);
    expect(sent.some((item) => item?.error)).toBe(true);
  });

  it('should not duplicate tool_start when same tool appears in stream_event and assistant message', async () => {
    const sent: any[] = [];
    const conversation = {
      interrupt: vi.fn(),
      async *[Symbol.asyncIterator]() {
        // Tool t1 streamed via stream_event
        yield {
          type: 'stream_event',
          event: { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 't1', name: 'Read' } },
        };
        yield {
          type: 'stream_event',
          event: { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"file_path":"a.ts"}' } },
        };
        yield {
          type: 'stream_event',
          event: { type: 'content_block_stop', index: 0 },
        };
        // Assistant snapshot also contains the same tool t1
        yield {
          type: 'assistant',
          message: {
            content: [
              { type: 'tool_use', id: 't1', name: 'Read', input: { file_path: 'a.ts' } },
            ],
          },
          uuid: 'u1',
        };
        yield { type: 'result', subtype: 'success', result: '' };
      },
    };

    __TEST_ONLY__.setClaudeQuery(() => conversation as any);

    await __TEST_ONLY__.queryViaSdk(
      'hello',
      '/tmp/project',
      { type: 'sdk', options: {} } as any,
      undefined,
      (data: any) => sent.push(data),
      () => false,
    );

    const toolStarts = sent.filter((item) => item?.type === 'tool_start' && item.toolId === 't1');
    expect(toolStarts).toHaveLength(1);
  });

  it('should not duplicate text when same content appears in stream_event and assistant message', async () => {
    const sent: any[] = [];
    const conversation = {
      interrupt: vi.fn(),
      async *[Symbol.asyncIterator]() {
        // Text streamed via stream_event
        yield {
          type: 'stream_event',
          event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'hello ' } },
        };
        yield {
          type: 'stream_event',
          event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'world' } },
        };
        // Assistant snapshot contains the same accumulated text
        yield {
          type: 'assistant',
          message: { content: [{ type: 'text', text: 'hello world' }] },
          uuid: 'msg-1',
        };
        yield { type: 'result', subtype: 'success', result: '' };
      },
    };

    __TEST_ONLY__.setClaudeQuery(() => conversation as any);

    await __TEST_ONLY__.queryViaSdk(
      'hello',
      '/tmp/project',
      { type: 'sdk', options: {} } as any,
      undefined,
      (data: any) => sent.push(data),
      () => false,
    );

    const textPayloads = sent
      .filter((item) => item?.type === 'text')
      .map((item) => item.content);
    // Should only have the streamed deltas, not a duplicate from the assistant snapshot
    expect(textPayloads).toEqual(['hello ', 'world']);
  });

  it('should handle sdk not installed and provider sdk flow end-to-end', async () => {
    __TEST_ONLY__.setClaudeQuery(null);
    const sent: any[] = [];
    const noSdk = await __TEST_ONLY__.queryViaSdk(
      'hello',
      process.cwd(),
      { type: 'sdk', options: {} } as any,
      undefined,
      (data: any) => sent.push(data),
      () => false,
    );
    expect(noSdk.timedOut).toBe(false);
    expect(sent.some((item) => item?.type === 'text')).toBe(true);

    __TEST_ONLY__.setClaudeQuery(() => ({
      interrupt: vi.fn(),
      async *[Symbol.asyncIterator]() {
        yield { type: 'result', subtype: 'success', result: 'ok' };
      },
    }));

    const payloads: any[] = [];
    const onEnd = vi.fn();
    const req = handleClaudeRequest(
      'hello',
      null,
      [],
      undefined,
      process.cwd(),
      { type: 'sdk', options: { model: 'claude-sonnet-4-5' } } as any,
      {
        sendSSE: (data: any) => payloads.push(data),
        onEnd,
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(typeof req.abort).toBe('function');
    expect(payloads.some((item) => item === '[DONE]')).toBe(true);
    expect(onEnd).toHaveBeenCalled();
  });

  it('should emit stderr info and generic sdk result error when errors array is missing', async () => {
    const sent: any[] = [];
    __TEST_ONLY__.setClaudeQuery(({ options }: any) => {
      options.stderr('sdk warning');
      options.stderr(undefined);
      return {
        interrupt: vi.fn(),
        async *[Symbol.asyncIterator]() {
          yield { type: 'result', subtype: 'failed' };
        },
      };
    });

    const state = await __TEST_ONLY__.queryViaSdk(
      'hello',
      process.cwd(),
      { type: 'sdk', options: {} } as any,
      undefined,
      (data: any) => sent.push(data),
      () => false,
    );

    expect(state.timedOut).toBe(false);
    expect(sent.some((item) => item?.type === 'info' && item.message === 'sdk warning')).toBe(true);
    expect(sent.some((item) => item?.error === 'Claude SDK request failed: failed')).toBe(true);
  });

  it('should cover sdk timeout, abort and non-prefix assistant delta branches', async () => {
    vi.useFakeTimers();
    try {
      const sent: any[] = [];
      let resumeStream: (() => void) | undefined;
      let interrupted = false;
      const conversation = {
        interrupt: vi.fn(() => {
          interrupted = true;
          resumeStream?.();
        }),
        async *[Symbol.asyncIterator]() {
          await new Promise<void>((resolve) => {
            resumeStream = resolve;
          });
          if (!interrupted) {
            yield { type: 'result', subtype: 'success', result: 'unexpected' };
          }
        },
      };

      __TEST_ONLY__.setClaudeQuery(() => conversation as any);
      const promise = __TEST_ONLY__.queryViaSdk(
        'hello',
        process.cwd(),
        { type: 'sdk', options: {} } as any,
        undefined,
        (data: any) => sent.push(data),
        () => false,
      );

      await vi.advanceTimersByTimeAsync(100100);
      const state = await promise;
      expect(state.timedOut).toBe(true);
      expect(conversation.interrupt).toHaveBeenCalled();
      expect(
        sent.some(
          (item) =>
            typeof item?.error === 'string' &&
            item.error.includes('Claude SDK timeout: no response after 100s'),
        ),
      ).toBe(true);

      const sent2: any[] = [];
      __TEST_ONLY__.setClaudeQuery(() => ({
        interrupt: vi.fn(),
        async *[Symbol.asyncIterator]() {
          yield {
            type: 'stream_event',
            event: { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 't1', name: 'Read' } },
            session_id: 'sid-1',
          };
          yield {
            type: 'stream_event',
            event: { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{bad' } },
          };
          yield {
            type: 'stream_event',
            event: { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta' } },
          };
          yield {
            type: 'stream_event',
            event: { type: 'content_block_stop', index: 0 },
          };
          yield {
            type: 'assistant',
            uuid: 'u1',
            message: {
              content: [
                { type: 'text', text: 'hello' },
                { type: 'tool_result', tool_use_id: 't1', content: { ok: true }, is_error: false },
              ],
            },
          };
          yield {
            type: 'assistant',
            message: {
              content: [{ type: 'text', text: 'no-uuid-text' }],
            },
          };
          yield {
            type: 'assistant',
            uuid: 'u1',
            message: {
              content: [{ type: 'text', text: 'changed' }],
            },
          };
          yield {
            type: 'user',
            message: {
              content: [
                { type: 'tool_result', tool_use_id: 't2', content: { value: 1 }, is_error: true },
                { type: 'tool_result', tool_use_id: 't3', content: 'plain-result', is_error: false },
              ],
            },
          };
          yield {
            type: 'result',
            subtype: 'success',
            result: 'done',
          };
        },
      }));

      const state2 = await __TEST_ONLY__.queryViaSdk(
        'hello',
        process.cwd(),
        { type: 'sdk', options: {} } as any,
        undefined,
        (data: any) => sent2.push(data),
        () => false,
      );
      expect(state2.timedOut).toBe(false);
      expect(
        sent2.some(
          (item) =>
            item?.type === 'tool_result' &&
            typeof item.content === 'string' &&
            item.content.includes('"ok":true'),
        ),
      ).toBe(true);
      expect(
        sent2.some(
          (item) =>
            item?.type === 'tool_result' &&
            typeof item.content === 'string' &&
            item.content.includes('"value":1'),
        ),
      ).toBe(true);
      expect(sent2.some((item) => item?.type === 'text' && item.content === 'changed')).toBe(true);

      const sent3: any[] = [];
      let interruptedByAbort = false;
      __TEST_ONLY__.setClaudeQuery(() => ({
        interrupt: vi.fn(() => {
          interruptedByAbort = true;
        }),
        async *[Symbol.asyncIterator]() {
          yield { type: 'system', session_id: 'sid-abort' };
          yield { type: 'result', subtype: 'success', result: 'ignored' };
        },
      }));
      const state3 = await __TEST_ONLY__.queryViaSdk(
        'hello',
        process.cwd(),
        { type: 'sdk', options: {} } as any,
        undefined,
        (data: any) => sent3.push(data),
        () => true,
      );
      expect(state3.timedOut).toBe(false);
      expect(interruptedByAbort).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should discover claude cli from fallback HOME paths', () => {
    __TEST_ONLY__.resetCaches();
    const oldPath = process.env.PATH;
    const oldHome = process.env.HOME;
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-home-'));
    const fallbackPath = path.join(fakeHome, '.npm-global', 'bin', 'claude');
    fs.mkdirSync(path.dirname(fallbackPath), { recursive: true });
    fs.writeFileSync(fallbackPath, '#!/bin/sh\necho claude');
    process.env.PATH = '';
    process.env.HOME = fakeHome;

    const found = __TEST_ONLY__.findClaudeCodeCli();
    expect(found).toBe(fallbackPath);

    process.env.PATH = oldPath;
    process.env.HOME = oldHome;
  });

  it('should cover claude cli probing branches on win32 and empty HOME', () => {
    __TEST_ONLY__.resetCaches();
    const oldPath = process.env.PATH;
    const oldHome = process.env.HOME;
    const oldPlatform = process.platform;
    process.env.PATH = '';
    delete process.env.HOME;

    try {
      Object.defineProperty(process, 'platform', {
        configurable: true,
        value: 'win32',
      });
      const found = __TEST_ONLY__.findClaudeCodeCli();
      expect(found).toBeNull();
    } finally {
      Object.defineProperty(process, 'platform', {
        configurable: true,
        value: oldPlatform,
      });
      process.env.PATH = oldPath;
      process.env.HOME = oldHome;
    }
  });

  it('should cover sdk environment/bootstrap branches and dynamic getClaudeQuery load', async () => {
    const originalEnv = process.env as any;
    (process as any).env = undefined;
    __TEST_ONLY__.setupSdkEnvironment({ type: 'cli', options: { env: { A: '1' } } } as any);
    expect((process as any).env).toBeTruthy();
    (process as any).env = originalEnv;

    const cliOptions = __TEST_ONLY__.buildSdkQueryOptions(
      { type: 'cli', options: { model: 'claude-sonnet-4-5' } } as any,
      process.cwd(),
      undefined,
    );
    expect(cliOptions.model).toBe('claude-sonnet-4-5');

    __TEST_ONLY__.resetCaches();
    const OriginalFunction = globalThis.Function;
    try {
      (globalThis as any).Function = vi.fn(() => {
        return async () => ({
          query: () => ({ interrupt: vi.fn(), async *[Symbol.asyncIterator]() {} }),
        });
      });
      const loaded = await __TEST_ONLY__.getClaudeQuery();
      expect(typeof loaded).toBe('function');

      __TEST_ONLY__.setClaudeQuery(null);
      (globalThis as any).Function = vi.fn(() => {
        return async () => ({
          default: {
            query: () => ({ interrupt: vi.fn(), async *[Symbol.asyncIterator]() {} }),
          },
        });
      });
      const loadedDefault = await __TEST_ONLY__.getClaudeQuery();
      expect(typeof loadedDefault).toBe('function');
    } finally {
      (globalThis as any).Function = OriginalFunction;
    }
  });
});
