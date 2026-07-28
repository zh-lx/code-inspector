import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  __TEST_ONLY__,
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
    fs.rmSync(path.dirname(lockPath), { recursive: true, force: true });
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

  it('rejects invalid lock metadata and handles missing stale locks', () => {
    const lockPath = getServerStartupLockPath(record);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid }));

    expect(__TEST_ONLY__.readServerStartupLock(lockPath)).toBeUndefined();
    fs.rmSync(lockPath);
    expect(__TEST_ONLY__.isStaleServerStartupLock(lockPath)).toBe(true);
  });

  it('handles lock removal filesystem failures', () => {
    const lock = tryAcquireServerStartupLock(record)!;
    const unlinkSync = vi
      .spyOn(fs, 'unlinkSync')
      .mockImplementationOnce(() => {
        throw new Error('unlink failed');
      });

    expect(
      __TEST_ONLY__.removeServerStartupLock(lock.path, lock.token),
    ).toBe(false);
    unlinkSync.mockRestore();
    releaseServerStartupLock(lock);
  });

  it('validates live, dead, malformed, and missing recovery owners', () => {
    const lockPath = getServerStartupLockPath(record);
    const recoveryPath = __TEST_ONLY__.getRecoveryPath(lockPath);
    const ownerPath = path.join(recoveryPath, 'owner.json');
    fs.mkdirSync(recoveryPath, { recursive: true });
    fs.writeFileSync(
      ownerPath,
      JSON.stringify({ pid: process.pid, createdAt: Date.now(), token: 'live' }),
    );

    expect(__TEST_ONLY__.isStaleRecovery(recoveryPath)).toBe(false);
    fs.writeFileSync(
      ownerPath,
      JSON.stringify({
        pid: 2147483647,
        createdAt: Date.now(),
        token: 'dead',
      }),
    );
    expect(__TEST_ONLY__.isStaleRecovery(recoveryPath)).toBe(true);

    fs.writeFileSync(ownerPath, JSON.stringify({ pid: process.pid }));
    expect(
      __TEST_ONLY__.readServerStartupLockRecovery(recoveryPath),
    ).toBeUndefined();
    expect(__TEST_ONLY__.isStaleRecovery(recoveryPath)).toBe(false);

    fs.writeFileSync(ownerPath, '{invalid');
    expect(
      __TEST_ONLY__.readServerStartupLockRecovery(recoveryPath),
    ).toBeUndefined();
    fs.rmSync(recoveryPath, { recursive: true });
    expect(__TEST_ONLY__.isStaleRecovery(recoveryPath)).toBe(true);
  });

  it('serializes recovery ownership and replaces stale recovery metadata', () => {
    const lockPath = getServerStartupLockPath(record);
    const recoveryPath = __TEST_ONLY__.getRecoveryPath(lockPath);
    const ownerPath = path.join(recoveryPath, 'owner.json');
    fs.mkdirSync(recoveryPath, { recursive: true });
    fs.writeFileSync(
      ownerPath,
      JSON.stringify({ pid: process.pid, createdAt: Date.now(), token: 'live' }),
    );
    expect(__TEST_ONLY__.tryAcquireRecovery(lockPath)).toBeUndefined();

    fs.writeFileSync(ownerPath, '{invalid');
    const old = new Date(Date.now() - 60_000);
    fs.utimesSync(recoveryPath, old, old);
    const recovery = __TEST_ONLY__.tryAcquireRecovery(lockPath)!;
    expect(recovery).toBeDefined();
    expect(
      __TEST_ONLY__.removeRecovery(recovery.path, 'different-token'),
    ).toBe(false);

    const rmSync = vi.spyOn(fs, 'rmSync').mockImplementationOnce(() => {
      throw new Error('remove failed');
    });
    expect(
      __TEST_ONLY__.removeRecovery(recovery.path, recovery.token),
    ).toBe(false);
    rmSync.mockRestore();
    expect(
      __TEST_ONLY__.removeRecovery(recovery.path, recovery.token),
    ).toBe(true);
  });

  it('propagates unexpected recovery ownership errors', () => {
    const lockPath = getServerStartupLockPath(record);
    const error = Object.assign(new Error('recovery denied'), {
      code: 'EACCES',
    });
    vi.spyOn(fs, 'mkdirSync').mockImplementationOnce(() => {
      throw error;
    });

    expect(() => __TEST_ONLY__.tryAcquireRecovery(lockPath)).toThrow(
      'recovery denied',
    );
  });

  it('stops after two stale recovery ownership races', () => {
    const lockPath = getServerStartupLockPath(record);
    vi.spyOn(fs, 'mkdirSync').mockImplementation(() => {
      throw Object.assign(new Error('exists'), { code: 'EEXIST' });
    });

    expect(__TEST_ONLY__.tryAcquireRecovery(lockPath)).toBeUndefined();
  });

  it('does not reclaim a valid lock without an observed owner token', () => {
    const lockPath = getServerStartupLockPath(record);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(
      lockPath,
      JSON.stringify({ pid: process.pid, createdAt: Date.now(), token: 'live' }),
    );

    expect(
      __TEST_ONLY__.reclaimServerStartupLock(lockPath),
    ).toBe(false);
    expect(fs.existsSync(lockPath)).toBe(true);
  });

  it('does not reclaim while another process owns recovery', () => {
    const lockPath = getServerStartupLockPath(record);
    const recoveryPath = __TEST_ONLY__.getRecoveryPath(lockPath);
    fs.mkdirSync(recoveryPath, { recursive: true });
    fs.writeFileSync(
      path.join(recoveryPath, 'owner.json'),
      JSON.stringify({
        pid: process.pid,
        createdAt: Date.now(),
        token: 'live-recovery',
      }),
    );

    expect(__TEST_ONLY__.reclaimServerStartupLock(lockPath)).toBe(false);
  });

  it('keeps a fresh malformed lock when reclaiming without metadata', () => {
    const lockPath = getServerStartupLockPath(record);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(lockPath, '');

    expect(__TEST_ONLY__.reclaimServerStartupLock(lockPath)).toBe(false);
    expect(fs.existsSync(lockPath)).toBe(true);
  });

  it('treats a lock removed during unlink as reclaimed', () => {
    const lockPath = getServerStartupLockPath(record);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(
      lockPath,
      JSON.stringify({ pid: 2147483647, createdAt: Date.now(), token: 'dead' }),
    );
    const observed = __TEST_ONLY__.readServerStartupLock(lockPath)!;
    vi.spyOn(fs, 'unlinkSync').mockImplementationOnce(() => {
      throw Object.assign(new Error('already removed'), { code: 'ENOENT' });
    });

    expect(
      __TEST_ONLY__.reclaimServerStartupLock(lockPath, observed),
    ).toBe(true);
  });

  it('retries acquisition when the stale lock disappears during recovery', () => {
    const lockPath = getServerStartupLockPath(record);
    const openSync = vi
      .spyOn(fs, 'openSync')
      .mockImplementationOnce(() => {
        throw Object.assign(new Error('lock disappeared'), { code: 'EEXIST' });
      });

    const lock = tryAcquireServerStartupLock(record);

    expect(lock).toBeDefined();
    expect(fs.existsSync(lockPath)).toBe(true);
    expect(openSync).toHaveBeenCalledTimes(2);
    openSync.mockRestore();
  });

  it('handles a filesystem failure while reclaiming a dead lock', () => {
    const lockPath = getServerStartupLockPath(record);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(
      lockPath,
      JSON.stringify({ pid: 2147483647, createdAt: Date.now(), token: 'dead' }),
    );
    const observed = __TEST_ONLY__.readServerStartupLock(lockPath)!;
    const unlinkSync = vi.spyOn(fs, 'unlinkSync').mockImplementationOnce(() => {
      throw new Error('unlink failed');
    });

    expect(
      __TEST_ONLY__.reclaimServerStartupLock(lockPath, observed),
    ).toBe(false);
    unlinkSync.mockRestore();
  });

  it('does not acquire while another process owns recovery', () => {
    const lockPath = getServerStartupLockPath(record);
    const recoveryPath = __TEST_ONLY__.getRecoveryPath(lockPath);
    fs.mkdirSync(recoveryPath, { recursive: true });
    fs.writeFileSync(
      path.join(recoveryPath, 'owner.json'),
      JSON.stringify({ pid: process.pid, createdAt: Date.now(), token: 'live' }),
    );

    expect(tryAcquireServerStartupLock(record)).toBeUndefined();
  });

  it('propagates unexpected lock creation errors', () => {
    const error = Object.assign(new Error('denied'), { code: 'EACCES' });
    vi.spyOn(fs, 'openSync').mockImplementationOnce(() => {
      throw error;
    });

    expect(() => tryAcquireServerStartupLock(record)).toThrow('denied');
  });

  it('stops after two concurrent stale locks are reclaimed', () => {
    const lockPath = getServerStartupLockPath(record);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    const writeDeadLock = (token: string) =>
      fs.writeFileSync(
        lockPath,
        JSON.stringify({ pid: 2147483647, createdAt: Date.now(), token }),
      );
    writeDeadLock('first');
    const openSync = fs.openSync.bind(fs);
    let attempts = 0;
    vi.spyOn(fs, 'openSync').mockImplementation(((file, flags, mode) => {
      if (String(file) === lockPath) {
        attempts += 1;
        if (attempts === 2) writeDeadLock('second');
        throw Object.assign(new Error('exists'), { code: 'EEXIST' });
      }
      return openSync(file, flags, mode);
    }) as typeof fs.openSync);

    expect(tryAcquireServerStartupLock(record)).toBeUndefined();
    expect(attempts).toBe(2);
  });
});
