import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import net from 'net';
import { createRequire } from 'module';
import type { RecordInfo, CodeOptions } from '@/core/src/shared/type';
import { getRuntimeDirectory } from '@/core/src/shared/runtime-path';

const mockHttpCreateServer = vi.hoisted(() => vi.fn());
const mockNetCreateServer = vi.hoisted(() => vi.fn());
const mockPortfinderGetPort = vi.hoisted(() => vi.fn());
const requireFromCore = createRequire(
  path.resolve(process.cwd(), 'packages/core/package.json'),
);
const corePortFinder = requireFromCore('portfinder') as {
  getPort: (...args: any[]) => unknown;
};

describe('startServer', () => {
  let serverModule: Awaited<typeof import('@/core/src/server/server')>;
  let recordCacheModule: Awaited<
    typeof import('@/core/src/shared/record-cache')
  >;
  let testDir: string;
  let mockHttpServer: any;
  let mockNetServer: any;
  let occupiedState: boolean;
  let netListeners: Record<string, Function>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    testDir = path.join(os.tmpdir(), `test-start-server-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });

    mockHttpServer = {
      once: vi.fn(),
      listen: vi.fn((port: number, callback: Function) => callback()),
      close: vi.fn(),
    };
    mockHttpCreateServer.mockReturnValue(mockHttpServer as any);

    occupiedState = false;
    netListeners = {};
    mockNetServer = {
      unref: vi.fn(),
      close: vi.fn((callback?: Function) => callback?.()),
      listen: vi.fn(() => {
        setTimeout(() => {
          if (occupiedState) {
            netListeners.error?.(new Error('EADDRINUSE'));
            return;
          }
          netListeners.listening?.();
        }, 0);
        return mockNetServer;
      }),
      on: vi.fn((event: string, callback: Function) => {
        netListeners[event] = callback;
        return mockNetServer;
      }),
    };
    mockNetCreateServer.mockReturnValue(mockNetServer as any);
    mockPortfinderGetPort.mockImplementation((options: any, callback: any) => {
      callback(null, options?.port || 5678);
    });
    vi.spyOn(http, 'createServer').mockImplementation(
      mockHttpCreateServer as any,
    );
    vi.spyOn(net, 'createServer').mockImplementation(
      mockNetCreateServer as any,
    );
    vi.spyOn(corePortFinder, 'getPort').mockImplementation(
      mockPortfinderGetPort as any,
    );

    serverModule = await import('@/core/src/server/server');
    recordCacheModule = await import('@/core/src/shared/record-cache');
    vi.spyOn(serverModule.__TEST_ONLY__, 'isInspectorServer').mockImplementation(
      async () => occupiedState,
    );
  });

  afterEach(() => {
    fs.rmSync(getRuntimeDirectory(testDir), { recursive: true, force: true });
    vi.restoreAllMocks();
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should not restart a healthy inspector server', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/running');

    const record: RecordInfo = {
      port: 0,
      entry: '',
      output: testDir,
    };
    const options: CodeOptions = {
      bundler: 'vite',
    };

    recordCacheModule.setProjectRecord(record, 'port', 8888);
    occupiedState = true;

    await serverModule.startServer(options, record);

    expect(recordCacheModule.getProjectRecord(record)?.port).toBe(8888);
    expect(mockHttpCreateServer).not.toHaveBeenCalled();
  });

  it('should restart when the recorded port is not an inspector server', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/restart');

    const record: RecordInfo = {
      port: 0,
      entry: '',
      output: testDir,
    };
    const options: CodeOptions = {
      bundler: 'vite',
    };

    recordCacheModule.setProjectRecord(record, 'port', 7777);
    await serverModule.startServer(options, record);

    expect(mockHttpCreateServer).toHaveBeenCalled();
    expect(recordCacheModule.getProjectRecord(record)?.port).toBe(5678);
  });

  it('should reuse a healthy recorded server', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/findport');

    const record: RecordInfo = {
      port: 0,
      entry: '',
      output: testDir,
    };
    const options: CodeOptions = {
      bundler: 'vite',
    };

    recordCacheModule.setProjectRecord(record, 'port', 5678);
    occupiedState = true;

    await serverModule.startServer(options, record);

    expect(recordCacheModule.getProjectRecord(record)?.port).toBe(5678);
    expect(mockHttpCreateServer).not.toHaveBeenCalled();
  });

  it('should share one startup promise between concurrent calls', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/wait');

    const record: RecordInfo = {
      port: 0,
      entry: '',
      output: testDir,
    };
    const options: CodeOptions = {
      bundler: 'vite',
    };

    mockPortfinderGetPort.mockImplementationOnce(
      (options: any, callback: any) => {
        setTimeout(() => callback(null, options?.port || 9999), 50);
      },
    );

    await Promise.all([
      serverModule.startServer(options, record),
      serverModule.startServer(options, record),
    ]);

    expect(mockHttpCreateServer).toHaveBeenCalledTimes(1);
    expect(recordCacheModule.getProjectRecord(record)?.port).toBe(5678);
  });

  it('releases the startup lock after a startup failure', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/startup-failure');
    const record: RecordInfo = {
      port: 0,
      entry: '',
      output: testDir,
    };
    const options: CodeOptions = { bundler: 'vite' };

    mockPortfinderGetPort.mockImplementationOnce(
      (_options: any, callback: any) => {
        callback(new Error('port lookup failed'));
      },
    );

    await expect(serverModule.startServer(options, record)).rejects.toThrow(
      'port lookup failed',
    );
    await expect(
      serverModule.startServer(options, record),
    ).resolves.toBeUndefined();
    expect(mockHttpCreateServer).toHaveBeenCalledTimes(2);
  });

  it('should print server info when printServer is true', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/print-server');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const record: RecordInfo = {
      port: 0,
      entry: '',
      output: testDir,
    };
    const options: CodeOptions = {
      bundler: 'vite',
      printServer: true,
    };

    recordCacheModule.resetFileRecord(testDir);

    await serverModule.startServer(options, record);

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0]?.[0]).toContain('[code-inspector-plugin]');
  });

  it('should print server info with custom ip', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/print-server-ip');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const record: RecordInfo = {
      port: 0,
      entry: '',
      output: testDir,
    };
    const options: CodeOptions = {
      bundler: 'vite',
      printServer: true,
      ip: '192.168.1.100',
    };

    recordCacheModule.resetFileRecord(testDir);

    await serverModule.startServer(options, record);

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should not print server info when printServer is false', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/no-print');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const record: RecordInfo = {
      port: 0,
      entry: '',
      output: testDir,
    };
    const options: CodeOptions = {
      bundler: 'vite',
      printServer: false,
    };

    recordCacheModule.resetFileRecord(testDir);

    await serverModule.startServer(options, record);

    const serverInfoCalls = consoleSpy.mock.calls.filter((call) =>
      call[0]?.includes?.('[code-inspector-plugin]'),
    );

    expect(serverInfoCalls.length).toBe(0);
  });
});
