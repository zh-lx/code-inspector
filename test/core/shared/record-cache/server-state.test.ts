import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getRuntimeDirectory } from '@/core/src/shared/runtime-path';
import {
  clearServerRuntimeState,
  getServerRuntimeState,
  publishServerRuntimeState,
} from '@/core/src/shared/server-state';
import type { RecordInfo } from '@/core/src/shared/type';

describe('server runtime state', () => {
  let output: string;
  let record: RecordInfo;

  beforeEach(() => {
    output = fs.mkdtempSync(path.join(os.tmpdir(), 'inspector-server-state-'));
    vi.spyOn(process, 'cwd').mockReturnValue(output);
    record = { port: 0, entry: '', output };
  });

  afterEach(() => {
    fs.rmSync(getRuntimeDirectory(output), { recursive: true, force: true });
    fs.rmSync(output, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('publishes project-scoped server metadata', () => {
    publishServerRuntimeState(record, 5678, 'instance-a');

    expect(getServerRuntimeState(record)).toEqual({
      protocolVersion: 1,
      projectId: expect.any(String),
      instanceId: 'instance-a',
      pid: process.pid,
      port: 5678,
      startedAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });
  });

  it('only lets the expected instance clear its state', () => {
    publishServerRuntimeState(record, 5678, 'instance-b');

    expect(clearServerRuntimeState(record, 'instance-a')).toBe(false);
    expect(getServerRuntimeState(record)?.port).toBe(5678);
    expect(clearServerRuntimeState(record, 'instance-b')).toBe(true);
    expect(getServerRuntimeState(record)).toBeUndefined();
  });
});
