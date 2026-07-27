import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  findPort,
  setProjectRecord,
} from '@/core/src/shared/record-cache';
import { getRuntimeDirectory } from '@/core/src/shared/runtime-path';
import type { RecordInfo } from '@/core/src/shared/type';

describe('findPort', () => {
  let output: string;
  let record: RecordInfo;

  beforeEach(() => {
    output = fs.mkdtempSync(path.join(os.tmpdir(), 'inspector-find-port-'));
    vi.spyOn(process, 'cwd').mockReturnValue(output);
    record = { port: 0, entry: '', output };
  });

  afterEach(() => {
    fs.rmSync(getRuntimeDirectory(output), { recursive: true, force: true });
    fs.rmSync(output, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('returns a published server port', async () => {
    setProjectRecord(record, 'port', 5678);

    await expect(findPort(record, 100)).resolves.toBe(5678);
  });

  it('waits for another process to publish the port', async () => {
    const promise = findPort(record, 500);
    setTimeout(() => setProjectRecord(record, 'port', 6789), 50);

    await expect(promise).resolves.toBe(6789);
  });

  it('fails after a finite timeout', async () => {
    await expect(findPort(record, 50)).rejects.toThrow(
      'Timed out waiting for the code-inspector server port.',
    );
  });
});
