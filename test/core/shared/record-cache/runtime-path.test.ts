import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  getBuildStateFilePath,
  getProjectId,
  getRuntimeDirectory,
  getServerStateFilePath,
  writeRuntimeJsonFile,
} from '@/core/src/shared/runtime-path';

describe('runtime path', () => {
  let output: string;

  beforeEach(() => {
    output = fs.mkdtempSync(path.join(os.tmpdir(), 'inspector-runtime-path-'));
    vi.spyOn(process, 'cwd').mockReturnValue(output);
  });

  afterEach(() => {
    fs.rmSync(getRuntimeDirectory(output), { recursive: true, force: true });
    fs.rmSync(output, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('keeps runtime files outside the package output directory', () => {
    const runtimeDirectory = getRuntimeDirectory(output);

    expect(runtimeDirectory.startsWith(output)).toBe(false);
    expect(getBuildStateFilePath(output)).toBe(
      path.join(runtimeDirectory, 'build-state.json'),
    );
    expect(getServerStateFilePath(output)).toBe(
      path.join(runtimeDirectory, 'server.json'),
    );
  });

  it('uses separate runtime directories for different projects', () => {
    const first = getRuntimeDirectory(output);
    const firstProjectId = getProjectId();
    vi.spyOn(process, 'cwd').mockReturnValue(`${output}-other`);

    expect(getRuntimeDirectory(output)).not.toBe(first);
    expect(getProjectId()).not.toBe(firstProjectId);
    expect(firstProjectId).toMatch(/^[0-9a-f]{16}$/);
    expect(path.basename(first)).toMatch(/^[0-9a-f]{16}$/);
  });

  it('uses separate runtime directories for different package outputs', () => {
    expect(getRuntimeDirectory(`${output}-other`)).not.toBe(
      getRuntimeDirectory(output),
    );
  });

  it.runIf(process.platform !== 'win32')(
    'restricts runtime directory and file permissions to the current user',
    () => {
      const filePath = getBuildStateFilePath(output);
      writeRuntimeJsonFile(output, filePath, { entry: '' });

      expect(fs.statSync(getRuntimeDirectory(output)).mode & 0o777).toBe(0o700);
      expect(fs.statSync(filePath).mode & 0o777).toBe(0o600);
    },
  );
});
