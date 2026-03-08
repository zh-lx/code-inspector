import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { RecordInfo, CodeOptions } from '@/core/src/shared/type';

const mockNetCreateServer = vi.hoisted(() => vi.fn());

vi.mock('net', () => ({
  default: {
    createServer: mockNetCreateServer,
  },
  createServer: mockNetCreateServer,
}));
vi.mock('node:net', () => ({
  default: {
    createServer: mockNetCreateServer,
  },
  createServer: mockNetCreateServer,
}));

import { startServer, __TEST_ONLY__ } from '@/core/src/server/server';
import {
  getProjectRecord,
  setProjectRecord,
  resetFileRecord,
} from '@/core/src/shared/record-cache';

describe('startServer', () => {
  let testDir: string;
  let portOccupied = false;

  beforeEach(() => {
    vi.clearAllMocks();

    testDir = path.join(os.tmpdir(), `test-start-server-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });

    vi.spyOn(__TEST_ONLY__, 'createServer').mockImplementation((callback) => {
      callback(5678);
      return {} as any;
    });

    mockNetCreateServer.mockImplementation(() => {
      const server: any = {
        unref: vi.fn(),
        close: vi.fn(),
        _listening: undefined as undefined | (() => void),
        _error: undefined as undefined | ((err: Error) => void),
        on: vi.fn((event: string, cb: Function) => {
          if (event === 'listening') server._listening = cb as () => void;
          if (event === 'error') server._error = cb as (err: Error) => void;
          return server;
        }),
        listen: vi.fn(() => {
          setTimeout(() => {
            if (portOccupied) {
              server._error?.(new Error('port occupied'));
            } else {
              server._listening?.();
            }
          }, 0);
        }),
      };
      return server;
    });

  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(process, 'cwd').mockRestore();

    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should not restart server if previous port is still occupied', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/running');

    const record: RecordInfo = { port: 0, entry: '', output: testDir };
    setProjectRecord(record, 'port', 8888);
    portOccupied = true;

    const options: CodeOptions = { bundler: 'vite' };
    await startServer(options, record);

    expect(__TEST_ONLY__.createServer).not.toHaveBeenCalled();
    expect(getProjectRecord(record)?.port).toBe(8888);
  });

  it('should restart server when previous port is available', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/restart');

    const record: RecordInfo = { port: 0, entry: '', output: testDir };
    setProjectRecord(record, 'port', 7777);
    setProjectRecord(record, 'findPort', 1);
    portOccupied = false;

    const options: CodeOptions = { bundler: 'vite' };
    await startServer(options, record);

    expect(__TEST_ONLY__.createServer).toHaveBeenCalled();
    expect(getProjectRecord(record)?.port).toBe(5678);
  });

  it('should not restart when findPort is set and port is occupied', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/findport');

    const record: RecordInfo = { port: 0, entry: '', output: testDir };
    setProjectRecord(record, 'findPort', 1);
    setProjectRecord(record, 'port', 5678);
    portOccupied = true;

    const options: CodeOptions = { bundler: 'vite' };
    await startServer(options, record);

    expect(__TEST_ONLY__.createServer).not.toHaveBeenCalled();
    expect(getProjectRecord(record)?.port).toBe(5678);
  });

  it('should wait for port when findPort exists but port missing', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/wait');

    const record: RecordInfo = { port: 0, entry: '', output: testDir };
    setProjectRecord(record, 'findPort', 1);

    const options: CodeOptions = { bundler: 'vite' };

    const promise = startServer(options, record);
    setTimeout(() => {
      setProjectRecord(record, 'port', 9999);
    }, 50);

    await promise;

    expect(getProjectRecord(record)?.port).toBe(9999);
  });

  it('should print server info when printServer is true', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/print-server');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const record: RecordInfo = { port: 0, entry: '', output: testDir };
    resetFileRecord(testDir);

    const options: CodeOptions = { bundler: 'vite', printServer: true };
    await startServer(options, record);

    expect(__TEST_ONLY__.createServer).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0]?.[0]).toContain('[code-inspector-plugin]');

    consoleSpy.mockRestore();
  });

  it('should print server info with custom ip', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/print-server-ip');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const record: RecordInfo = { port: 0, entry: '', output: testDir };
    resetFileRecord(testDir);

    const options: CodeOptions = {
      bundler: 'vite',
      printServer: true,
      ip: '192.168.1.100',
    };

    await startServer(options, record);

    expect(__TEST_ONLY__.createServer).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should not print server info when printServer is false', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/no-print');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const record: RecordInfo = { port: 0, entry: '', output: testDir };
    resetFileRecord(testDir);

    const options: CodeOptions = { bundler: 'vite', printServer: false };

    await startServer(options, record);

    const serverInfoCalls = consoleSpy.mock.calls.filter((call) =>
      call[0]?.includes?.('[code-inspector-plugin]')
    );
    expect(serverInfoCalls.length).toBe(0);

    consoleSpy.mockRestore();
  });
});
