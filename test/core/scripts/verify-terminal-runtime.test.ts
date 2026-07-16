import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { afterEach, describe, expect, it, vi } from 'vitest';

const requireFromCore = createRequire(
  path.resolve(process.cwd(), 'packages/core/package.json'),
);
const verifyTerminalRuntime = requireFromCore(
  './scripts/verify-terminal-runtime.js',
) as {
  ensureHelperExecutable: (
    filePath: string,
    platform: string,
  ) => { exists: boolean; executable: boolean; fixed: boolean };
  getSpawnHelperCandidates: (
    nodePtyRoot: string,
    platform: string,
    arch: string,
  ) => string[];
  probeNodePtySpawn: (
    nodePty: { spawn: Function },
    options: Record<string, unknown>,
  ) => Promise<{ ok: boolean; reason?: string }>;
  runTerminalRuntimeCheck: (options?: Record<string, unknown>) => Promise<{
    ok: boolean;
    skipped: boolean;
    fixedPaths: string[];
    helperPaths: string[];
    reason?: string;
  }>;
};

describe('verify terminal runtime script', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const tempDir of tempDirs.splice(0)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
  });

  it('should repair execute permission for spawn-helper on unix', () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'verify-terminal-helper-'),
    );
    tempDirs.push(tempDir);
    const helperPath = path.join(tempDir, 'spawn-helper');

    fs.writeFileSync(helperPath, '#!/bin/sh\nexit 0\n');
    fs.chmodSync(helperPath, 0o644);

    const result = verifyTerminalRuntime.ensureHelperExecutable(
      helperPath,
      'darwin',
    );

    expect(result.exists).toBe(true);
    expect(result.fixed).toBe(true);
    expect(result.executable).toBe(true);
    expect(fs.statSync(helperPath).mode & 0o111).not.toBe(0);
  });

  it('should repair helper permissions and pass the PTY probe', async () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'verify-terminal-run-'),
    );
    tempDirs.push(tempDir);
    const helperDir = path.join(tempDir, 'prebuilds', 'darwin-arm64');
    const helperPath = path.join(helperDir, 'spawn-helper');
    fs.mkdirSync(helperDir, { recursive: true });
    fs.writeFileSync(helperPath, '#!/bin/sh\nexit 0\n');
    fs.chmodSync(helperPath, 0o644);

    const logger = {
      log: vi.fn(),
      warn: vi.fn(),
    };
    const fakeNodePty = {
      spawn: vi.fn(() => ({
        onExit: (callback: Function) => {
          callback({ exitCode: 0 });
        },
      })),
    };

    const result = await verifyTerminalRuntime.runTerminalRuntimeCheck({
      logger,
      nodePtyRoot: tempDir,
      nodePty: fakeNodePty,
      platform: 'darwin',
      arch: 'arm64',
      cwd: tempDir,
    });

    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(false);
    expect(result.fixedPaths).toEqual([helperPath]);
    expect(fakeNodePty.spawn).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should warn and return a failed probe result without throwing', async () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'verify-terminal-fail-'),
    );
    tempDirs.push(tempDir);
    const helperDir = path.join(tempDir, 'prebuilds', 'darwin-arm64');
    const helperPath = path.join(helperDir, 'spawn-helper');
    fs.mkdirSync(helperDir, { recursive: true });
    fs.writeFileSync(helperPath, '#!/bin/sh\nexit 0\n');
    fs.chmodSync(helperPath, 0o755);

    const logger = {
      log: vi.fn(),
      warn: vi.fn(),
    };

    const result = await verifyTerminalRuntime.runTerminalRuntimeCheck({
      logger,
      nodePtyRoot: tempDir,
      nodePty: {
        spawn: () => {
          throw new Error('posix_spawnp failed');
        },
      },
      platform: 'darwin',
      arch: 'arm64',
      cwd: tempDir,
    });

    expect(result.ok).toBe(false);
    expect(result.skipped).toBe(false);
    expect(result.helperPaths).toEqual(
      verifyTerminalRuntime.getSpawnHelperCandidates(tempDir, 'darwin', 'arm64'),
    );
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('should skip the PTY probe on Windows during installation', async () => {
    const logger = {
      log: vi.fn(),
      warn: vi.fn(),
    };
    const spawn = vi.fn(() => {
      throw new Error('Windows PTY probe must not run during installation');
    });

    const result = await verifyTerminalRuntime.runTerminalRuntimeCheck({
      logger,
      nodePtyRoot: 'C:\\node_modules\\node-pty',
      nodePty: { spawn },
      platform: 'win32',
      arch: 'x64',
      cwd: process.cwd(),
    });

    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe(
      'Terminal runtime verification is deferred on Windows.',
    );
    expect(spawn).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should skip verification when node-pty is not installed', async () => {
    const logger = {
      log: vi.fn(),
      warn: vi.fn(),
    };

    const result = await verifyTerminalRuntime.runTerminalRuntimeCheck({
      logger,
      nodePtyRoot: null,
    });

    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('node-pty is not installed.');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should use platform-specific helper candidate paths', () => {
    const candidates = verifyTerminalRuntime.getSpawnHelperCandidates(
      '/tmp/node-pty',
      'darwin',
      'arm64',
    );

    expect(candidates).toContain(
      '/tmp/node-pty/prebuilds/darwin-arm64/spawn-helper',
    );
  });

  it('should resolve a successful PTY probe with a fake node-pty module', async () => {
    const result = await verifyTerminalRuntime.probeNodePtySpawn(
      {
        spawn: () => ({
          onExit: (callback: Function) => {
            setTimeout(() => callback({ exitCode: 0 }), 0);
          },
        }),
      },
      {
        platform: 'darwin',
        cwd: process.cwd(),
      },
    );

    expect(result).toEqual({ ok: true });
  });
});
