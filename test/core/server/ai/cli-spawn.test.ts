import { EventEmitter } from 'events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSpawn = vi.hoisted(() => vi.fn());

vi.mock('child_process', () => ({
  spawn: mockSpawn,
  default: { spawn: mockSpawn },
}));

import {
  normalizeCliSpawnCommand,
  spawnCli,
} from '@/core/src/ai/server/cli-spawn';

describe('CLI spawn compatibility', () => {
  const originalPlatform = process.platform;
  const originalComSpec = process.env.ComSpec;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: originalPlatform,
    });
    if (originalComSpec === undefined) {
      delete process.env.ComSpec;
    } else {
      process.env.ComSpec = originalComSpec;
    }
  });

  it('keeps native commands unchanged', () => {
    expect(normalizeCliSpawnCommand('/usr/bin/codex', ['exec', 'hello'])).toEqual({
      command: '/usr/bin/codex',
      args: ['exec', 'hello'],
    });
  });

  it('routes Windows npm shims through ComSpec', () => {
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'win32',
    });
    process.env.ComSpec = 'C:\\Windows\\System32\\cmd.exe';

    expect(
      normalizeCliSpawnCommand('C:\\Program Files\\codex.cmd', [
        'exec',
        'hello world',
      ]),
    ).toEqual({
      command: 'C:\\Windows\\System32\\cmd.exe',
      args: ['/d', '/s', '/c', 'C:\\Program Files\\codex.cmd', 'exec', 'hello world'],
    });
  });

  it('uses the normalized command when spawning', () => {
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'win32',
    });
    const child = new EventEmitter();
    mockSpawn.mockReturnValue(child);

    expect(
      spawnCli('C:\\tools\\claude.cmd', ['-p', 'hello'], {
        cwd: 'C:\\project',
      }),
    ).toBe(child);
    expect(mockSpawn).toHaveBeenCalledWith(
      expect.any(String),
      ['/d', '/s', '/c', 'C:\\tools\\claude.cmd', '-p', 'hello'],
      { cwd: 'C:\\project' },
    );
  });
});
