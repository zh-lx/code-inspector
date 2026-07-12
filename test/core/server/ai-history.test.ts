import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import {
  handleAIHistoryDeleteRequest,
  handleAIHistoryListRequest,
  handleAIHistoryLoadRequest,
  handleAIHistorySaveRequest,
} from '@/core/src/ai/server/ai-history';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
};

function createProjectRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'code-inspector-history-'));
}

function createReq(body: string) {
  return Readable.from([body]) as any;
}

function createRes() {
  return {
    writeHead: vi.fn(),
    end: vi.fn(),
  } as any;
}

function parseEnd(res: ReturnType<typeof createRes>) {
  return JSON.parse(res.end.mock.calls[0][0]);
}

describe('ai history persistence', () => {
  const roots: string[] = [];
  const originalCwd = process.cwd();

  afterEach(() => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    for (const root of roots.splice(0)) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should save, list, load and delete conversations', async () => {
    const root = createProjectRoot();
    roots.push(root);

    const saveRes = createRes();
    await handleAIHistorySaveRequest(
      createReq(
        JSON.stringify({
          id: 'conv-1',
          messages: [
            {
              role: 'user',
              content:
                'This is a long question that should be used as a title and truncated after eighty characters in the history index.',
            },
            { role: 'assistant', content: 'answer' },
          ],
          context: { file: 'src/a.ts' },
          sessionId: 'sid-1',
          provider: 'codex',
          model: 'gpt-5-codex',
          revertedToolIds: ['tool-1'],
        }),
      ),
      saveRes,
      corsHeaders,
      root,
    );

    expect(saveRes.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({ 'Content-Type': 'application/json' }),
    );
    expect(parseEnd(saveRes)).toEqual({ id: 'conv-1', success: true });

    const listRes = createRes();
    await handleAIHistoryListRequest(listRes, corsHeaders, root, 0);
    const listPayload = parseEnd(listRes);
    expect(listPayload.conversations).toHaveLength(1);
    expect(listPayload.conversations[0]).toMatchObject({
      id: 'conv-1',
      provider: 'codex',
      messageCount: 2,
    });
    expect(listPayload.conversations[0].title.endsWith('...')).toBe(true);

    const loadRes = createRes();
    await handleAIHistoryLoadRequest(
      createReq(JSON.stringify({ id: 'conv-1' })),
      loadRes,
      corsHeaders,
      root,
    );
    expect(parseEnd(loadRes)).toMatchObject({
      sessionId: 'sid-1',
      provider: 'codex',
      model: 'gpt-5-codex',
      revertedToolIds: ['tool-1'],
    });

    const deleteRes = createRes();
    await handleAIHistoryDeleteRequest(
      createReq(JSON.stringify({ id: 'conv-1' })),
      deleteRes,
      corsHeaders,
      root,
    );
    expect(parseEnd(deleteRes)).toEqual({ success: true });

    const missingRes = createRes();
    await handleAIHistoryLoadRequest(
      createReq(JSON.stringify({ id: 'conv-1' })),
      missingRes,
      corsHeaders,
      root,
    );
    expect(parseEnd(missingRes)).toEqual({ error: 'not_found' });
  });

  it('should use process cwd when project root is empty', async () => {
    const root = createProjectRoot();
    roots.push(root);
    process.chdir(root);

    const res = createRes();
    await handleAIHistoryListRequest(res, corsHeaders, '', 0);

    expect(parseEnd(res)).toEqual({ conversations: [] });
    expect(
      fs.existsSync(path.join(root, 'node_modules', '.code-inspector')),
    ).toBe(true);
  });

  it('should save generated ids and default conversation fields', async () => {
    const root = createProjectRoot();
    roots.push(root);
    vi.spyOn(Date, 'now').mockReturnValueOnce(1234).mockReturnValueOnce(5678);

    const saveRes = createRes();
    await handleAIHistorySaveRequest(
      createReq(JSON.stringify({ messages: 'not-array' })),
      saveRes,
      corsHeaders,
      root,
    );

    expect(parseEnd(saveRes)).toEqual({ id: '1234', success: true });

    const dir = path.join(root, 'node_modules', '.code-inspector');
    expect(
      JSON.parse(fs.readFileSync(path.join(dir, '1234.json'), 'utf-8')),
    ).toEqual({
      messages: [],
      context: null,
      sessionId: null,
      provider: null,
      model: '',
      revertedToolIds: [],
    });
    expect(
      JSON.parse(fs.readFileSync(path.join(dir, 'history-index.json'), 'utf-8')),
    ).toEqual({
      '1234': {
        id: '1234',
        title: '',
        createdAt: 5678,
        updatedAt: 5678,
        provider: null,
        messageCount: 0,
      },
    });
  });

  it('should extract short titles and preserve created time when updating', async () => {
    const root = createProjectRoot();
    roots.push(root);
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2000);

    const firstSave = createRes();
    await handleAIHistorySaveRequest(
      createReq(
        JSON.stringify({
          id: 'same-id',
          messages: [
            { role: 'assistant', content: 'ignored' },
            { role: 'user', content: ' Short title ' },
          ],
        }),
      ),
      firstSave,
      corsHeaders,
      root,
    );
    expect(parseEnd(firstSave)).toEqual({ id: 'same-id', success: true });

    const secondSave = createRes();
    await handleAIHistorySaveRequest(
      createReq(
        JSON.stringify({
          id: 'same-id',
          messages: [{ role: 'user', content: ' Updated title ' }],
        }),
      ),
      secondSave,
      corsHeaders,
      root,
    );
    expect(parseEnd(secondSave)).toEqual({ id: 'same-id', success: true });

    const index = JSON.parse(
      fs.readFileSync(
        path.join(root, 'node_modules', '.code-inspector', 'history-index.json'),
        'utf-8',
      ),
    );
    expect(index['same-id']).toMatchObject({
      title: 'Updated title',
      createdAt: 1000,
      updatedAt: 2000,
      provider: null,
      messageCount: 1,
    });
  });

  it('should reject invalid request bodies and unsafe ids', async () => {
    const root = createProjectRoot();
    roots.push(root);

    const invalidSave = createRes();
    await handleAIHistorySaveRequest(
      createReq('{bad-json}'),
      invalidSave,
      corsHeaders,
      root,
    );
    expect(invalidSave.writeHead).toHaveBeenCalledWith(
      400,
      expect.any(Object),
    );
    expect(parseEnd(invalidSave)).toEqual({ error: 'Invalid JSON' });

    const unsafeSave = createRes();
    await handleAIHistorySaveRequest(
      createReq(JSON.stringify({ id: '../bad' })),
      unsafeSave,
      corsHeaders,
      root,
    );
    expect(parseEnd(unsafeSave)).toEqual({ error: 'invalid_id' });

    const invalidLoad = createRes();
    await handleAIHistoryLoadRequest(
      createReq('{bad-json}'),
      invalidLoad,
      corsHeaders,
      root,
    );
    expect(parseEnd(invalidLoad)).toEqual({ error: 'Invalid JSON' });

    const missingLoad = createRes();
    await handleAIHistoryLoadRequest(
      createReq(JSON.stringify({})),
      missingLoad,
      corsHeaders,
      root,
    );
    expect(parseEnd(missingLoad)).toEqual({ error: 'missing_id' });

    const unsafeLoad = createRes();
    await handleAIHistoryLoadRequest(
      createReq(JSON.stringify({ id: '..' })),
      unsafeLoad,
      corsHeaders,
      root,
    );
    expect(parseEnd(unsafeLoad)).toEqual({ error: 'invalid_id' });

    const invalidDelete = createRes();
    await handleAIHistoryDeleteRequest(
      createReq('{bad-json}'),
      invalidDelete,
      corsHeaders,
      root,
    );
    expect(parseEnd(invalidDelete)).toEqual({ error: 'Invalid JSON' });

    const missingDelete = createRes();
    await handleAIHistoryDeleteRequest(
      createReq(JSON.stringify({})),
      missingDelete,
      corsHeaders,
      root,
    );
    expect(parseEnd(missingDelete)).toEqual({ error: 'missing_id' });

    const unsafeDelete = createRes();
    await handleAIHistoryDeleteRequest(
      createReq(JSON.stringify({ id: 'a/b' })),
      unsafeDelete,
      corsHeaders,
      root,
    );
    expect(parseEnd(unsafeDelete)).toEqual({ error: 'invalid_id' });
  });

  it('should cleanup expired conversations when listing history', async () => {
    const root = createProjectRoot();
    roots.push(root);
    const dir = path.join(root, 'node_modules', '.code-inspector');
    fs.mkdirSync(dir, { recursive: true });

    const now = Date.now();
    fs.writeFileSync(
      path.join(dir, 'history-index.json'),
      JSON.stringify({
        old: {
          id: 'old',
          title: 'old',
          createdAt: now - 3 * 86400000,
          updatedAt: now - 3 * 86400000,
          provider: null,
          messageCount: 1,
        },
        fresh: {
          id: 'fresh',
          title: 'fresh',
          createdAt: now,
          updatedAt: now,
          provider: 'codex',
          messageCount: 1,
        },
      }),
    );
    fs.writeFileSync(path.join(dir, 'old.json'), '{}');
    fs.writeFileSync(path.join(dir, 'fresh.json'), '{}');

    const res = createRes();
    await handleAIHistoryListRequest(res, corsHeaders, root, 1);

    expect(parseEnd(res).conversations).toEqual([
      expect.objectContaining({ id: 'fresh' }),
    ]);
    expect(fs.existsSync(path.join(dir, 'old.json'))).toBe(false);
  });

  it('should tolerate corrupt indexes and cleanup unlink errors', async () => {
    const root = createProjectRoot();
    roots.push(root);
    const dir = path.join(root, 'node_modules', '.code-inspector');
    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, 'history-index.json'), '{bad-json}');
    const corruptRes = createRes();
    await handleAIHistoryListRequest(corruptRes, corsHeaders, root, 0);
    expect(parseEnd(corruptRes)).toEqual({ conversations: [] });

    const now = Date.now();
    fs.writeFileSync(
      path.join(dir, 'history-index.json'),
      JSON.stringify({
        old: {
          id: 'old',
          title: 'old',
          createdAt: now - 3 * 86400000,
          updatedAt: now - 3 * 86400000,
          provider: null,
          messageCount: 1,
        },
      }),
    );
    fs.writeFileSync(path.join(dir, 'old.json'), '{}');
    const unlinkSpy = vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {
      throw new Error('unlink failed');
    });

    const cleanupRes = createRes();
    await handleAIHistoryListRequest(cleanupRes, corsHeaders, root, 1);

    expect(unlinkSpy).toHaveBeenCalled();
    expect(parseEnd(cleanupRes)).toEqual({ conversations: [] });
  });

  it('should handle file system errors gracefully', async () => {
    const root = createProjectRoot();
    roots.push(root);

    vi.spyOn(fs, 'mkdirSync').mockImplementation(() => {
      throw new Error('mkdir failed');
    });

    const listRes = createRes();
    await handleAIHistoryListRequest(listRes, corsHeaders, root, 0);
    expect(parseEnd(listRes)).toEqual({ conversations: [] });

    const saveRes = createRes();
    await handleAIHistorySaveRequest(
      createReq(JSON.stringify({ id: 'conv-2', messages: [] })),
      saveRes,
      corsHeaders,
      root,
    );
    expect(parseEnd(saveRes)).toEqual({ error: 'write_error' });
  });

  it('should handle read and delete file errors gracefully', async () => {
    const root = createProjectRoot();
    roots.push(root);
    const dir = path.join(root, 'node_modules', '.code-inspector');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'bad.json'), '{bad-json}');

    const loadRes = createRes();
    await handleAIHistoryLoadRequest(
      createReq(JSON.stringify({ id: 'bad' })),
      loadRes,
      corsHeaders,
      root,
    );
    expect(parseEnd(loadRes)).toEqual({ error: 'read_error' });

    vi.spyOn(fs, 'unlinkSync').mockImplementation(() => {
      throw new Error('unlink failed');
    });
    const deleteRes = createRes();
    await handleAIHistoryDeleteRequest(
      createReq(JSON.stringify({ id: 'bad' })),
      deleteRes,
      corsHeaders,
      root,
    );
    expect(parseEnd(deleteRes)).toEqual({ error: 'delete_error' });
  });
});
