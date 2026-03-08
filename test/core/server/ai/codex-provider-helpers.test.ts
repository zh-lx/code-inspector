import fs from 'fs';
import os from 'os';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { __TEST_ONLY__, getModelInfo, handleCodexRequest } from '@/core/src/server/ai-provider-codex';

const PNG_DATA_URL = 'data:image/png;base64,aGVsbG8=';

describe('codex provider helpers', () => {
  beforeEach(() => {
    __TEST_ONLY__.resetCaches();
  });

  it('should build prompts and provider options', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-prompt-'));
    const rel = 'src/a.ts';
    fs.mkdirSync(path.join(cwd, 'src'), { recursive: true });
    fs.writeFileSync(path.join(cwd, rel), 'export const a = 1;');

    const prompt = __TEST_ONLY__.buildPrompt(
      'what changed',
      { name: 'Button', file: rel, line: 3, column: 1 },
      [{ role: 'user', content: 'prev q' }, { role: 'assistant', content: 'prev a' }],
      cwd,
    );
    expect(prompt).toContain(`[Project] Working in project: ${cwd}`);
    expect(prompt).toContain(`[Context] I'm looking at a <Button> component located at @${rel}#3.`);
    expect(prompt).toContain('[Previous conversation]');

    const resumeGlobal = __TEST_ONLY__.buildResumeTurnPrompt('next', null, cwd);
    expect(resumeGlobal).toContain('Global mode');

    expect(__TEST_ONLY__.getCodexAgentOptions({ options: { model: 'gpt-5-codex' } } as any)).toEqual({
      model: 'gpt-5-codex',
    });
    expect(__TEST_ONLY__.getCodexCliOptions({ type: 'sdk', options: { model: 'x' } } as any)).toEqual({});
    expect(__TEST_ONLY__.getCodexSdkOptions({ type: 'cli', options: { model: 'x' } } as any)).toEqual({});
    expect(__TEST_ONLY__.getCodexSdkOptions({ type: 'sdk', options: { model: 'x' } } as any)).toEqual({
      model: 'x',
    });
  });

  it('should build args and parse event helpers', () => {
    expect(__TEST_ONLY__.mediaTypeToExtension('image/jpeg')).toBe('jpg');
    expect(__TEST_ONLY__.mediaTypeToExtension('image/svg+xml')).toBe('svg');
    expect(__TEST_ONLY__.mediaTypeToExtension('image/x-icon')).toBe('ico');
    expect(__TEST_ONLY__.mediaTypeToExtension('image/webp+abc')).toBe('webp');
    expect(__TEST_ONLY__.mediaTypeToExtension('image')).toBe('png');
    expect(__TEST_ONLY__.mediaTypeToExtension('image/+xml')).toBe('png');

    expect(__TEST_ONLY__.formatConfigValue('a')).toBe('"a"');
    expect(__TEST_ONLY__.formatConfigValue(1)).toBe('1');
    expect(__TEST_ONLY__.formatConfigValue(true)).toBe('true');

    const args = __TEST_ONLY__.buildCommonArgs(
      {
        model: 'gpt-5-codex',
        profile: 'dev',
        sandbox: 'workspace-write',
        fullAuto: true,
        skipGitRepoCheck: true,
        ephemeral: true,
        config: { a: 'b', n: 1, on: true },
      } as any,
      '/tmp/out.txt',
    );
    expect(args).toEqual(
      expect.arrayContaining([
        '--json',
        '-o',
        '/tmp/out.txt',
        '-m',
        'gpt-5-codex',
        '-p',
        'dev',
        '-s',
        'workspace-write',
        '--full-auto',
        '--skip-git-repo-check',
        '--ephemeral',
      ]),
    );

    expect(__TEST_ONLY__.extractTextFromContent(null)).toBe('');
    expect(__TEST_ONLY__.extractTextFromContent('x')).toBe('x');
    expect(
      __TEST_ONLY__.extractTextFromContent([
        null,
        'a',
        { text: 'b' },
        { content: 'c' },
        {},
      ]),
    ).toBe('abc');

    expect(__TEST_ONLY__.extractModelFromEvent({ model: 'm1' })).toBe('m1');
    expect(__TEST_ONLY__.extractModelFromEvent({ response: { model: 'm2' } })).toBe('m2');
    expect(__TEST_ONLY__.extractModelFromEvent({ metadata: { model: 'm3' } })).toBe('m3');
    expect(__TEST_ONLY__.extractModelFromEvent({})).toBe('');

    expect(__TEST_ONLY__.extractTextEvent({ type: 'response.output_text.delta', delta: 'x' })).toEqual({
      text: 'x',
      delta: true,
    });
    expect(__TEST_ONLY__.extractTextEvent({ type: 'response.output_text.done', text: 'y' })).toEqual({
      text: 'y',
      delta: false,
    });
    expect(__TEST_ONLY__.extractTextEvent({ delta: { text: 'z' } })).toEqual({
      text: 'z',
      delta: true,
    });
    expect(__TEST_ONLY__.extractTextEvent({ message: { content: [{ text: 'm' }] } })).toEqual({
      text: 'm',
      delta: false,
    });
    expect(__TEST_ONLY__.extractTextEvent({})).toBeNull();

    expect(__TEST_ONLY__.shouldIgnorePlainLine('')).toBe(true);
    expect(
      __TEST_ONLY__.shouldIgnorePlainLine(
        'WARNING: proceeding, even though we could not update PATH something',
      ),
    ).toBe(true);
    expect(__TEST_ONLY__.shouldIgnorePlainLine('2025-01-01T00:00:00 ERROR bad')).toBe(true);
    expect(__TEST_ONLY__.shouldIgnorePlainLine('normal line')).toBe(false);
  });

  it('should cover codex options fallback branches', () => {
    expect(__TEST_ONLY__.getCodexCliOptions(undefined as any)).toEqual({});
    expect(__TEST_ONLY__.getCodexCliOptions({ type: 'cli' } as any)).toEqual({});
    expect(__TEST_ONLY__.getCodexSdkOptions({ type: 'sdk' } as any)).toEqual({});
  });

  it('should cover file snapshot helpers and tool event mapping', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-file-'));
    const rel = 'a.txt';
    const abs = path.join(cwd, rel);
    fs.writeFileSync(abs, 'before');

    const longText = 'a'.repeat(13000);
    expect(__TEST_ONLY__.truncateDiffText('short')).toBe('short');
    expect(__TEST_ONLY__.truncateDiffText(longText)).toContain('[truncated');

    expect(__TEST_ONLY__.readFileText(path.join(cwd, 'not-exists.txt'))).toEqual({
      exists: false,
      content: '',
    });
    expect(__TEST_ONLY__.readFileText(cwd).content).toBe('[not a regular file]');
    expect(__TEST_ONLY__.readFileText(abs).content).toBe('before');

    const resolvedRel = __TEST_ONLY__.resolveChangePath(rel, cwd);
    expect(resolvedRel.displayPath).toBe(rel);
    expect(resolvedRel.absolutePath).toBe(abs);
    const resolvedAbs = __TEST_ONLY__.resolveChangePath(abs, cwd);
    expect(resolvedAbs).toEqual({ absolutePath: abs, displayPath: abs });

    const store = new Map<string, Map<string, any>>();
    const snap = __TEST_ONLY__.ensureFileSnapshot('t1', rel, abs, store);
    expect(snap.beforeContent).toBe('before');
    expect(__TEST_ONLY__.getFileSnapshot('t1', abs, store)).toBeTruthy();

    expect(__TEST_ONLY__.getItemText({ text: 'a' })).toBe('a');
    expect(__TEST_ONLY__.getItemText({ message: 'a' })).toBe('a');
    expect(__TEST_ONLY__.getItemText({ output_text: 'a' })).toBe('a');
    expect(__TEST_ONLY__.getItemText({ output: 'a' })).toBe('a');
    expect(__TEST_ONLY__.getItemText({ result: 'a' })).toBe('a');
    expect(__TEST_ONLY__.getItemText({})).toBe('');

    const commandEvent = __TEST_ONLY__.buildToolEventFromItem({
      id: 'c1',
      type: 'command_execution',
      command: 'ls',
      aggregated_output: 'ok',
      exit_code: 1,
      status: 'failed',
    });
    expect(commandEvent?.toolName).toBe('Bash');
    expect(commandEvent?.isError).toBe(true);

    const fileStart = __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'f1',
        type: 'file_change',
        status: 'running',
        changes: [{ path: rel, kind: 'edit' }],
      },
      { cwd, fileSnapshots: store, done: false },
    );
    expect(fileStart?.toolName).toBe('Edit');

    fs.writeFileSync(abs, 'after');
    const fileDone = __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'f1',
        type: 'file_change',
        status: 'done',
        changes: [{ path: rel, kind: 'edit' }],
      },
      { cwd, fileSnapshots: store, done: true },
    );
    expect((fileDone?.input as any).diff_blocks[0].old_string).toContain('before');
    expect((fileDone?.input as any).diff_blocks[0].new_string).toContain('after');

    const web = __TEST_ONLY__.buildToolEventFromItem({
      id: 'w1',
      type: 'web_search',
      query: 'vitest',
      result: { ok: true },
      status: 'done',
    });
    expect(web?.toolName).toBe('WebSearch');

    const mcp = __TEST_ONLY__.buildToolEventFromItem({
      id: 'mcp1',
      type: 'mcp_tool_call',
      server: 'srv',
      tool: 'read',
      arguments: { a: 1 },
      error: 'boom',
    });
    expect(mcp?.toolName).toBe('read');
    expect(mcp?.isError).toBe(true);

    expect(__TEST_ONLY__.buildToolEventFromItem({})).toBeNull();

    expect(__TEST_ONLY__.stringifyUnknown(undefined)).toBe('');
    expect(__TEST_ONLY__.stringifyUnknown('x')).toBe('x');
    expect(__TEST_ONLY__.stringifyUnknown({ a: 1 })).toContain('"a":1');
    const circular: any = {};
    circular.self = circular;
    expect(__TEST_ONLY__.stringifyUnknown(circular)).toContain('[object Object]');

    expect(__TEST_ONLY__.buildSDKErrorMessage({ message: 'm' })).toBe('m');
    expect(__TEST_ONLY__.buildSDKErrorMessage({ error: 'e' })).toBe('e');
    expect(__TEST_ONLY__.buildSDKErrorMessage({ error: { message: 'ee' } })).toBe('ee');
    expect(__TEST_ONLY__.buildSDKErrorMessage({})).toBe('Codex SDK error');
  });

  it('should build sdk options and stream sdk events', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-sdk-'));
    const rel = 'edit.txt';
    const abs = path.join(cwd, rel);
    fs.writeFileSync(abs, 'old');
    const tempImage = path.join(cwd, 'tmp-img.png');
    fs.writeFileSync(tempImage, 'img');

    const clientOptions = __TEST_ONLY__.buildCodexSDKClientOptions({
      codexPathOverride: '/bin/codex',
      baseUrl: 'http://localhost',
      apiKey: 'k',
      config: { a: 1 },
      env: { A: '1' },
    } as any);
    expect(clientOptions.codexPathOverride).toBe('/bin/codex');
    expect(clientOptions.baseUrl).toBe('http://localhost');
    expect(clientOptions.apiKey).toBe('k');
    expect(clientOptions.config).toEqual({ a: 1 });
    expect(clientOptions.env.A).toBe('1');

    const threadOptions = __TEST_ONLY__.buildCodexSDKThreadOptions(
      {
        cwd,
        model: 'gpt-5-codex',
        profile: 'dev',
        sandboxMode: 'workspace-write',
        skipGitRepoCheck: true,
        modelReasoningEffort: 'high',
        webSearchRequest: { user_location: 'US' },
        enableWebSearch: true,
        approvalPolicy: 'auto',
        additionalWritableRoots: ['/tmp'],
      } as any,
      '/fallback',
    );
    expect(threadOptions.cwd).toBe(cwd);
    expect(threadOptions.model).toBe('gpt-5-codex');

    const sent: any[] = [];
    const fakeThread = {
      id: 'session-1',
      interrupt: vi.fn(),
      runStreamed: vi.fn(async () => ({
        events: (async function* () {
          yield { type: 'error', message: 'bad' };
          yield {
            type: 'item.started',
            item: { id: 'cmd1', type: 'command_execution', command: 'pwd' },
          };
          yield {
            type: 'item.updated',
            item: { id: 'm1', type: 'agent_message', text: 'hello' },
          };
          yield {
            type: 'item.updated',
            item: { id: 'm1', type: 'agent_message', text: 'hello world' },
          };
          yield {
            type: 'item.started',
            item: { id: 'fc1', type: 'file_change', changes: [{ path: rel, kind: 'edit' }] },
          };
          fs.writeFileSync(abs, 'new');
          yield {
            type: 'item.completed',
            item: { id: 'fc1', type: 'file_change', changes: [{ path: rel, kind: 'edit' }] },
          };
          yield {
            type: 'item.completed',
            item: { id: 'm1', type: 'agent_message', text: 'hello world!' },
          };
          yield { type: 'task_complete', last_agent_message: 'final' };
        })(),
      })),
    };

    class FakeCodexSDK {
      static lastClientOptions: any;
      constructor(options: any) {
        FakeCodexSDK.lastClientOptions = options;
      }
      async startThread() {
        return fakeThread;
      }
      async resumeThread() {
        return fakeThread;
      }
    }

    __TEST_ONLY__.setCodexSDKCtor(FakeCodexSDK, '@openai/codex-sdk');

    const thread = await __TEST_ONLY__.queryViaSdk(
      'prompt',
      cwd,
      { model: 'gpt-5-codex' } as any,
      undefined,
      (data: any) => sent.push(data),
      () => false,
      [tempImage],
    );

    expect(thread).toBe(fakeThread);
    expect(sent.some((item) => item?.type === 'session' && item.sessionId === 'session-1')).toBe(
      true,
    );
    expect(sent.some((item) => item?.type === 'tool_start')).toBe(true);
    expect(sent.some((item) => item?.type === 'tool_result')).toBe(true);
    expect(sent.some((item) => item?.type === 'text')).toBe(true);
    expect(sent.some((item) => item?.error === 'bad')).toBe(true);
    expect(fs.existsSync(tempImage)).toBe(false);
  });

  it('should handle sdk unavailable and model resolution', async () => {
    __TEST_ONLY__.setCodexSDKCtor(null);
    const sent: any[] = [];
    const thread = await __TEST_ONLY__.queryViaSdk(
      'prompt',
      process.cwd(),
      {} as any,
      undefined,
      (data: any) => sent.push(data),
      () => false,
      [],
    );
    expect(thread).toBeNull();
    expect(sent.some((item) => item?.type === 'text')).toBe(true);

    expect(await getModelInfo({ options: { model: 'gpt-5-codex' } } as any)).toBe('gpt-5-codex');
    expect(await getModelInfo({ options: { config: { model: 'gpt-5.1-codex' } } } as any)).toBe(
      'gpt-5.1-codex',
    );
  });

  it('should cache empty model when no codex model is configured', async () => {
    __TEST_ONLY__.resetCaches();
    await expect(getModelInfo(undefined as any)).resolves.toBe('');
    await expect(getModelInfo(undefined as any)).resolves.toBe('');
  });

  it('should keep history in first turn and send done in sdk mode', async () => {
    const oldPath = process.env.PATH;
    process.env.PATH = '';

    const sent: any[] = [];
    const onEnd = vi.fn();
    class FakeCodexSDK {
      async startThread() {
        return {
          id: 'sid-x',
          interrupt: vi.fn(),
          runStreamed: async () => ({ events: (async function* () {})() }),
        };
      }
    }
    __TEST_ONLY__.setCodexSDKCtor(FakeCodexSDK, '@openai/codex-sdk');

    const req = handleCodexRequest(
      `question ${PNG_DATA_URL}`,
      { name: 'A', file: 'a.ts', line: 1, column: 1 },
      [{ role: 'assistant', content: `history ${PNG_DATA_URL}` }],
      undefined,
      process.cwd(),
      { type: 'sdk', options: { model: 'gpt-5-codex' } } as any,
      {
        sendSSE: (data: any) => sent.push(data),
        onEnd,
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(typeof req.abort).toBe('function');
    expect(sent.some((item) => item === '[DONE]')).toBe(true);
    expect(onEnd).toHaveBeenCalled();

    process.env.PATH = oldPath;
  });

  it('should use resumeThread and stop sdk loop when aborted', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-resume-'));
    const tempImage = path.join(cwd, 'tmp.png');
    fs.writeFileSync(tempImage, 'x');

    const sent: any[] = [];
    const fakeThread = {
      id: 'sid-resume',
      interrupt: vi.fn(),
      runStreamed: vi.fn(async () => ({
        events: (async function* () {
          yield { type: 'item.started', item: { id: 'cmd1', type: 'command_execution', command: 'pwd' } };
        })(),
      })),
    };
    class FakeCodexSDK {
      async startThread() {
        throw new Error('should not call startThread');
      }
      async resumeThread() {
        return fakeThread;
      }
    }
    __TEST_ONLY__.setCodexSDKCtor(FakeCodexSDK, '@openai/codex-sdk');

    const thread = await __TEST_ONLY__.queryViaSdk(
      'prompt',
      cwd,
      {} as any,
      'sid-existing',
      (data: any) => sent.push(data),
      () => true,
      [tempImage],
    );

    expect(thread).toBe(fakeThread);
    expect(fakeThread.interrupt).toHaveBeenCalled();
    expect(fs.existsSync(tempImage)).toBe(false);
    expect(sent.some((item) => item?.type === 'session' && item.sessionId === 'sid-resume')).toBe(true);
  });

  it('should emit task_complete fallback text from last_agent_message and result', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-task-complete-'));

    const makeThread = (event: any) => ({
      id: 'sid-task',
      interrupt: vi.fn(),
      runStreamed: vi.fn(async () => ({
        events: (async function* () {
          yield event;
        })(),
      })),
    });

    class FakeCodexSDK {
      thread: any;
      constructor(thread: any) {
        this.thread = thread;
      }
      async startThread() {
        return this.thread;
      }
    }

    const sentA: any[] = [];
    const threadA = makeThread({ type: 'task_complete', last_agent_message: 'from-last' });
    __TEST_ONLY__.setCodexSDKCtor(class extends FakeCodexSDK { constructor() { super(threadA); } }, '@openai/codex-sdk');
    await __TEST_ONLY__.queryViaSdk(
      'prompt',
      cwd,
      {} as any,
      undefined,
      (data: any) => sentA.push(data),
      () => false,
      [],
    );
    expect(sentA.some((item) => item?.type === 'text' && item.content === 'from-last')).toBe(true);

    const sentB: any[] = [];
    const threadB = makeThread({ type: 'task_complete', result: 'from-result' });
    __TEST_ONLY__.setCodexSDKCtor(class extends FakeCodexSDK { constructor() { super(threadB); } }, '@openai/codex-sdk');
    await __TEST_ONLY__.queryViaSdk(
      'prompt',
      cwd,
      {} as any,
      undefined,
      (data: any) => sentB.push(data),
      () => false,
      [],
    );
    expect(sentB.some((item) => item?.type === 'text' && item.content === 'from-result')).toBe(true);
  });

  it('should cover additional codex helper edge branches', () => {
    expect(__TEST_ONLY__.extractTextFromContent({ any: 'object' } as any)).toBe('');
    expect(__TEST_ONLY__.extractTextEvent({ delta: 'd' })).toEqual({
      text: 'd',
      delta: true,
    });
    expect(__TEST_ONLY__.extractTextEvent({ text: 't' })).toEqual({
      text: 't',
      delta: false,
    });
    expect(__TEST_ONLY__.extractTextEvent({ output_text: 'o' })).toEqual({
      text: 'o',
      delta: false,
    });
    expect(__TEST_ONLY__.extractTextEvent({ content: [{ content: 'c' }] })).toEqual({
      text: 'c',
      delta: false,
    });

    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-edge-'));
    const rel = 'big.txt';
    const abs = path.join(cwd, rel);
    const beforeText = 'a'.repeat(13000) + '1';
    const afterText = 'a'.repeat(13000) + '2';
    fs.writeFileSync(abs, beforeText);

    const store = new Map<string, Map<string, any>>();
    __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'diff-1',
        type: 'file_change',
        changes: [{ path: rel, kind: 'edit' }],
      },
      { cwd, fileSnapshots: store, done: false },
    );

    fs.writeFileSync(abs, afterText);
    const doneEvent = __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'diff-1',
        type: 'file_change',
        changes: [{ path: rel, kind: 'edit' }],
      },
      { cwd, fileSnapshots: store, done: true },
    ) as any;
    expect(doneEvent.input.diff_blocks[0].old_string).toBe(beforeText);
    expect(doneEvent.input.diff_blocks[0].new_string).toBe(afterText);

    const invalidPathEvent = __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'diff-invalid-path',
        type: 'file_change',
        changes: [{}, { path: '', kind: 'edit' }],
      },
      { cwd, fileSnapshots: new Map(), done: true },
    ) as any;
    expect(invalidPathEvent.input.diff_blocks).toEqual([]);

    const addEvent = __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'diff-add',
        type: 'file_change',
        changes: [{ path: rel, kind: 'add' }],
      },
      { cwd, fileSnapshots: new Map(), done: true },
    ) as any;
    expect(addEvent.input.diff_blocks[0].old_string).toBe('');

    const deleteStore = new Map<string, Map<string, any>>();
    __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'diff-delete',
        type: 'file_change',
        changes: [{ path: rel, kind: 'delete' }],
      },
      { cwd, fileSnapshots: deleteStore, done: false },
    );
    const deleteEvent = __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'diff-delete',
        type: 'file_change',
        changes: [{ path: rel, kind: 'delete' }],
      },
      { cwd, fileSnapshots: deleteStore, done: true },
    ) as any;
    expect(deleteEvent.input.diff_blocks[0].new_string).toBe('');

    const emptyBeforeRel = 'empty-before.txt';
    const emptyBeforeAbs = path.join(cwd, emptyBeforeRel);
    fs.writeFileSync(emptyBeforeAbs, '');
    const emptyBeforeStore = new Map<string, Map<string, any>>();
    __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'diff-empty-before',
        type: 'file_change',
        changes: [{ path: emptyBeforeRel, kind: 'edit' }],
      },
      { cwd, fileSnapshots: emptyBeforeStore, done: false },
    );
    fs.writeFileSync(emptyBeforeAbs, 'after-empty');
    const emptyBeforeEvent = __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'diff-empty-before',
        type: 'file_change',
        changes: [{ path: emptyBeforeRel, kind: 'edit' }],
      },
      { cwd, fileSnapshots: emptyBeforeStore, done: true },
    ) as any;
    expect(emptyBeforeEvent.input.diff_blocks[0].old_string).toBe('');

    const missingKindStore = new Map<string, Map<string, any>>();
    const missingKindRel = 'missing-kind.txt';
    const missingKindAbs = path.join(cwd, missingKindRel);
    fs.writeFileSync(missingKindAbs, 'old');
    __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'diff-missing-kind',
        type: 'file_change',
        changes: [{ path: missingKindRel }],
      },
      { cwd, fileSnapshots: missingKindStore, done: false },
    );
    fs.writeFileSync(missingKindAbs, 'new');
    const missingKindEvent = __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'diff-missing-kind',
        type: 'file_change',
        changes: [{ path: missingKindRel }],
      },
      { cwd, fileSnapshots: missingKindStore, done: true },
    ) as any;
    expect(missingKindEvent.input.diff_blocks.length).toBe(1);

    const noSnapshotStore = new Map<string, Map<string, any>>();
    const noSnapshotEvent = __TEST_ONLY__.buildToolEventFromItem(
      {
        id: 'diff-2',
        type: 'file_change',
        changes: [{ path: 'missing.txt', kind: 'edit' }],
      },
      { cwd, fileSnapshots: noSnapshotStore, done: true },
    ) as any;
    expect(noSnapshotEvent.input.diff_blocks).toEqual([]);

    const noChangeEvent = __TEST_ONLY__.buildToolEventFromItem({
      id: 'diff-3',
      type: 'file_change',
      changes: [],
    });
    expect(noChangeEvent?.result).toBe('Applied file changes');

    const commandExitOnly = __TEST_ONLY__.buildToolEventFromItem({
      id: 'cmd-exit',
      type: 'command_execution',
      command: 'echo hi',
      status: 'completed',
      exit_code: 2,
      output: '',
    });
    expect(commandExitOnly?.isError).toBe(true);
    expect(commandExitOnly?.result).toBe('exit code 2');

    const nullChangesEvent = __TEST_ONLY__.buildToolEventFromItem({
      id: 'diff-null',
      type: 'file_change',
      changes: null,
    } as any);
    expect((nullChangesEvent as any)?.input?.changes).toEqual([]);

    const webNoQuery = __TEST_ONLY__.buildToolEventFromItem({
      id: 'web-0',
      type: 'web_search',
      status: 'done',
    }) as any;
    expect(webNoQuery.input).toEqual({ _provider: 'codex' });

    const mcpWithToolName = __TEST_ONLY__.buildToolEventFromItem({
      id: 'mcp-tool-name',
      type: 'mcp_tool_call',
      tool_name: 'serverTool',
      status: 'failed',
    });
    expect(mcpWithToolName?.toolName).toBe('serverTool');
    expect(mcpWithToolName?.isError).toBe(true);

    const mcpDefaultName = __TEST_ONLY__.buildToolEventFromItem({
      id: 'mcp-default',
      type: 'mcp_tool_call',
      input: { x: 1 },
    });
    expect((mcpDefaultName as any)?.toolName).toBe('MCPTool');
    expect((mcpDefaultName as any)?.input?.input).toEqual({ x: 1 });

    expect(
      __TEST_ONLY__.buildToolEventFromItem({ id: 'unknown-1', type: 'unknown_type' }),
    ).toBeNull();
  });

  it('should cover readFileText catch branch when file metadata read fails', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-read-catch-'));
    const filePath = path.join(cwd, 'a.txt');
    fs.writeFileSync(filePath, 'x');

    const statSpy = vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
      throw new Error('stat-failed');
    });
    expect(__TEST_ONLY__.readFileText(filePath)).toEqual({
      exists: true,
      content: '[unable to read file content]',
    });
    statSpy.mockRestore();
  });

  it('should cover cleanupTempFiles catch and dynamic sdk ctor loading branch', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-cleanup-'));
    const tempFile = path.join(tmp, 'a.txt');
    fs.writeFileSync(tempFile, 'x');

    const unlinkSpy = vi
      .spyOn(fs, 'unlinkSync')
      .mockImplementationOnce(() => {
        throw new Error('unlink-failed');
      });
    expect(() => __TEST_ONLY__.cleanupTempFiles([tempFile])).not.toThrow();
    unlinkSpy.mockRestore();

    const OriginalFunction = globalThis.Function;
    try {
      __TEST_ONLY__.resetCaches();
      (globalThis as any).Function = vi.fn(() => {
        return async () => ({
          Codex: class FakeCodex {},
        });
      });
      const ctor = await __TEST_ONLY__.getCodexSDKCtor();
      expect(typeof ctor).toBe('function');

      __TEST_ONLY__.resetCaches();
      (globalThis as any).Function = vi.fn(() => {
        return async () => ({
          default: { Codex: class DefaultCodex {} },
        });
      });
      const defaultObjectCtor = await __TEST_ONLY__.getCodexSDKCtor();
      expect(typeof defaultObjectCtor).toBe('function');

      __TEST_ONLY__.resetCaches();
      (globalThis as any).Function = vi.fn(() => {
        return async () => ({
          default: class DefaultCtor {},
        });
      });
      const defaultCtor = await __TEST_ONLY__.getCodexSDKCtor();
      expect(typeof defaultCtor).toBe('function');
    } finally {
      (globalThis as any).Function = OriginalFunction;
    }
  });

  it('should cover findCodexCli cache and fallback path probing branches', () => {
    __TEST_ONLY__.resetCaches();
    const first = __TEST_ONLY__.findCodexCli();
    const second = __TEST_ONLY__.findCodexCli();
    expect(second).toBe(first);

    __TEST_ONLY__.resetCaches();
    const oldPath = process.env.PATH;
    const oldHome = process.env.HOME;
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-home-'));
    const fallbackPath = path.join(fakeHome, '.npm-global', 'bin', 'codex');
    fs.mkdirSync(path.dirname(fallbackPath), { recursive: true });
    fs.writeFileSync(fallbackPath, '#!/bin/sh\necho codex');
    process.env.PATH = '';
    process.env.HOME = fakeHome;
    const discovered = __TEST_ONLY__.findCodexCli();
    expect(discovered).toBe(fallbackPath);
    process.env.PATH = oldPath;
    process.env.HOME = oldHome;
  });

  it('should cover findCodexCli win32 command and empty HOME fallbacks', () => {
    __TEST_ONLY__.resetCaches();
    const oldPath = process.env.PATH;
    const oldHome = process.env.HOME;
    const platformDesc = Object.getOwnPropertyDescriptor(process, 'platform');
    process.env.PATH = '';
    delete process.env.HOME;
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'win32',
    });
    const discovered = __TEST_ONLY__.findCodexCli();
    expect(discovered).toBeNull();
    process.env.PATH = oldPath;
    process.env.HOME = oldHome;
    if (platformDesc) {
      Object.defineProperty(process, 'platform', platformDesc);
    }
  });

  it('should cover sdk event deltas for non-prefix updates and non-agent items', async () => {
    const sent: any[] = [];
    const fakeThread = {
      id: 'sid-extra',
      interrupt: vi.fn(),
      runStreamed: vi.fn(async () => ({
        events: (async function* () {
          yield {
            type: 'item.updated',
            item: { id: 'm1', type: 'agent_message', text: 'hello' },
          };
          yield {
            type: 'item.updated',
            item: { id: 'm1', type: 'agent_message', text: 'alt-text' },
          };
          yield {
            type: 'item.updated',
            item: { id: 'cmd-extra', type: 'command_execution', command: 'pwd' },
          };
          yield {
            type: 'item.completed',
            item: { id: 'm1', type: 'agent_message', text: 'done-text' },
          };
        })(),
      })),
    };

    class FakeCodexSDK {
      async startThread() {
        return fakeThread;
      }
    }
    __TEST_ONLY__.setCodexSDKCtor(FakeCodexSDK, '@openai/codex-sdk');

    await __TEST_ONLY__.queryViaSdk(
      'prompt',
      process.cwd(),
      {} as any,
      undefined,
      (data: any) => sent.push(data),
      () => false,
      [],
    );

    const textPayloads = sent.filter((item) => item?.type === 'text').map((item) => item.content);
    expect(textPayloads).toContain('alt-text');
    expect(textPayloads).toContain('done-text');
    expect(sent.some((item) => item?.type === 'tool_start' && item.toolId === 'cmd-extra')).toBe(
      true,
    );
  });

  it('should cover sdk iterable fallback and unknown tool item events', async () => {
    const sent: any[] = [];
    const fakeThread = {
      id: 'sid-stream-fallback',
      interrupt: vi.fn(),
      runStreamed: vi.fn(async () =>
        (async function* () {
          yield { type: 'item.started', item: { type: 'unknown_item' } };
          yield {
            type: 'item.completed',
            item: { id: 'm-no-prev', type: 'agent_message', text: 'fresh-complete' },
          };
        })(),
      ),
    };
    class FakeCodexSDK {
      async startThread() {
        return fakeThread;
      }
    }
    __TEST_ONLY__.setCodexSDKCtor(FakeCodexSDK, '@openai/codex-sdk');

    await __TEST_ONLY__.queryViaSdk(
      'prompt',
      process.cwd(),
      {} as any,
      undefined,
      (data: any) => sent.push(data),
      () => false,
      [],
    );

    expect(sent.some((item) => item?.type === 'text' && item.content === 'fresh-complete')).toBe(
      true,
    );
  });

  it('should cover getItemText null branch', () => {
    expect(__TEST_ONLY__.getItemText(null as any)).toBe('');
  });
});
