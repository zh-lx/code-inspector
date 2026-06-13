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
    const executablePath = path.join(tempDir, 'runner.sh');
    const nonExecutablePath = path.join(tempDir, 'plain.sh');

    fs.writeFileSync(executablePath, '#!/bin/sh\nexit 0\n');
    fs.writeFileSync(nonExecutablePath, '#!/bin/sh\nexit 0\n');
    fs.chmodSync(executablePath, 0o755);
    fs.chmodSync(nonExecutablePath, 0o644);

    expect(__TEST_ONLY__.resolveSpawnCommand(executablePath)).toBe(
      executablePath,
    );
    expect(__TEST_ONLY__.resolveSpawnCommand(nonExecutablePath)).toBeNull();
  });
});
