import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  ensureRuntimeDirectory,
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
    expect(firstProjectId).toMatch(/^[0-9a-f]{64}$/);
    expect(path.basename(first)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('uses separate runtime directories for different package outputs', () => {
    expect(getRuntimeDirectory(`${output}-other`)).not.toBe(
      getRuntimeDirectory(output),
    );
  });

  it('uses the environment user name when uid is unavailable', () => {
    const descriptor = Object.getOwnPropertyDescriptor(process, 'getuid');
    const previousUsername = process.env.USERNAME;
    try {
      Object.defineProperty(process, 'getuid', {
        configurable: true,
        value: undefined,
      });
      process.env.USERNAME = 'test user';

      expect(getRuntimeDirectory(output)).toContain(
        `${path.sep}code-inspector-plugin-test_user${path.sep}`,
      );
    } finally {
      if (descriptor) Object.defineProperty(process, 'getuid', descriptor);
      if (previousUsername === undefined) delete process.env.USERNAME;
      else process.env.USERNAME = previousUsername;
    }
  });

  it('falls back from USERNAME to USER and then to default', () => {
    const descriptor = Object.getOwnPropertyDescriptor(process, 'getuid');
    const previousUsername = process.env.USERNAME;
    const previousUser = process.env.USER;
    try {
      Object.defineProperty(process, 'getuid', {
        configurable: true,
        value: undefined,
      });
      delete process.env.USERNAME;
      process.env.USER = 'fallback user';

      expect(getRuntimeDirectory(output)).toContain(
        `${path.sep}code-inspector-plugin-fallback_user${path.sep}`,
      );

      delete process.env.USER;
      expect(getRuntimeDirectory(output)).toContain(
        `${path.sep}code-inspector-plugin-default${path.sep}`,
      );
    } finally {
      if (descriptor) Object.defineProperty(process, 'getuid', descriptor);
      if (previousUsername === undefined) delete process.env.USERNAME;
      else process.env.USERNAME = previousUsername;
      if (previousUser === undefined) delete process.env.USER;
      else process.env.USER = previousUser;
    }
  });

  it('propagates unexpected runtime directory creation errors', () => {
    const error = Object.assign(new Error('directory denied'), {
      code: 'EACCES',
    });
    vi.spyOn(fs, 'mkdirSync').mockImplementationOnce(() => {
      throw error;
    });

    expect(() => ensureRuntimeDirectory(output)).toThrow('directory denied');
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

  it.runIf(process.platform !== 'win32')(
    'repairs unsafe permissions on an existing owned directory',
    () => {
      const directory = getRuntimeDirectory(output);
      fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
      fs.chmodSync(directory, 0o777);

      ensureRuntimeDirectory(output);

      expect(fs.statSync(directory).mode & 0o777).toBe(0o700);
    },
  );

  it.runIf(process.platform !== 'win32')(
    'rejects a symlink used as the project runtime directory',
    () => {
      const directory = getRuntimeDirectory(output);
      fs.mkdirSync(path.dirname(directory), { recursive: true, mode: 0o700 });
      fs.symlinkSync(output, directory, 'dir');

      expect(() => ensureRuntimeDirectory(output)).toThrow(
        'Unsafe code-inspector runtime directory',
      );
    },
  );

  it.runIf(process.platform !== 'win32')(
    'rejects a runtime directory owned by another user',
    () => {
      const directory = ensureRuntimeDirectory(output);
      const lstatSync = fs.lstatSync.bind(fs);
      vi.spyOn(fs, 'lstatSync').mockImplementation(((target: fs.PathLike) => {
        const stat = lstatSync(target);
        if (String(target) === directory) {
          Object.defineProperty(stat, 'uid', { value: stat.uid + 1 });
        }
        return stat;
      }) as typeof fs.lstatSync);

      expect(() => ensureRuntimeDirectory(output)).toThrow(
        'is not owned by the current user',
      );
    },
  );
});
