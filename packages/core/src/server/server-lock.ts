import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { RecordInfo } from '../shared/type';
import {
  ensureRuntimeDirectory,
  getRuntimeDirectory,
} from '../shared/runtime-path';

const STARTUP_LOCK_MAX_AGE_MS = 15_000;
const STARTUP_LOCK_RECOVERY_SUFFIX = '.recovery';

export interface ServerStartupLock {
  path: string;
  token: string;
}

interface ServerStartupLockMetadata {
  pid: number;
  createdAt: number;
  token: string;
}

export function getServerStartupLockPath(record: RecordInfo) {
  return path.join(getRuntimeDirectory(record.output), 'startup.lock');
}

function readServerStartupLock(
  lockPath: string,
): ServerStartupLockMetadata | undefined {
  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
    if (
      typeof lock?.pid !== 'number' ||
      typeof lock.createdAt !== 'number' ||
      typeof lock.token !== 'string'
    ) {
      return undefined;
    }
    return lock;
  } catch {
    return undefined;
  }
}

function isProcessRunning(pid: number) {
  try {
    // Signal 0 does not terminate the process; it only probes whether the PID exists.
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but the current user cannot signal it.
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function removeServerStartupLock(lockPath: string, token: string) {
  try {
    const current = readServerStartupLock(lockPath);
    // The lock may have been reclaimed and recreated; only its owner may remove it.
    if (current?.token !== token) {
      return false;
    }
    fs.unlinkSync(lockPath);
    return true;
  } catch {
    return false;
  }
}

function isStaleServerStartupLock(
  lockPath: string,
  lock?: ServerStartupLockMetadata,
) {
  if (!lock) {
    try {
      // An unreadable lock may still be in flight, so allow time before reclaiming it.
      return (
        Date.now() - fs.statSync(lockPath).mtimeMs > STARTUP_LOCK_MAX_AGE_MS
      );
    } catch {
      return true;
    }
  }
  return !isProcessRunning(lock.pid);
}

function getRecoveryPath(lockPath: string) {
  return `${lockPath}${STARTUP_LOCK_RECOVERY_SUFFIX}`;
}

function readServerStartupLockRecovery(
  recoveryPath: string,
): ServerStartupLockMetadata | undefined {
  try {
    const recovery = JSON.parse(
      fs.readFileSync(path.join(recoveryPath, 'owner.json'), 'utf-8'),
    );
    if (
      typeof recovery?.pid !== 'number' ||
      typeof recovery.createdAt !== 'number' ||
      typeof recovery.token !== 'string'
    ) {
      return undefined;
    }
    return recovery;
  } catch {
    return undefined;
  }
}

function isStaleRecovery(recoveryPath: string) {
  const recovery = readServerStartupLockRecovery(recoveryPath);
  if (recovery) {
    return !isProcessRunning(recovery.pid);
  }
  try {
    return (
      Date.now() - fs.statSync(recoveryPath).mtimeMs > STARTUP_LOCK_MAX_AGE_MS
    );
  } catch {
    return true;
  }
}

function removeRecovery(recoveryPath: string, token: string) {
  try {
    if (readServerStartupLockRecovery(recoveryPath)?.token !== token) {
      return false;
    }
    fs.rmSync(recoveryPath, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

function tryAcquireRecovery(lockPath: string) {
  const recoveryPath = getRecoveryPath(lockPath);
  const token = `${process.pid}-${Date.now()}-${crypto
    .randomBytes(8)
    .toString('hex')}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      // Atomic directory creation elects a single lock reclaimer across processes.
      fs.mkdirSync(recoveryPath);
      const recovery: ServerStartupLockMetadata = {
        pid: process.pid,
        createdAt: Date.now(),
        token,
      };
      fs.writeFileSync(
        path.join(recoveryPath, 'owner.json'),
        JSON.stringify(recovery),
        { encoding: 'utf-8', mode: 0o600 },
      );
      return { path: recoveryPath, token };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
      if (!isStaleRecovery(recoveryPath)) {
        return undefined;
      }
      fs.rmSync(recoveryPath, { recursive: true, force: true });
    }
  }
  return undefined;
}

function reclaimServerStartupLock(
  lockPath: string,
  observedLock?: ServerStartupLockMetadata,
) {
  const recovery = tryAcquireRecovery(lockPath);
  if (!recovery) return false;

  try {
    // Re-read after acquiring recovery ownership to avoid a check/delete TOCTOU race.
    const currentLock = readServerStartupLock(lockPath);
    if (observedLock) {
      if (
        currentLock?.token !== observedLock.token ||
        !isStaleServerStartupLock(lockPath, currentLock)
      ) {
        return false;
      }
    } else {
      // Without an observed token, never remove a valid replacement lock.
      if (currentLock) return false;
      // A malformed lock may still be between atomic creation and metadata write.
      if (!isStaleServerStartupLock(lockPath)) return false;
    }
    fs.unlinkSync(lockPath);
    return true;
  } catch (error) {
    // Another reclaimer may remove the stale lock before us. The caller can retry
    // acquisition because there is no longer a lock to reclaim.
    return (error as NodeJS.ErrnoException).code === 'ENOENT';
  } /* v8 ignore next -- defensive cleanup cannot throw */ finally {
    removeRecovery(recovery.path, recovery.token);
  }
}

export function tryAcquireServerStartupLock(
  record: RecordInfo,
): ServerStartupLock | undefined {
  ensureRuntimeDirectory(record.output);
  const lockPath = getServerStartupLockPath(record);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const recoveryPath = getRecoveryPath(lockPath);
    if (fs.existsSync(recoveryPath) && !isStaleRecovery(recoveryPath)) {
      return undefined;
    }
    const token = `${process.pid}-${Date.now()}-${crypto
      .randomBytes(8)
      .toString('hex')}`;
    const lock: ServerStartupLockMetadata = {
      pid: process.pid,
      createdAt: Date.now(),
      token,
    };

    try {
      // `wx` atomically creates the file only when no other process owns the lock.
      const descriptor = fs.openSync(lockPath, 'wx');
      try {
        fs.writeFileSync(descriptor, JSON.stringify(lock), 'utf-8');
      } finally {
        fs.closeSync(descriptor);
      }
      return { path: lockPath, token };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }

      const existingLock = readServerStartupLock(lockPath);
      if (!isStaleServerStartupLock(lockPath, existingLock)) {
        return undefined;
      }
      // Reclaim once and retry; a second race is left to the outer polling loop.
      if (!reclaimServerStartupLock(lockPath, existingLock)) {
        return undefined;
      }
    }
  }

  return undefined;
}

export function releaseServerStartupLock(lock: ServerStartupLock) {
  removeServerStartupLock(lock.path, lock.token);
}

export const __TEST_ONLY__ = {
  getRecoveryPath,
  isStaleRecovery,
  isStaleServerStartupLock,
  readServerStartupLock,
  readServerStartupLockRecovery,
  reclaimServerStartupLock,
  removeRecovery,
  removeServerStartupLock,
  tryAcquireRecovery,
};
