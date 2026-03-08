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

import {
  __TEST_ONLY__,
  getModelInfo,
  handleClaudeRequest,
} from '@/core/src/server/ai-provider-claude';

function createChildProcessMock() {
  const child = new EventEmitter() as any;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = { write: vi.fn(), end: vi.fn() };
  child.kill = vi.fn();
  return child;
}

describe('claude cli stream parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __TEST_ONLY__.resetCaches();
  });

  it('should parse stream-json events and emit normalized payloads', () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);

    const chunks: string[] = [];
    const errors: string[] = [];
    const sessions: string[] = [];
    const onEnd = vi.fn();

    const inputMessage = __TEST_ONLY__.buildClaudeCliInputMessage(
      'hello',
      [{ mediaType: 'image/png', data: 'aGVsbG8=' }],
      'sid-0',
    );

    __TEST_ONLY__.queryViaCli(
      '/bin/claude',
      'prompt',
      inputMessage,
      process.cwd(),
      {
        options: {
          model: 'claude-sonnet-4-5',
          allowedTools: ['Read', 'Write'],
          disallowedTools: ['Bash'],
          maxTurns: 3,
          maxCost: 1.2,
          systemPrompt: { type: 'preset', append: 'be concise' },
          mcpServers: { fs: { command: 'npx', args: ['-y'] } },
        },
      } as any,
      (data: string) => chunks.push(data),
      (error: string) => errors.push(error),
      onEnd,
      'sid-0',
      (id: string) => sessions.push(id),
    );

    expect(child.stdin.write).toHaveBeenCalled();
    expect(child.stdin.end).toHaveBeenCalled();
    expect(mockSpawn).toHaveBeenCalledWith(
      '/bin/claude',
      expect.arrayContaining([
        '-p',
        '--output-format',
        'stream-json',
        '--input-format',
        'stream-json',
        '--verbose',
        '--permission-mode',
        'bypassPermissions',
        '--resume',
        'sid-0',
        '--model',
        'claude-sonnet-4-5',
      ]),
      expect.any(Object),
    );

    const lines = [
      JSON.stringify({ type: 'system', session_id: 'sid-1', model: 'claude-sonnet-4-5' }),
      JSON.stringify({
        type: 'content_block_start',
        index: 1,
        content_block: { type: 'tool_use', id: 't1', name: 'Read' },
      }),
      JSON.stringify({
        type: 'content_block_delta',
        index: 1,
        delta: { type: 'input_json_delta', partial_json: '{"file":"a.ts"}' },
      }),
      JSON.stringify({
        type: 'content_block_delta',
        delta: { type: 'text_delta', text: 'hello' },
      }),
      JSON.stringify({ type: 'content_block_stop', index: 1 }),
      JSON.stringify({
        type: 'assistant',
        message: {
          content: [
            { type: 'text', text: 'fallback-text' },
            { type: 'tool_use', id: 't2', name: 'Bash', input: { command: 'pwd' } },
          ],
        },
      }),
      JSON.stringify({
        type: 'user',
        message: {
          content: [{ type: 'tool_result', tool_use_id: 't2', content: { ok: true }, is_error: false }],
        },
      }),
      JSON.stringify({ type: 'result', session_id: 'sid-2', result: 'final result' }),
      'plain-output-line',
    ];

    child.stdout.emit('data', Buffer.from(lines.join('\n') + '\n'));
    child.stderr.emit('data', Buffer.from('stderr line'));
    child.emit('close', 0);

    expect(sessions).toEqual(['sid-1', 'sid-2']);
    expect(errors).toEqual([]);
    expect(onEnd).toHaveBeenCalledTimes(1);

    const joined = chunks.join('\n');
    expect(joined).toContain('"type":"info"');
    expect(joined).toContain('"type":"tool_start"');
    expect(joined).toContain('"type":"tool_input"');
    expect(joined).toContain('"type":"tool_result"');
    expect(joined).toContain('"type":"text"');
  });

  it('should propagate process errors and non-zero close code', () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);

    const errors: string[] = [];
    const onEnd = vi.fn();

    __TEST_ONLY__.queryViaCli(
      '/bin/claude',
      'prompt',
      undefined,
      process.cwd(),
      { options: {} } as any,
      () => undefined,
      (error: string) => errors.push(error),
      onEnd,
    );

    child.emit('error', new Error('spawn fail'));
    child.emit('close', 1);

    expect(errors).toContain('spawn fail');
    expect(errors).toContain('CLI exited with code 1');
    expect(onEnd).toHaveBeenCalled();
  });

  it('should detect model via cli system event and cache it', async () => {
    const child = createChildProcessMock();
    mockExecSync.mockReturnValue('/bin/claude\n');
    mockSpawn.mockReturnValue(child);

    const promise = getModelInfo(undefined as any);
    child.stdout.emit('data', Buffer.from(JSON.stringify({ type: 'system', model: 'claude-sonnet-4-5' }) + '\n'));
    child.emit('close', 0);

    await expect(promise).resolves.toBe('claude-sonnet-4-5');
    await expect(getModelInfo(undefined as any)).resolves.toBe('claude-sonnet-4-5');
    expect(mockSpawn).toHaveBeenCalledTimes(1);
  });

  it('should ignore blank probe lines before system model event', async () => {
    const child = createChildProcessMock();
    mockExecSync.mockReturnValue('/bin/claude\n');
    mockSpawn.mockReturnValue(child);

    const promise = getModelInfo(undefined as any);
    child.stdout.emit(
      'data',
      Buffer.from('\n\n' + JSON.stringify({ type: 'system', model: 'claude-sonnet-4-5' }) + '\n'),
    );
    child.emit('close', 0);

    await expect(promise).resolves.toBe('claude-sonnet-4-5');
  });

  it('should return empty model when claude cli is unavailable', async () => {
    const oldPath = process.env.PATH;
    process.env.PATH = '';
    mockExecSync.mockImplementation(() => {
      throw new Error('missing');
    });

    await expect(getModelInfo(undefined as any)).resolves.toBe('');
    await expect(getModelInfo(undefined as any)).resolves.toBe('');

    process.env.PATH = oldPath;
  });

  it('should timeout while probing model and return empty string', async () => {
    const child = createChildProcessMock();
    mockExecSync.mockReturnValue('/bin/claude\n');
    mockSpawn.mockReturnValue(child);

    vi.useFakeTimers();
    try {
      const probe = getModelInfo(undefined as any);
      vi.advanceTimersByTime(10050);
      await expect(probe).resolves.toBe('');
      expect(child.kill).toHaveBeenCalledWith('SIGTERM');
    } finally {
      vi.useRealTimers();
    }
  });

  it('should ignore invalid system json line and fallback to empty model', async () => {
    const child = createChildProcessMock();
    mockExecSync.mockReturnValue('/bin/claude\n');
    mockSpawn.mockReturnValue(child);

    const probe = getModelInfo(undefined as any);
    child.stdout.emit('data', Buffer.from('{bad-json}\n'));
    child.emit('close', 0);
    await expect(probe).resolves.toBe('');
  });

  it('should return empty model when spawn throws during probe', async () => {
    mockExecSync.mockReturnValue('/bin/claude\n');
    mockSpawn.mockImplementation(() => {
      throw new Error('spawn crash');
    });

    await expect(getModelInfo(undefined as any)).resolves.toBe('');
  });

  it('should handle claude request in cli mode and sdk error mode', async () => {
    const child = createChildProcessMock();
    mockExecSync.mockReturnValue('/bin/claude\n');
    mockSpawn.mockReturnValue(child);

    const sentCli: any[] = [];
    const onEndCli = vi.fn();
    const req = handleClaudeRequest(
      'hello data:image/png;base64,aGVsbG8=',
      { name: 'Button', file: 'src/a.ts', line: 1, column: 1 },
      [{ role: 'assistant', content: 'history' }],
      'sid-0',
      process.cwd(),
      { type: 'cli', options: { model: 'claude-sonnet-4-5' } } as any,
      {
        sendSSE: (data: any) => sentCli.push(data),
        onEnd: onEndCli,
      },
    );

    child.stdout.emit('data', Buffer.from(JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'A' } }) + '\n'));
    child.emit('close', 0);

    expect(sentCli.some((item) => item?.type === 'info')).toBe(true);
    expect(sentCli.some((item) => item?.type === 'text')).toBe(true);
    expect(sentCli.some((item) => item === '[DONE]')).toBe(true);
    expect(onEndCli).toHaveBeenCalled();
    req.abort();
    expect(child.kill).toHaveBeenCalled();

    __TEST_ONLY__.setClaudeQuery(() => {
      throw new Error('sdk boom');
    });
    const sentSdk: any[] = [];
    const onEndSdk = vi.fn();
    handleClaudeRequest(
      'hello',
      null,
      [],
      undefined,
      process.cwd(),
      { type: 'sdk', options: {} } as any,
      {
        sendSSE: (data: any) => sentSdk.push(data),
        onEnd: onEndSdk,
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(sentSdk.some((item) => typeof item?.error === 'string' && item.error.includes('Failed to communicate with Claude'))).toBe(
      true,
    );
    expect(sentSdk.some((item) => item === '[DONE]')).toBe(true);
    expect(onEndSdk).toHaveBeenCalled();
  });

  it('should default to cli mode when ai options are missing', () => {
    const child = createChildProcessMock();
    mockExecSync.mockReturnValue('/bin/claude\n');
    mockSpawn.mockReturnValue(child);

    const sent: any[] = [];
    const onEnd = vi.fn();
    handleClaudeRequest(
      'hello',
      null,
      [],
      undefined,
      process.cwd(),
      undefined as any,
      {
        sendSSE: (data: any) => sent.push(data),
        onEnd,
      },
    );

    child.emit('close', 0);
    expect(sent.some((item) => item?.type === 'info')).toBe(true);
    expect(onEnd).toHaveBeenCalled();
  });

  it('should build sdk multimodal prompt input when message contains inline images', async () => {
    const sent: any[] = [];
    const onEnd = vi.fn();

    __TEST_ONLY__.setClaudeQuery(({ prompt }: any) => ({
      interrupt: vi.fn(),
      async *[Symbol.asyncIterator]() {
        expect(typeof prompt?.[Symbol.asyncIterator]).toBe('function');
        const iterator = prompt[Symbol.asyncIterator]();
        const first = await iterator.next();
        expect(first.done).toBe(false);
        const content = first.value?.message?.content || [];
        expect(content.some((item: any) => item.type === 'image')).toBe(true);
        const second = await iterator.next();
        expect(second.done).toBe(true);
        yield { type: 'result', subtype: 'success', result: 'ok' };
      },
    }));

    handleClaudeRequest(
      'hello data:image/png;base64,aGVsbG8=',
      null,
      [],
      'sid-1',
      process.cwd(),
      { type: 'sdk', options: {} } as any,
      {
        sendSSE: (data: any) => sent.push(data),
        onEnd,
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(sent.some((item) => typeof item?.message === 'string' && item.message.includes('Sending as multimodal input.'))).toBe(true);
    expect(sent.some((item) => item?.type === 'text' && item.content === 'ok')).toBe(true);
    expect(sent.some((item) => item === '[DONE]')).toBe(true);
    expect(onEnd).toHaveBeenCalled();
  });

  it('should set empty session id in sdk multimodal input when session is absent', async () => {
    const sent: any[] = [];
    __TEST_ONLY__.setClaudeQuery(({ prompt }: any) => ({
      interrupt: vi.fn(),
      async *[Symbol.asyncIterator]() {
        const iterator = prompt[Symbol.asyncIterator]();
        const first = await iterator.next();
        expect(first.done).toBe(false);
        expect(first.value?.session_id).toBe('');
        yield { type: 'result', subtype: 'success', result: 'ok' };
      },
    }));

    handleClaudeRequest(
      'hello data:image/png;base64,aGVsbG8=',
      null,
      [],
      undefined,
      process.cwd(),
      { type: 'sdk', options: {} } as any,
      {
        sendSSE: (data: any) => sent.push(data),
        onEnd: vi.fn(),
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(sent.some((item) => item?.type === 'text' && item.content === 'ok')).toBe(true);
  });

  it('should cover cli parser branches for assistant fallback, close-buffer parse and invalid tool json', () => {
    const childA = createChildProcessMock();
    mockSpawn.mockReturnValueOnce(childA);
    const chunksA: string[] = [];

    __TEST_ONLY__.queryViaCli(
      '/bin/claude',
      'prompt',
      undefined,
      process.cwd(),
      { options: { systemPrompt: 'system text' } } as any,
      (data: string) => chunksA.push(data),
      () => undefined,
      () => undefined,
      undefined,
      undefined,
    );

    childA.stdout.emit(
      'data',
      Buffer.from(
        [
          JSON.stringify({
            type: 'assistant',
            message: {
              content: [
                { type: 'text', text: 'assistant text' },
                { type: 'tool_use', id: 't-assist', name: 'Read', input: { file: 'a.ts' } },
              ],
            },
          }),
          JSON.stringify({
            type: 'user',
            message: {
              content: [{ type: 'tool_result', tool_use_id: 't-assist', content: 'ok', is_error: false }],
            },
          }),
          JSON.stringify({ type: 'result', result: 'final-from-result' }),
        ].join('\n') + '\n',
      ),
    );
    childA.emit('close', 0);

    const joinedA = chunksA.join('\n');
    expect(joinedA).toContain('"type":"text"');
    expect(joinedA).toContain('"type":"tool_start"');
    expect(joinedA).toContain('"type":"tool_input"');
    expect(joinedA).toContain('"type":"tool_result"');

    const childE = createChildProcessMock();
    mockSpawn.mockReturnValueOnce(childE);
    const chunksE: string[] = [];
    __TEST_ONLY__.queryViaCli(
      '/bin/claude',
      'prompt',
      undefined,
      process.cwd(),
      { options: {} } as any,
      (data: string) => chunksE.push(data),
      () => undefined,
      () => undefined,
      undefined,
      undefined,
    );
    childE.stdout.emit(
      'data',
      Buffer.from(JSON.stringify({ type: 'result', result: 'final-from-result' }) + '\n'),
    );
    childE.emit('close', 0);
    expect(chunksE.join('\n')).toContain('final-from-result');

    const childB = createChildProcessMock();
    mockSpawn.mockReturnValueOnce(childB);
    const chunksB: string[] = [];
    __TEST_ONLY__.queryViaCli(
      '/bin/claude',
      'prompt',
      undefined,
      process.cwd(),
      { options: {} } as any,
      (data: string) => chunksB.push(data),
      () => undefined,
      () => undefined,
      undefined,
      undefined,
    );
    childB.stdout.emit(
      'data',
      Buffer.from(
        [
          '',
          JSON.stringify({
            type: 'content_block_start',
            index: 1,
            content_block: { type: 'tool_use', id: 't1', name: 'Write' },
          }),
          JSON.stringify({
            type: 'content_block_delta',
            index: 1,
            delta: { type: 'input_json_delta', partial_json: '{bad' },
          }),
          JSON.stringify({
            type: 'content_block_delta',
            index: 1,
            delta: { type: 'input_json_delta' },
          }),
          JSON.stringify({ type: 'content_block_stop', index: 1 }),
        ].join('\n') + '\n',
      ),
    );
    childB.emit('close', 0);
    expect(chunksB.some((item) => item.includes('"tool_start"'))).toBe(true);
    expect(chunksB.some((item) => item.includes('"tool_input"'))).toBe(false);

    const childC = createChildProcessMock();
    mockSpawn.mockReturnValueOnce(childC);
    const chunksC: string[] = [];
    __TEST_ONLY__.queryViaCli(
      '/bin/claude',
      'prompt',
      undefined,
      process.cwd(),
      { options: {} } as any,
      (data: string) => chunksC.push(data),
      () => undefined,
      () => undefined,
      undefined,
      undefined,
    );
    childC.stdout.emit(
      'data',
      Buffer.from(JSON.stringify({ type: 'result', result: 'tail-result' })),
    );
    childC.emit('close', 0);
    expect(chunksC.join('\n')).toContain('tail-result');

    const childD = createChildProcessMock();
    mockSpawn.mockReturnValueOnce(childD);
    const chunksD: string[] = [];
    __TEST_ONLY__.queryViaCli(
      '/bin/claude',
      'prompt',
      undefined,
      process.cwd(),
      { options: {} } as any,
      (data: string) => chunksD.push(data),
      () => undefined,
      () => undefined,
      undefined,
      undefined,
    );
    childD.stdout.emit('data', Buffer.from('not-json-tail'));
    childD.emit('close', 0);
    expect(chunksD.join('\n')).toContain('not-json-tail');
  });

  it('should cover handleClaudeRequest cli callbacks and sdk-timeout fallback-to-cli', async () => {
    const childCli = createChildProcessMock();
    mockSpawn.mockReturnValueOnce(childCli);
    mockExecSync.mockReturnValue('/bin/claude\n');

    const sentCli: any[] = [];
    const onEndCli = vi.fn();
    handleClaudeRequest(
      'hello',
      null,
      [{ role: 'assistant', content: 'history data:image/png;base64,aGVsbG8=' }],
      undefined,
      process.cwd(),
      { type: 'cli', options: {} } as any,
      {
        sendSSE: (data: any) => sentCli.push(data),
        onEnd: onEndCli,
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

    childCli.stdout.emit('data', Buffer.from('plain-cli-line\n'));
    childCli.stdout.emit(
      'data',
      Buffer.from(JSON.stringify({ type: 'system', session_id: 'sid-2' }) + '\n'),
    );
    childCli.emit('error', new Error('cli-error'));
    childCli.emit('close', 0);
    stringifySpy.mockRestore();

    expect(sentCli.some((item) => item?.type === 'text' && item.content === '{bad-json')).toBe(true);
    expect(sentCli.some((item) => item?.type === 'session' && item.sessionId === 'sid-2')).toBe(true);
    expect(sentCli.some((item) => item?.error === 'cli-error')).toBe(true);
    expect(onEndCli).toHaveBeenCalled();

    const childFallback = createChildProcessMock();
    mockSpawn.mockReturnValueOnce(childFallback);
    mockExecSync.mockReturnValue('/bin/claude\n');

    vi.useFakeTimers();
    try {
      let resumeStream: (() => void) | undefined;
      let interrupted = false;
      __TEST_ONLY__.setClaudeQuery(() => ({
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
      }));

      const sentFallback: any[] = [];
      const onEndFallback = vi.fn();
      handleClaudeRequest(
        'hello',
        null,
        [{ role: 'assistant', content: 'history' }],
        undefined,
        process.cwd(),
        { type: 'sdk', options: {} } as any,
        {
          sendSSE: (data: any) => sentFallback.push(data),
          onEnd: onEndFallback,
        },
      );

      await vi.advanceTimersByTimeAsync(100100);
      childFallback.stdout.emit(
        'data',
        Buffer.from(JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'F' } }) + '\n'),
      );
      childFallback.emit('close', 0);
      await vi.runAllTimersAsync();

      expect(
        sentFallback.some(
          (item) =>
            typeof item?.message === 'string' &&
            item.message.includes('Claude SDK timed out without response. Falling back to local Claude CLI.'),
        ),
      ).toBe(true);
      expect(sentFallback.some((item) => item?.type === 'text')).toBe(true);
      expect(sentFallback.some((item) => item === '[DONE]')).toBe(true);
      expect(onEndFallback).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should resolve empty model when cli probe emits error event', async () => {
    const child = createChildProcessMock();
    mockExecSync.mockReturnValue('/bin/claude\n');
    mockSpawn.mockReturnValue(child);

    const probe = getModelInfo(undefined as any);
    child.emit('error', new Error('probe-error'));
    await expect(probe).resolves.toBe('');
  });

  it('should cover sdk-timeout fallback with session/images and fallback cli callbacks', async () => {
    const child = createChildProcessMock();
    mockSpawn.mockReturnValue(child);
    mockExecSync.mockReturnValue('/bin/claude\n');

    vi.useFakeTimers();
    try {
      let resumeStream: (() => void) | undefined;
      let interrupted = false;
      __TEST_ONLY__.setClaudeQuery(() => ({
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
      }));

      const sent: any[] = [];
      const onEnd = vi.fn();
      handleClaudeRequest(
        'hello data:image/png;base64,aGVsbG8=',
        { name: 'Button', file: 'src/a.ts', line: 1, column: 1 },
        [{ role: 'assistant', content: 'history' }],
        'sid-keep',
        process.cwd(),
        { type: 'sdk', options: {} } as any,
        {
          sendSSE: (data: any) => sent.push(data),
          onEnd,
        },
      );

      await vi.advanceTimersByTimeAsync(100100);

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
          [
            JSON.stringify({ type: 'system', session_id: 'sid-fallback' }),
            'plain-fallback-line',
          ].join('\n') + '\n',
        ),
      );
      child.emit('error', new Error('fallback-cli-error'));
      child.emit('close', 0);
      await vi.runAllTimersAsync();
      stringifySpy.mockRestore();

      expect(
        sent.some(
          (item) =>
            typeof item?.message === 'string' &&
            item.message.includes('Claude SDK timed out without response. Falling back to local Claude CLI.'),
        ),
      ).toBe(true);
      expect(
        sent.some(
          (item) =>
            typeof item?.message === 'string' &&
            item.message.includes('Sending via Claude CLI stream-json input.'),
        ),
      ).toBe(true);
      expect(sent.some((item) => item?.type === 'session' && item.sessionId === 'sid-fallback')).toBe(
        true,
      );
      expect(sent.some((item) => item?.type === 'text' && item.content === '{bad-json')).toBe(true);
      expect(sent.some((item) => item?.error === 'fallback-cli-error')).toBe(true);
      expect(sent.some((item) => item === '[DONE]')).toBe(true);
      expect(onEnd).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
