import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getProjectRecord,
  resetFileRecord,
  setProjectRecord,
} from '@/core/src/shared/record-cache';
import {
  getBuildStateFilePath,
  getRuntimeDirectory,
} from '@/core/src/shared/runtime-path';
import type { RecordInfo } from '@/core/src/shared/type';

describe('resetFileRecord', () => {
  let output: string;
  let record: RecordInfo;

  beforeEach(() => {
    output = fs.mkdtempSync(path.join(os.tmpdir(), 'inspector-record-reset-'));
    vi.spyOn(process, 'cwd').mockReturnValue(output);
    record = { port: 0, entry: '', output };
  });

  afterEach(() => {
    fs.rmSync(getRuntimeDirectory(output), { recursive: true, force: true });
    fs.rmSync(output, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('creates an empty build state', () => {
    resetFileRecord(output);

    expect(
      JSON.parse(fs.readFileSync(getBuildStateFilePath(output), 'utf-8')),
    ).toEqual({ entry: '' });
  });

  it('resets build fields without clearing a live server', () => {
    setProjectRecord(record, 'entry', '/project/src/main.ts');
    setProjectRecord(record, 'injectTo', ['/project/src/app.ts']);
    setProjectRecord(record, 'port', 5678);

    resetFileRecord(output);

    expect(getProjectRecord(record)).toEqual({
      previousPort: 5678,
      entry: '',
      port: 5678,
    });
  });
});
