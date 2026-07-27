import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getProjectRecord,
  setProjectRecord,
} from '@/core/src/shared/record-cache';
import { getRuntimeDirectory } from '@/core/src/shared/runtime-path';
import type { RecordInfo } from '@/core/src/shared/type';

describe('getProjectRecord', () => {
  let output: string;
  let record: RecordInfo;

  beforeEach(() => {
    output = fs.mkdtempSync(path.join(os.tmpdir(), 'inspector-record-read-'));
    vi.spyOn(process, 'cwd').mockReturnValue(output);
    record = { port: 0, entry: '', output };
  });

  afterEach(() => {
    fs.rmSync(getRuntimeDirectory(output), { recursive: true, force: true });
    fs.rmSync(output, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('returns undefined when no state exists', () => {
    expect(getProjectRecord(record)).toBeUndefined();
  });

  it('returns build state', () => {
    setProjectRecord(record, 'entry', '/project/src/main.ts');

    expect(getProjectRecord(record)).toEqual({
      entry: '/project/src/main.ts',
    });
  });

  it('merges build and server state', () => {
    setProjectRecord(record, 'entry', '/project/src/main.ts');
    setProjectRecord(record, 'port', 5678);

    expect(getProjectRecord(record)).toEqual({
      entry: '/project/src/main.ts',
      port: 5678,
    });
  });
});
