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

export interface ServerStartupLock {
  path: string;
  token: string;
}

interface ServerStartupLockContent {
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
    return JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
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

function removeServerStartupLock(lockPath: string, token?: string) {
  try {
    const current = readServerStartupLock(lockPath);
    if (token && current?.token !== token) {
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
  return (
    Date.now() - lock.createdAt > STARTUP_LOCK_MAX_AGE_MS ||
    !isProcessRunning(lock.pid)
  );
}

export function tryAcquireServerStartupLock(
  record: RecordInfo,
): ServerStartupLock | undefined {
  ensureRuntimeDirectory(record.output);
  const lockPath = getServerStartupLockPath(record);

  for (let attempt = 0; attempt < 2; attempt += 1) {
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
      removeServerStartupLock(lockPath, existingLock?.token);
    }
  }

  return undefined;
}

export function releaseServerStartupLock(lock: ServerStartupLock) {
  removeServerStartupLock(lock.path, lock.token);
}
