import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getServerStartupLockPath,
  releaseServerStartupLock,
  tryAcquireServerStartupLock,
} from '@/core/src/server/server-lock';
import type { RecordInfo } from '@/core/src/shared/type';

describe('server startup lock', () => {
  let testDir: string;
  let record: RecordInfo;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inspector-lock-test-'));
    vi.spyOn(process, 'cwd').mockReturnValue(testDir);
    record = { port: 0, entry: '', output: testDir };
  });

  afterEach(() => {
    const lockPath = getServerStartupLockPath(record);
    fs.rmSync(lockPath, { force: true });
    fs.rmSync(testDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('allows only one owner at a time', () => {
    const first = tryAcquireServerStartupLock(record);

    expect(first).toBeDefined();
    expect(tryAcquireServerStartupLock(record)).toBeUndefined();

    releaseServerStartupLock(first!);
    expect(tryAcquireServerStartupLock(record)).toBeDefined();
  });

  it('recovers a lock owned by a dead process', () => {
    const lockPath = getServerStartupLockPath(record);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(
      lockPath,
      JSON.stringify({ pid: 2147483647, createdAt: Date.now(), token: 'dead' }),
    );

    const lock = tryAcquireServerStartupLock(record);

    expect(lock).toBeDefined();
    expect(lock?.token).not.toBe('dead');
  });

  it('does not reclaim a newly created lock before its content is written', () => {
    const lockPath = getServerStartupLockPath(record);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.closeSync(fs.openSync(lockPath, 'wx'));

    expect(tryAcquireServerStartupLock(record)).toBeUndefined();
    expect(fs.existsSync(lockPath)).toBe(true);
  });

  it('does not let a previous owner release a replacement lock', () => {
    const first = tryAcquireServerStartupLock(record)!;
    fs.rmSync(first.path, { force: true });
    const replacement = tryAcquireServerStartupLock(record)!;

    releaseServerStartupLock(first);

    expect(fs.existsSync(replacement.path)).toBe(true);
  });
});
