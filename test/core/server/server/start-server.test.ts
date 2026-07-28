import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import net from 'net';
import { EventEmitter } from 'events';
import { createRequire } from 'module';
import type { RecordInfo, CodeOptions } from '@/core/src/shared/type';
import { getRuntimeDirectory } from '@/core/src/shared/runtime-path';
import {
  getServerStartupLockPath,
  releaseServerStartupLock,
  tryAcquireServerStartupLock,
} from '@/core/src/server/server-lock';

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
    vi.useRealTimers();
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

  it('validates inspector health responses for the current project', async () => {
    vi.mocked(serverModule.__TEST_ONLY__.isInspectorServer).mockRestore();
    const response = new EventEmitter() as EventEmitter & {
      statusCode: number;
      setEncoding: ReturnType<typeof vi.fn>;
    };
    response.statusCode = 200;
    response.setEncoding = vi.fn();
    const request = new EventEmitter() as EventEmitter & {
      destroy: ReturnType<typeof vi.fn>;
    };
    request.destroy = vi.fn();
    const get = vi.spyOn(http, 'get').mockImplementation(((options, callback) => {
      queueMicrotask(() => {
        callback(response as any);
        response.emit(
          'data',
          JSON.stringify({
            name: 'code-inspector',
            projectId: 'health-project',
            protocolVersion: 1,
          }),
        );
        response.emit('end');
      });
      return request as any;
    }) as typeof http.get);

    await expect(
      serverModule.__TEST_ONLY__.isInspectorServer(5678, 'health-project'),
    ).resolves.toBe(true);
    expect(get.mock.calls[0]?.[0]).toMatchObject({
      hostname: '127.0.0.1',
      port: 5678,
      path: '/__code_inspector_health',
    });
    expect(response.setEncoding).toHaveBeenCalledWith('utf-8');
  });

  it('rejects malformed health responses and request failures', async () => {
    vi.mocked(serverModule.__TEST_ONLY__.isInspectorServer).mockRestore();
    const createRequest = (event: 'end' | 'timeout' | 'error') => {
      const response = new EventEmitter() as EventEmitter & {
        statusCode: number;
        setEncoding: ReturnType<typeof vi.fn>;
      };
      response.statusCode = 500;
      response.setEncoding = vi.fn();
      const request = new EventEmitter() as EventEmitter & {
        destroy: ReturnType<typeof vi.fn>;
      };
      request.destroy = vi.fn();
      vi.spyOn(http, 'get').mockImplementationOnce(((_options, callback) => {
        queueMicrotask(() => {
          if (event === 'end') {
            callback(response as any);
            response.emit('data', '{invalid');
            response.emit('end');
          } else {
            request.emit(event, new Error(event));
            request.emit('error', new Error('late error'));
          }
        });
        return request as any;
      }) as typeof http.get);
      return request;
    };

    createRequest('end');
    await expect(
      serverModule.__TEST_ONLY__.isInspectorServer(5678, 'project'),
    ).resolves.toBe(false);

    const timedOutRequest = createRequest('timeout');
    await expect(
      serverModule.__TEST_ONLY__.isInspectorServer(5678, 'project'),
    ).resolves.toBe(false);
    expect(timedOutRequest.destroy).toHaveBeenCalled();

    createRequest('error');
    await expect(
      serverModule.__TEST_ONLY__.isInspectorServer(5678, 'project'),
    ).resolves.toBe(false);
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

  it('rechecks published state after acquiring the startup lock', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/recheck');
    const record: RecordInfo = { port: 0, entry: '', output: testDir };
    recordCacheModule.setProjectRecord(record, 'port', 5678);
    vi.mocked(serverModule.__TEST_ONLY__.isInspectorServer)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await serverModule.startServer({ bundler: 'vite' }, record);

    expect(serverModule.__TEST_ONLY__.isInspectorServer).toHaveBeenCalledTimes(2);
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

  it('shares startup work for equivalent relative and absolute outputs', async () => {
    const projectDir = path.dirname(testDir);
    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);
    const options: CodeOptions = { bundler: 'vite' };
    const absoluteRecord: RecordInfo = {
      port: 0,
      entry: '',
      output: testDir,
    };
    const relativeRecord: RecordInfo = {
      port: 0,
      entry: '',
      output: path.relative(projectDir, testDir),
    };

    mockPortfinderGetPort.mockImplementationOnce(
      (options: any, callback: any) => {
        setTimeout(() => callback(null, options?.port || 9999), 50);
      },
    );

    await Promise.all([
      serverModule.startServer(options, relativeRecord),
      serverModule.startServer(options, absoluteRecord),
    ]);

    expect(mockHttpCreateServer).toHaveBeenCalledTimes(1);
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

  it('rejects when server creation throws synchronously', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/create-throws');
    vi.spyOn(serverModule.__TEST_ONLY__, 'createServer').mockImplementationOnce(
      () => {
        throw new Error('create failed');
      },
    );

    await expect(
      serverModule.startServer(
        { bundler: 'vite' },
        { port: 0, entry: '', output: testDir },
      ),
    ).rejects.toThrow('create failed');
  });

  it('ignores duplicate startup completion and a late timeout', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/settled-startup');
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    vi.spyOn(serverModule.__TEST_ONLY__, 'createServer').mockImplementationOnce(
      ((onReady: (port: number) => void, _options, _record, onError) => {
        onReady(5678);
        onError?.(new Error('late startup error'));
        return mockHttpServer;
      }) as typeof serverModule.createServer,
    );

    await expect(
      serverModule.startServer(
        { bundler: 'vite' },
        { port: 0, entry: '', output: testDir },
      ),
    ).resolves.toBeUndefined();

    const timeoutCallback = timeoutSpy.mock.calls.find(
      ([, delay]) => delay === 10_000,
    )?.[0];
    expect(timeoutCallback).toBeTypeOf('function');
    (timeoutCallback as () => void)();
    expect(mockHttpServer.close).not.toHaveBeenCalled();
  });

  it('times out when the server does not finish starting', async () => {
    vi.useFakeTimers();
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/start-timeout');
    vi.spyOn(serverModule.__TEST_ONLY__, 'createServer').mockReturnValueOnce(
      mockHttpServer,
    );
    const startup = serverModule.startServer(
      { bundler: 'vite' },
      { port: 0, entry: '', output: testDir },
    );
    const rejection = expect(startup).rejects.toThrow(
      'Timed out starting the code-inspector server',
    );

    await vi.advanceTimersByTimeAsync(10_001);

    await rejection;
    expect(mockHttpServer.close).toHaveBeenCalled();
  });

  it('times out when another live process keeps the startup lock', async () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project/lock-timeout');
    const record: RecordInfo = { port: 0, entry: '', output: testDir };
    const lock = tryAcquireServerStartupLock(record)!;
    vi.useFakeTimers();
    const startup = serverModule.startServer({ bundler: 'vite' }, record);
    const rejection = expect(startup).rejects.toThrow(
      'Timed out coordinating the code-inspector server startup',
    );

    await vi.advanceTimersByTimeAsync(30_001);

    await rejection;
    expect(fs.existsSync(getServerStartupLockPath(record))).toBe(true);
    releaseServerStartupLock(lock);
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
