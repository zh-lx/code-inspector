import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { __TEST_ONLY__ } from '@/core/src/server/ai-terminal';

describe('ai terminal helpers', () => {
  it('should resolve spawn cwd and fall back when requested cwd is missing', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-terminal-root-'));
    const missingDir = path.join(projectRoot, 'missing');

    expect(__TEST_ONLY__.resolveSpawnCwd(projectRoot, process.cwd())).toBe(
      projectRoot,
    );
    expect(__TEST_ONLY__.resolveSpawnCwd(missingDir, projectRoot)).toBe(
      projectRoot,
    );
  });

  it('should normalize spawn env by stripping undefined values', () => {
    const env = __TEST_ONLY__.normalizeSpawnEnv({
      PATH: '/tmp/bin',
      FOO: 'bar',
      EMPTY: undefined,
    });

    expect(env).toEqual({
      PATH: '/tmp/bin',
      FOO: 'bar',
    });
  });

  it('should only resolve executable spawn commands when a path is provided', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-terminal-cmd-'));
    const executablePath = path.join(
      tempDir,
      process.platform === 'win32' ? 'runner.cmd' : 'runner.sh',
    );
    const nonExecutablePath = path.join(
      tempDir,
      process.platform === 'win32' ? 'plain.txt' : 'plain.sh',
    );

    fs.writeFileSync(
      executablePath,
      process.platform === 'win32'
        ? '@echo off\r\nexit /b 0\r\n'
        : '#!/bin/sh\nexit 0\n',
    );
    fs.writeFileSync(nonExecutablePath, '#!/bin/sh\nexit 0\n');
    if (process.platform !== 'win32') {
      fs.chmodSync(executablePath, 0o755);
      fs.chmodSync(nonExecutablePath, 0o644);
    }

    expect(__TEST_ONLY__.resolveSpawnCommand(executablePath)).toBe(
      executablePath,
    );
    expect(__TEST_ONLY__.resolveSpawnCommand(nonExecutablePath)).toBeNull();
  });

  it('should resolve Windows extensionless npm shims to cmd siblings', () => {
    const platformDesc = Object.getOwnPropertyDescriptor(process, 'platform');
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-terminal-win-'));
    const shimPath = path.join(tempDir, 'codex');
    const cmdPath = `${shimPath}.cmd`;

    fs.writeFileSync(shimPath, '#!/bin/sh\n');
    fs.writeFileSync(cmdPath, '@echo off\r\n');

    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'win32',
    });

    try {
      expect(__TEST_ONLY__.resolveSpawnCommand(shimPath)).toBe(cmdPath);
    } finally {
      if (platformDesc) {
        Object.defineProperty(process, 'platform', platformDesc);
      }
    }
  });
});
