import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getProjectRecord,
  setProjectRecord,
  updateProjectRecord,
} from '@/core/src/shared/record-cache';
import {
  getBuildStateFilePath,
  getRuntimeDirectory,
} from '@/core/src/shared/runtime-path';
import { getServerRuntimeState } from '@/core/src/shared/server-state';
import type { RecordInfo } from '@/core/src/shared/type';

describe('project record updates', () => {
  let output: string;
  let record: RecordInfo;

  beforeEach(() => {
    output = fs.mkdtempSync(path.join(os.tmpdir(), 'inspector-record-test-'));
    vi.spyOn(process, 'cwd').mockReturnValue(output);
    record = { port: 0, entry: '', output };
  });

  afterEach(() => {
    fs.rmSync(getRuntimeDirectory(output), { recursive: true, force: true });
    fs.rmSync(output, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('writes build fields to build-state.json', () => {
    setProjectRecord(record, 'entry', '/project/src/main.ts');

    expect(
      JSON.parse(fs.readFileSync(getBuildStateFilePath(output), 'utf-8')),
    ).toEqual({ entry: '/project/src/main.ts' });
  });

  it('updates several build fields atomically', () => {
    updateProjectRecord(record, {
      entry: '/project/src/main.ts',
      injectTo: ['/project/src/app.ts'],
    });

    expect(getProjectRecord(record)).toEqual({
      entry: '/project/src/main.ts',
      injectTo: ['/project/src/app.ts'],
    });
  });

  it('stores the server port separately from build state', () => {
    setProjectRecord(record, 'entry', '/project/src/main.ts');
    setProjectRecord(record, 'port', 5678);

    expect(getServerRuntimeState(record)?.port).toBe(5678);
    expect(
      JSON.parse(fs.readFileSync(getBuildStateFilePath(output), 'utf-8')),
    ).toEqual({ entry: '/project/src/main.ts' });
    expect(getProjectRecord(record)).toEqual({
      entry: '/project/src/main.ts',
      port: 5678,
    });
  });

  it('clears server state without changing build state', () => {
    updateProjectRecord(record, { entry: '/project/src/main.ts', port: 5678 });

    updateProjectRecord(record, { port: undefined });

    expect(getServerRuntimeState(record)).toBeUndefined();
    expect(getProjectRecord(record)).toEqual({ entry: '/project/src/main.ts' });
  });
});
