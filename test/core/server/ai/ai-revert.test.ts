import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { handleAIRevertRequest } from '@/core/src/server/ai';

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
  const res = {
    writeHead: vi.fn(),
    end: vi.fn((chunk?: string) => {
      if (chunk) chunks.push(chunk);
    }),
  } as any;
  return { res, chunks };
}

describe('ai revert handler', () => {
  it('should return 400 for invalid JSON body', async () => {
    const req = createMockReq('{bad-json');
    const { res, chunks } = createMockRes();

    await handleAIRevertRequest(req, res, { a: 'b' }, '/project');

    expect(res.writeHead).toHaveBeenCalledWith(400, {
      a: 'b',
      'Content-Type': 'application/json',
    });
    expect(chunks.join('')).toBe(JSON.stringify({ error: 'Invalid JSON' }));
  });

  it('should return 400 when no edits provided', async () => {
    const req = createMockReq(JSON.stringify({ edits: [] }));
    const { res, chunks } = createMockRes();

    await handleAIRevertRequest(req, res, {}, '/project');

    expect(res.writeHead).toHaveBeenCalledWith(
      400,
      expect.objectContaining({ 'Content-Type': 'application/json' }),
    );
    expect(chunks.join('')).toBe(JSON.stringify({ error: 'No edits provided' }));
  });

  it('should revert when file content equals new_string', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-revert-'));
    const filePath = path.join(cwd, 'a.txt');
    fs.writeFileSync(filePath, 'NEW');

    const req = createMockReq(
      JSON.stringify({
        edits: [{ file_path: 'a.txt', old_string: 'OLD', new_string: 'NEW' }],
      }),
    );
    const { res, chunks } = createMockRes();

    await handleAIRevertRequest(req, res, {}, cwd);

    expect(res.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({ 'Content-Type': 'application/json' }),
    );
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('OLD');
    expect(JSON.parse(chunks.join(''))).toEqual({
      results: [{ file_path: 'a.txt', success: true }],
    });
  });

  it('should revert by replacing new_string when contained in file', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-revert-'));
    const filePath = path.join(cwd, 'b.txt');
    fs.writeFileSync(filePath, 'prefix NEW suffix');

    const req = createMockReq(
      JSON.stringify({
        edits: [{ file_path: 'b.txt', old_string: 'OLD', new_string: 'NEW' }],
      }),
    );
    const { res, chunks } = createMockRes();

    await handleAIRevertRequest(req, res, {}, cwd);

    expect(res.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({ 'Content-Type': 'application/json' }),
    );
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('prefix OLD suffix');
    expect(JSON.parse(chunks.join(''))).toEqual({
      results: [{ file_path: 'b.txt', success: true }],
    });
  });

  it('should return content_mismatch when new_string cannot be found', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-revert-'));
    const filePath = path.join(cwd, 'c.txt');
    fs.writeFileSync(filePath, 'CURRENT');

    const req = createMockReq(
      JSON.stringify({
        edits: [{ file_path: 'c.txt', old_string: 'OLD', new_string: 'NEW' }],
      }),
    );
    const { res, chunks } = createMockRes();

    await handleAIRevertRequest(req, res, {}, cwd);

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('CURRENT');
    expect(JSON.parse(chunks.join(''))).toEqual({
      results: [{ file_path: 'c.txt', success: false, error: 'content_mismatch' }],
    });
  });

  it('should reject edits outside project root', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-revert-root-'));
    const outside = path.join(os.tmpdir(), `ai-revert-outside-${Date.now()}.txt`);
    fs.writeFileSync(outside, 'NEW');

    const req = createMockReq(
      JSON.stringify({
        edits: [{ file_path: outside, old_string: 'OLD', new_string: 'NEW' }],
      }),
    );
    const { res, chunks } = createMockRes();

    await handleAIRevertRequest(req, res, {}, cwd);

    expect(fs.readFileSync(outside, 'utf-8')).toBe('NEW');
    expect(JSON.parse(chunks.join(''))).toEqual({
      results: [{ file_path: outside, success: false, error: 'outside_project' }],
    });
  });

  it('should return file_not_found when target file is missing', async () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-revert-'));
    const req = createMockReq(
      JSON.stringify({
        edits: [
          { file_path: 'missing.txt', old_string: 'OLD', new_string: 'NEW' },
        ],
      }),
    );
    const { res, chunks } = createMockRes();

    await handleAIRevertRequest(req, res, {}, cwd);

    expect(JSON.parse(chunks.join(''))).toEqual({
      results: [
        { file_path: 'missing.txt', success: false, error: 'file_not_found' },
      ],
    });
  });
});
