import fs from 'fs';
import { EventEmitter } from 'events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSpawn = vi.hoisted(() => vi.fn());
const mockExecSync = vi.hoisted(() => vi.fn());

vi.mock('child_process', () => ({
  spawn: mockSpawn,
  execSync: mockExecSync,
  default: {
    spawn: mockSpawn,
    execSync: mockExecSync,
  },
}));

import { __TEST_ONLY__, handleCodexRequest } from '@/core/src/server/ai-provider-codex';

function createChildProcessMock() {
  const child = new EventEmitter() as any;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = { end: vi.fn() };
  child.kill = vi.fn();
  return child;
}

describe('codex cli stream parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __TEST_ONLY__.resetCaches();
  });

  it('should parse json/plain stream events and emit structured callbacks', () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);

    const chunks: string[] = [];
    const errors: string[] = [];
    const sessions: string[] = [];
    const models: string[] = [];
    const onEnd = vi.fn();

    __TEST_ONLY__.queryViaCli(
      '/bin/codex',
      'prompt',
      process.cwd(),
      { model: 'gpt-5-codex' } as any,
      [],
      (data: string) => chunks.push(data),
      (error: string) => errors.push(error),
      onEnd,
      'sid-0',
      (id: string) => sessions.push(id),
      (model: string) => models.push(model),
      () => false,
    );

    const lines = [
      'session id: sid-2',
      'model: gpt-5-codex',
      JSON.stringify({ type: 'thread.started', thread_id: 'sid-3' }),
      JSON.stringify({ type: 'response.output_text.delta', delta: 'A' }),
      JSON.stringify({ type: 'response.output_text.done', text: 'AB' }),
      JSON.stringify({
        type: 'item.started',
        item: { id: 'cmd1', type: 'command_execution', command: 'ls' },
      }),
      JSON.stringify({
        type: 'item.updated',
        item: { id: 'm1', type: 'agent_message', text: 'hello' },
      }),
      JSON.stringify({
        type: 'item.updated',
        item: { id: 'm1', type: 'agent_message', text: 'hello world' },
      }),
      JSON.stringify({
        type: 'item.completed',
        item: { id: 'm1', type: 'agent_message', text: 'hello world!' },
      }),
      JSON.stringify({
        type: 'item.completed',
        item: {
          id: 'cmd1',
          type: 'command_execution',
          aggregated_output: 'done',
          status: 'completed',
        },
      }),
      JSON.stringify({ type: 'error', message: 'Reconnecting...' }),
      'plain line output',
    ];

    child.stdout.emit('data', Buffer.from(lines.join('\n') + '\n'));
    child.emit('close', 0);

    expect(child.stdin.end).toHaveBeenCalled();
    expect(sessions).toEqual(['sid-2', 'sid-3']);
    expect(models).toEqual(['gpt-5-codex']);
    expect(errors).toEqual([]);
    expect(onEnd).toHaveBeenCalledTimes(1);

    const joined = chunks.join('\n');
    expect(joined).toContain('"type":"text"');
    expect(joined).toContain('"type":"tool_start"');
    expect(joined).toContain('"type":"tool_input"');
    expect(joined).toContain('"type":"tool_result"');
  });

  it('should report process/turn errors and close non-zero exit', () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);

    const errors: string[] = [];
    const onEnd = vi.fn();

    __TEST_ONLY__.queryViaCli(
      '/bin/codex',
      'prompt',
      process.cwd(),
      {} as any,
      [],
      () => undefined,
      (error: string) => errors.push(error),
      onEnd,
    );

    child.stdout.emit(
      'data',
      Buffer.from(
        [
          JSON.stringify({ type: 'turn.failed', error: { message: 'turn failed' } }),
          'ERROR: plain error',
        ].join('\n') + '\n',
      ),
    );
    child.emit('error', new Error('spawn error'));
    child.emit('close', 1);

    expect(errors).toContain('turn failed');
    expect(errors).toContain('plain error');
    expect(errors).toContain('spawn error');
    expect(onEnd).toHaveBeenCalled();
  });

  it('should handle codex request in cli mode and support abort', () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);
    mockExecSync.mockReturnValue('/bin/codex\n');

    const sent: any[] = [];
    const onEnd = vi.fn();

    const req = handleCodexRequest(
      'look ' + 'data:image/png;base64,aGVsbG8=',
      { name: 'Button', file: 'src/a.ts', line: 1, column: 1 },
      [{ role: 'assistant', content: 'history' }],
      'sid-0',
      process.cwd(),
      { type: 'cli', options: { model: 'gpt-5-codex' } } as any,
      {
        sendSSE: (data: any) => sent.push(data),
        onEnd,
      },
    );

    child.stdout.emit('data', Buffer.from(JSON.stringify({ type: 'response.output_text.delta', delta: 'A' }) + '\n'));
    child.emit('close', 0);

    expect(sent.some((item) => item?.type === 'info')).toBe(true);
    expect(sent.some((item) => item?.type === 'text')).toBe(true);
    expect(sent.some((item) => item === '[DONE]')).toBe(true);
    expect(onEnd).toHaveBeenCalled();

    req.abort();
    expect(child.kill).toHaveBeenCalled();
  });

  it('should default to cli mode when codex options are undefined', () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);
    mockExecSync.mockReturnValue('/bin/codex\n');

    const sent: any[] = [];
    handleCodexRequest(
      'hello',
      null,
      [],
      undefined,
      process.cwd(),
      undefined as any,
      {
        sendSSE: (data: any) => sent.push(data),
        onEnd: () => undefined,
      },
    );

    child.emit('close', 0);
    expect(sent.some((item) => item?.type === 'info' && item.message === 'Using local Codex CLI')).toBe(
      true,
    );
  });

  it('should fallback to text-only sdk request when image input fails and cli is unavailable', async () => {
    const oldPath = process.env.PATH;
    process.env.PATH = '';
    mockExecSync.mockImplementation(() => {
      throw new Error('not found');
    });

    const sent: any[] = [];
    const onEnd = vi.fn();
    let runs = 0;
    class FakeCodexSDK {
      async startThread() {
        return {
          id: 'sid-1',
          interrupt: vi.fn(),
          runStreamed: async (input: any) => {
            runs += 1;
            if (Array.isArray(input)) {
              throw new Error('image unsupported');
            }
            return { events: (async function* () {})() };
          },
        };
      }
    }
    __TEST_ONLY__.setCodexSDKCtor(FakeCodexSDK, '@openai/codex-sdk');

    handleCodexRequest(
      'hello data:image/png;base64,aGVsbG8=',
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
    expect(runs).toBe(2);
    expect(sent.some((item) => typeof item?.message === 'string' && item.message.includes('text-only prompt'))).toBe(true);
    expect(sent.some((item) => item === '[DONE]')).toBe(true);
    expect(onEnd).toHaveBeenCalled();

    process.env.PATH = oldPath;
  });

  it('should fallback from cli mode to sdk when codex cli is unavailable', async () => {
    const oldPath = process.env.PATH;
    process.env.PATH = '';
    mockExecSync.mockImplementation(() => {
      throw new Error('not found');
    });

    const sent: any[] = [];
    const onEnd = vi.fn();
    class FakeCodexSDK {
      async startThread() {
        return {
          id: 'sid-fallback',
          interrupt: vi.fn(),
          runStreamed: async () => ({ events: (async function* () {})() }),
        };
      }
    }
    __TEST_ONLY__.setCodexSDKCtor(FakeCodexSDK, '@openai/codex-sdk');

    handleCodexRequest(
      'hello',
      null,
      [],
      undefined,
      process.cwd(),
      { type: 'cli', options: {} } as any,
      {
        sendSSE: (data: any) => sent.push(data),
        onEnd,
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(sent.some((item) => typeof item?.message === 'string' && item.message.includes('Codex CLI not found. Falling back to Codex SDK'))).toBe(true);
    expect(sent.some((item) => typeof item?.message === 'string' && item.message.includes('Using Codex SDK'))).toBe(true);
    expect(sent.some((item) => item === '[DONE]')).toBe(true);
    expect(onEnd).toHaveBeenCalled();

    process.env.PATH = oldPath;
  });

  it('should fallback from sdk image failure to cli stream', async () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);
    mockExecSync.mockReturnValue('/bin/codex\n');

    const sent: any[] = [];
    const onEnd = vi.fn();
    class FakeCodexSDK {
      async startThread() {
        return {
          id: 'sid-1',
          interrupt: vi.fn(),
          runStreamed: async (input: any) => {
            if (Array.isArray(input)) {
              throw new Error('sdk-image-failed');
            }
            return { events: (async function* () {})() };
          },
        };
      }
    }
    __TEST_ONLY__.setCodexSDKCtor(FakeCodexSDK, '@openai/codex-sdk');

    const req = handleCodexRequest(
      'hello data:image/png;base64,aGVsbG8=',
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

    await new Promise((resolve) => setTimeout(resolve, 20));
    child.stdout.emit('data', Buffer.from(JSON.stringify({ type: 'response.output_text.delta', delta: 'Z' }) + '\n'));
    child.emit('close', 0);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(sent.some((item) => typeof item?.message === 'string' && item.message.includes('Codex SDK image input failed. Falling back to local Codex CLI'))).toBe(true);
    expect(sent.some((item) => typeof item?.message === 'string' && item.message.includes('Sending via Codex CLI --image'))).toBe(true);
    expect(sent.some((item) => item?.type === 'text')).toBe(true);
    expect(sent.some((item) => item === '[DONE]')).toBe(true);
    expect(onEnd).toHaveBeenCalled();

    req.abort();
    expect(child.kill).toHaveBeenCalled();
  });

  it('should emit failed inline image processing notice in cli mode', async () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);
    mockExecSync.mockReturnValue('/bin/codex\n');
    const writeSpy = vi
      .spyOn(fs, 'writeFileSync')
      .mockImplementationOnce(() => {
        throw new Error('io-failed');
      });

    const sent: any[] = [];
    const onEnd = vi.fn();

    handleCodexRequest(
      'look data:image/png;base64,aGVsbG8=',
      null,
      [],
      undefined,
      process.cwd(),
      { type: 'cli', options: {} } as any,
      {
        sendSSE: (data: any) => sent.push(data),
        onEnd,
      },
    );

    child.emit('close', 0);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sent.some((item) => typeof item?.message === 'string' && item.message.includes('Failed to process 1 inline image(s).'))).toBe(true);
    expect(sent.some((item) => item === '[DONE]')).toBe(true);
    expect(onEnd).toHaveBeenCalled();

    writeSpy.mockRestore();
  });

  it('should cover advanced cli parser branches for model updates, edit replay and buffers', () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);

    const chunks: string[] = [];
    const errors: string[] = [];
    const sessions: string[] = [];
    const models: string[] = [];
    const onEnd = vi.fn();

    __TEST_ONLY__.queryViaCli(
      '/bin/codex',
      'prompt',
      process.cwd(),
      {} as any,
      [],
      (data: string) => chunks.push(data),
      (error: string) => errors.push(error),
      onEnd,
      undefined,
      (id: string) => sessions.push(id),
      (model: string) => models.push(model),
      () => false,
    );

    child.stdout.emit(
      'data',
      Buffer.from(
        [
          'WARNING: proceeding, even though we could not update PATH for shell',
          'model: gpt-5-codex',
          JSON.stringify({ type: 'foo', response: { model: 'gpt-5.1-codex' } }),
          JSON.stringify({
            type: 'item.started',
            item: { id: 'edit-1', type: 'file_change', changes: [{ path: 'a.ts', kind: 'edit' }] },
          }),
          JSON.stringify({
            type: 'item.completed',
            item: { id: 'edit-1', type: 'file_change', changes: [{ path: 'a.ts', kind: 'edit' }] },
          }),
          JSON.stringify({ type: 'item.updated', item: { id: 'msg-1', type: 'agent_message', text: 'hello' } }),
          JSON.stringify({ type: 'item.updated', item: { id: 'msg-1', type: 'agent_message', text: 'changed' } }),
          JSON.stringify({ type: 'item.completed', item: { id: 'msg-1', type: 'agent_message', text: 'final' } }),
          JSON.stringify({ type: 'item.updated', item: { id: 'cmd-2', type: 'command_execution', command: 'pwd' } }),
          JSON.stringify({ type: 'error', message: 'fatal error' }),
          'session id: sid-tail',
        ].join('\n'),
      ),
    );
    child.stderr.emit('data', Buffer.from('ERROR: stderr tail'));
    child.emit('close', 0);

    expect(models).toEqual(['gpt-5-codex', 'gpt-5.1-codex']);
    expect(errors).toContain('fatal error');
    expect(errors).toContain('stderr tail');
    expect(sessions).toEqual(['sid-tail']);
    expect(onEnd).toHaveBeenCalledTimes(1);

    const joined = chunks.join('\n');
    expect(joined).toContain('"type":"tool_start"');
    expect(joined).toContain('"type":"tool_input"');
    expect(joined).toContain('"type":"tool_result"');
    expect(joined).toContain('"type":"text"');
  });

  it('should cover cli parser fallback messages and unknown tool items', () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);

    const chunks: string[] = [];
    const errors: string[] = [];
    __TEST_ONLY__.queryViaCli(
      '/bin/codex',
      'prompt',
      process.cwd(),
      {} as any,
      [],
      (data: string) => chunks.push(data),
      (error: string) => errors.push(error),
      () => undefined,
    );

    child.stdout.emit(
      'data',
      Buffer.from(
        [
          JSON.stringify({ type: 'item.started', item: { type: 'unknown_item' } }),
          JSON.stringify({
            type: 'item.completed',
            item: { id: 'm-fallback', type: 'agent_message', text: 'fresh' },
          }),
          JSON.stringify({ type: 'error' }),
          JSON.stringify({ type: 'turn.failed' }),
        ].join('\n') + '\n',
      ),
    );
    child.emit('close', 0);

    expect(chunks.join('\n')).toContain('fresh');
    expect(errors).toContain('Codex CLI error');
    expect(errors).toContain('Codex turn failed');
  });

  it('should emit task_complete fallback text from cli stream', () => {
    const childA = createChildProcessMock();
    mockSpawn.mockReturnValueOnce(childA);
    const chunksA: string[] = [];

    __TEST_ONLY__.queryViaCli(
      '/bin/codex',
      'prompt',
      process.cwd(),
      {} as any,
      [],
      (data: string) => chunksA.push(data),
      () => undefined,
      () => undefined,
    );
    childA.stdout.emit(
      'data',
      Buffer.from(JSON.stringify({ type: 'task_complete', last_agent_message: 'from-last' }) + '\n'),
    );
    childA.emit('close', 0);

    const childB = createChildProcessMock();
    mockSpawn.mockReturnValueOnce(childB);
    const chunksB: string[] = [];
    __TEST_ONLY__.queryViaCli(
      '/bin/codex',
      'prompt',
      process.cwd(),
      {} as any,
      [],
      (data: string) => chunksB.push(data),
      () => undefined,
      () => undefined,
    );
    childB.stdout.emit(
      'data',
      Buffer.from(JSON.stringify({ type: 'task_complete', result: 'from-result' }) + '\n'),
    );
    childB.emit('close', 0);

    expect(chunksA.join('\n')).toContain('from-last');
    expect(chunksB.join('\n')).toContain('from-result');
  });

  it('should flush output file fallback, report non-zero exit and tolerate cleanup errors', () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);

    const chunks: string[] = [];
    const errors: string[] = [];
    __TEST_ONLY__.queryViaCli(
      '/bin/codex',
      'prompt',
      process.cwd(),
      {} as any,
      [],
      (data: string) => chunks.push(data),
      (error: string) => errors.push(error),
      () => undefined,
    );

    const args = mockSpawn.mock.calls[0]?.[1] as string[];
    const outputFileIndex = args.indexOf('-o') + 1;
    const outputFile = args[outputFileIndex];
    fs.writeFileSync(outputFile, 'output-from-file');

    const unlinkSpy = vi
      .spyOn(fs, 'unlinkSync')
      .mockImplementationOnce(() => {
        throw new Error('unlink-failed');
      });

    child.emit('close', 2);
    unlinkSpy.mockRestore();

    expect(chunks.join('\n')).toContain('output-from-file');
    expect(errors).toContain('Codex CLI exited with code 2');
  });

  it('should skip processing cli lines when already aborted', () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);
    const chunks: string[] = [];

    __TEST_ONLY__.queryViaCli(
      '/bin/codex',
      'prompt',
      process.cwd(),
      {} as any,
      [],
      (data: string) => chunks.push(data),
      () => undefined,
      () => undefined,
      undefined,
      undefined,
      undefined,
      () => true,
    );

    child.stdout.emit('data', Buffer.from('plain text that should be ignored\n'));
    child.emit('close', 0);

    expect(chunks).toEqual([]);
  });

  it('should forward cli callbacks in handleCodexRequest including parse fallback', async () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);
    mockExecSync.mockReturnValue('/bin/codex\n');

    const sent: any[] = [];
    const onEnd = vi.fn();
    const req = handleCodexRequest(
      'hello',
      null,
      [],
      undefined,
      process.cwd(),
      { type: 'cli', options: {} } as any,
      {
        sendSSE: (data: any) => sent.push(data),
        onEnd,
      },
    );

    const originalStringify = JSON.stringify;
    const stringifySpy = vi
      .spyOn(JSON, 'stringify')
      .mockImplementation(((value: any, ...rest: any[]) => {
        if (value?.type === 'text' && typeof value.content === 'string') {
          stringifySpy.mockImplementation(originalStringify as any);
          return '{bad-json';
        }
        return (originalStringify as any)(value, ...rest);
      }) as any);

    child.stdout.emit(
      'data',
      Buffer.from(['session id: sid-cli', 'model: gpt-5-codex', 'plain fallback line'].join('\n') + '\n'),
    );
    child.stdout.emit(
      'data',
      Buffer.from(JSON.stringify({ type: 'error', message: 'cli-bad' }) + '\n'),
    );
    child.emit('close', 0);
    await new Promise((resolve) => setTimeout(resolve, 10));
    stringifySpy.mockRestore();

    expect(sent.some((item) => item?.type === 'session' && item.sessionId === 'sid-cli')).toBe(true);
    expect(sent.some((item) => item?.type === 'info' && item.model === 'gpt-5-codex')).toBe(true);
    expect(sent.some((item) => item?.type === 'text' && item.content === '{bad-json')).toBe(true);
    expect(sent.some((item) => item?.error === 'cli-bad')).toBe(true);
    expect(sent.some((item) => item === '[DONE]')).toBe(true);
    expect(onEnd).toHaveBeenCalled();

    req.abort();
  });

  it('should emit final sdk error when image retries also fail without local cli', async () => {
    const oldPath = process.env.PATH;
    process.env.PATH = '';
    mockExecSync.mockImplementation(() => {
      throw new Error('not found');
    });

    const sent: any[] = [];
    const onEnd = vi.fn();
    class FakeCodexSDK {
      async startThread() {
        return {
          id: 'sid-fail',
          interrupt: vi.fn(),
          runStreamed: async (input: any) => {
            if (Array.isArray(input)) {
              throw new Error('image-first-fail');
            }
            throw new Error('text-retry-fail');
          },
        };
      }
    }
    __TEST_ONLY__.setCodexSDKCtor(FakeCodexSDK, '@openai/codex-sdk');

    handleCodexRequest(
      'hello data:image/png;base64,aGVsbG8=',
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
          typeof item?.error === 'string' &&
          item.error.includes('Failed to communicate with Codex: text-retry-fail'),
      ),
    ).toBe(true);
    expect(sent.some((item) => item === '[DONE]')).toBe(true);
    expect(onEnd).toHaveBeenCalled();

    process.env.PATH = oldPath;
  });

  it('should swallow interrupt errors on abort in sdk mode', async () => {
    const oldPath = process.env.PATH;
    process.env.PATH = '';
    mockExecSync.mockImplementation(() => {
      throw new Error('not found');
    });

    class FakeCodexSDK {
      async startThread() {
        return {
          id: 'sid-interrupt',
          interrupt: vi.fn(() => Promise.reject(new Error('interrupt-failed'))),
          runStreamed: async () => ({ events: (async function* () {})() }),
        };
      }
    }
    __TEST_ONLY__.setCodexSDKCtor(FakeCodexSDK, '@openai/codex-sdk');

    const req = handleCodexRequest(
      'hello',
      null,
      [],
      undefined,
      process.cwd(),
      { type: 'sdk', options: {} } as any,
      {
        sendSSE: () => undefined,
        onEnd: () => undefined,
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(() => req.abort()).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 10));
    process.env.PATH = oldPath;
  });

  it('should emit sdk image failure notice with session resume prompt', async () => {
    const oldPath = process.env.PATH;
    process.env.PATH = '';
    mockExecSync.mockImplementation(() => {
      throw new Error('not found');
    });

    const writeSpy = vi
      .spyOn(fs, 'writeFileSync')
      .mockImplementationOnce(() => {
        throw new Error('image-write-failed');
      });
    class FakeCodexSDK {
      async startThread() {
        return {
          id: 'sid-ok',
          interrupt: vi.fn(),
          runStreamed: async () => ({ events: (async function* () {})() }),
        };
      }
      async resumeThread() {
        return {
          id: 'sid-ok',
          interrupt: vi.fn(),
          runStreamed: async () => ({ events: (async function* () {})() }),
        };
      }
    }
    __TEST_ONLY__.setCodexSDKCtor(FakeCodexSDK, '@openai/codex-sdk');

    const sent: any[] = [];
    const onEnd = vi.fn();
    handleCodexRequest(
      'hello data:image/png;base64,aGVsbG8=',
      null,
      [],
      'sid-existing',
      process.cwd(),
      { type: 'sdk', options: {} } as any,
      {
        sendSSE: (data: any) => sent.push(data),
        onEnd,
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    writeSpy.mockRestore();

    expect(
      sent.some(
        (item) =>
          typeof item?.message === 'string' &&
          item.message.includes('Failed to process 1 inline image(s).'),
      ),
    ).toBe(true);
    expect(sent.some((item) => item === '[DONE]')).toBe(true);
    expect(onEnd).toHaveBeenCalled();

    process.env.PATH = oldPath;
  });

  it('should cover sdk-to-cli fallback callbacks including parse fallback and stderr lines', async () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);
    mockExecSync.mockReturnValue('/bin/codex\n');

    const writeSpy = vi
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => {
        throw new Error('inline-image-fail');
      });
    class FakeCodexSDK {
      async startThread() {
        return {
          id: 'sid-fallback',
          interrupt: vi.fn(),
          runStreamed: async () => {
            throw new Error('sdk-image-failed');
          },
        };
      }
    }
    __TEST_ONLY__.setCodexSDKCtor(FakeCodexSDK, '@openai/codex-sdk');

    const sent: any[] = [];
    const onEnd = vi.fn();
    handleCodexRequest(
      'hello data:image/png;base64,aGVsbG8=',
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
    await new Promise((resolve) => setTimeout(resolve, 20));

    const originalStringify = JSON.stringify;
    const stringifySpy = vi
      .spyOn(JSON, 'stringify')
      .mockImplementation(((value: any, ...rest: any[]) => {
        if (value?.type === 'text' && typeof value.content === 'string') {
          stringifySpy.mockImplementation(originalStringify as any);
          return '{bad-json';
        }
        return (originalStringify as any)(value, ...rest);
      }) as any);

    child.stdout.emit(
      'data',
      Buffer.from(
        'session id: sid-fallback\nmodel: gpt-5.1-codex\nplain line\nERROR: fallback-child-error\n',
      ),
    );
    child.stderr.emit('data', Buffer.from('stderr plain line\n'));
    child.emit('close', 0);
    await new Promise((resolve) => setTimeout(resolve, 20));

    stringifySpy.mockRestore();
    writeSpy.mockRestore();

    expect(sent.some((item) => item?.type === 'session' && item.sessionId === 'sid-fallback')).toBe(
      true,
    );
    expect(sent.some((item) => item?.type === 'info' && item.model === 'gpt-5.1-codex')).toBe(true);
    expect(sent.some((item) => item?.type === 'text' && item.content === '{bad-json')).toBe(true);
    expect(sent.some((item) => item?.error === 'fallback-child-error')).toBe(true);
    expect(sent.some((item) => item === '[DONE]')).toBe(true);
    expect(onEnd).toHaveBeenCalled();
  });
});
