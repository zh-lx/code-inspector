import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { RecordInfo } from '../shared/type';
import {
  ensureRuntimeDirectory,
  getProjectId,
  getRuntimeDirectory,
} from '../shared/runtime-path';

const STARTUP_LOCK_MAX_AGE_MS = 15_000;
const STARTUP_LOCK_RECOVERY_SUFFIX = '.recovery';

export interface ServerStartupLock {
  path: string;
  token: string;
}

interface ServerStartupLockContent {
  pid: number;
  createdAt: number;
  token: string;
}

interface ServerStartupLockRecovery {
  pid: number;
  createdAt: number;
  token: string;
}

export { getProjectId };

export function getServerStartupLockPath(record: RecordInfo) {
  return path.join(getRuntimeDirectory(record.output), 'startup.lock');
}

function readServerStartupLock(
  lockPath: string,
): ServerStartupLockContent | undefined {
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
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function removeServerStartupLock(lockPath: string, token: string) {
  try {
    const current = readServerStartupLock(lockPath);
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
  lock?: ServerStartupLockContent,
) {
  if (!lock) {
    try {
      return Date.now() - fs.statSync(lockPath).mtimeMs > STARTUP_LOCK_MAX_AGE_MS;
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
): ServerStartupLockRecovery | undefined {
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
    return Date.now() - fs.statSync(recoveryPath).mtimeMs > STARTUP_LOCK_MAX_AGE_MS;
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
      fs.mkdirSync(recoveryPath);
      const recovery: ServerStartupLockRecovery = {
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
  observedLock?: ServerStartupLockContent,
) {
  const recovery = tryAcquireRecovery(lockPath);
  if (!recovery) return false;

  try {
    const currentLock = readServerStartupLock(lockPath);
    if (observedLock) {
      if (
        currentLock?.token !== observedLock.token ||
        !isStaleServerStartupLock(lockPath, currentLock)
      ) {
        return false;
      }
    } else if (
      currentLock ||
      !isStaleServerStartupLock(lockPath, currentLock)
    ) {
      return false;
    }
    fs.unlinkSync(lockPath);
    return true;
  } catch {
    return false;
  } finally {
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
    const lock: ServerStartupLockContent = {
      pid: process.pid,
      createdAt: Date.now(),
      token,
    };

    try {
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
