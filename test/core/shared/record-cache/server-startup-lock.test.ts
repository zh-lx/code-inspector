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

  it('does not reclaim an old lock while its owner is still running', () => {
    const lockPath = getServerStartupLockPath(record);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(
      lockPath,
      JSON.stringify({
        pid: process.pid,
        createdAt: Date.now() - 60_000,
        token: 'live',
      }),
    );

    expect(tryAcquireServerStartupLock(record)).toBeUndefined();
    expect(JSON.parse(fs.readFileSync(lockPath, 'utf-8')).token).toBe('live');
  });

  it('recovers an old malformed lock without deleting a replacement', () => {
    const lockPath = getServerStartupLockPath(record);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(lockPath, '');
    const old = new Date(Date.now() - 60_000);
    fs.utimesSync(lockPath, old, old);

    expect(tryAcquireServerStartupLock(record)).toBeDefined();
  });

  it('rechecks lock ownership after acquiring recovery ownership', () => {
    const lockPath = getServerStartupLockPath(record);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(
      lockPath,
      JSON.stringify({ pid: 2147483647, createdAt: Date.now(), token: 'dead' }),
    );
    const mkdirSync = fs.mkdirSync.bind(fs);
    vi.spyOn(fs, 'mkdirSync').mockImplementation(((directory: fs.PathLike) => {
      const result = mkdirSync(directory);
      if (String(directory).endsWith('.recovery')) {
        fs.writeFileSync(
          lockPath,
          JSON.stringify({
            pid: process.pid,
            createdAt: Date.now(),
            token: 'replacement',
          }),
        );
      }
      return result;
    }) as typeof fs.mkdirSync);

    expect(tryAcquireServerStartupLock(record)).toBeUndefined();
    expect(JSON.parse(fs.readFileSync(lockPath, 'utf-8')).token).toBe(
      'replacement',
    );
  });

  it('does not let a previous owner release a replacement lock', () => {
    const first = tryAcquireServerStartupLock(record)!;
    fs.rmSync(first.path, { force: true });
    const replacement = tryAcquireServerStartupLock(record)!;

    releaseServerStartupLock(first);

    expect(fs.existsSync(replacement.path)).toBe(true);
  });
});
