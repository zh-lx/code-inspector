import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import http from 'http';
import net from 'net';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { RecordInfo, CodeOptions } from '@/core/src/shared/type';

vi.mock('http');
vi.mock('net');
vi.mock('portfinder', () => ({
  default: {
    getPort: vi.fn((options: any, callback: any) => {
      callback(null, options?.port || 5678);
    }),
  },
  getPort: vi.fn((options: any, callback: any) => {
    callback(null, options?.port || 5678);
  }),
}));
vi.mock('launch-ide', () => ({
  launchIDE: vi.fn(),
}));

import { startServer } from '@/core/src/server/server';
import { getProjectRecord, setProjectRecord, resetFileRecord } from '@/core/src/shared/record-cache';

describe('startServer', () => {
  let testDir: string;
  let mockHttpServer: any;
  let mockNetServer: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `test-start-server-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });

    // Mock HTTP server
    mockHttpServer = {
      listen: vi.fn((port: number, callback: Function) => callback()),
    };
    vi.mocked(http.createServer).mockReturnValue(mockHttpServer as any);

    // Mock net server for isPortOccupied
    mockNetServer = {
      unref: vi.fn(),
      close: vi.fn(),
      listen: vi.fn(),
      on: vi.fn((event: string, callback: Function) => {
        if (event === 'listening') {
          // Port is available by default
          setTimeout(() => callback(), 0);
        }
        return mockNetServer;
      }),
    };
    vi.mocked(net.createServer).mockReturnValue(mockNetServer as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(process, 'cwd').mockRestore();

    // Clean up test directory
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('when previous port exists and is still running', () => {
    it('should not restart server if port is occupied (already running)', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/running');

      // Set up record with existing port
      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      // Create initial record with port
      setProjectRecord(record, 'port', 8888);

      // Mock net server to indicate port is occupied (in use)
      mockNetServer.on = vi.fn((event: string, callback: Function) => {
        if (event === 'error') {
          // Port is occupied (already started)
          setTimeout(() => callback(), 0);
        }
        return mockNetServer;
      });

      const options: CodeOptions = {
        bundler: 'vite',
      };

      await startServer(options, record);

      // Should not create a new server since port is already running
      // The server check happens through isPortOccupied
      const projectRecord = getProjectRecord(record);
      expect(projectRecord?.port).toBe(8888);
    });
  });

  describe('when previous port exists but is not running', () => {
    it('should restart server when port is available (not occupied)', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/restart');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      // Set up record with existing port
      setProjectRecord(record, 'port', 7777);
      setProjectRecord(record, 'findPort', 1);

      // Mock net server to indicate port is available (not occupied)
      mockNetServer.on = vi.fn((event: string, callback: Function) => {
        if (event === 'listening') {
          // Port is available (not occupied)
          setTimeout(() => callback(), 0);
        }
        return mockNetServer;
      });

      const options: CodeOptions = {
        bundler: 'vite',
      };

      await startServer(options, record);

      // Should create a new server since port is not running
      expect(http.createServer).toHaveBeenCalled();
    });
  });

  describe('findPort behavior', () => {
    it('should not restart server if findPort is already set and port exists', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/findport');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      // Set findPort to indicate server is already being created
      setProjectRecord(record, 'findPort', 1);
      setProjectRecord(record, 'port', 5678);

      const options: CodeOptions = {
        bundler: 'vite',
      };

      await startServer(options, record);

      // Server should not be created again, port should remain 5678
      const projectRecord = getProjectRecord(record);
      expect(projectRecord?.port).toBe(5678);
    });

    it('should wait for port if not yet available', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/wait');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      // Set findPort but not port
      setProjectRecord(record, 'findPort', 1);

      const options: CodeOptions = {
        bundler: 'vite',
      };

      // Start server in background
      const promise = startServer(options, record);

      // Set port after a delay
      setTimeout(() => {
        setProjectRecord(record, 'port', 9999);
      }, 50);

      await promise;

      const projectRecord = getProjectRecord(record);
      expect(projectRecord?.port).toBe(9999);
    });
  });

  describe('printServer option', () => {
    it('should print server info when printServer is true', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/print-server');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      resetFileRecord(testDir);

      const options: CodeOptions = {
        bundler: 'vite',
        printServer: true,
      };

      await startServer(options, record);

      // Should have printed server info
      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0]?.[0];
      expect(logCall).toContain('[code-inspector-plugin]');

      consoleSpy.mockRestore();
    });

    it('should print server info with custom ip', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/print-server-ip');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      resetFileRecord(testDir);

      const options: CodeOptions = {
        bundler: 'vite',
        printServer: true,
        ip: '192.168.1.100',
      };

      await startServer(options, record);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not print server info when printServer is false', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/no-print');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      resetFileRecord(testDir);

      const options: CodeOptions = {
        bundler: 'vite',
        printServer: false,
      };

      await startServer(options, record);

      // Should not print server info (console.log might be called for other reasons)
      const serverInfoCalls = consoleSpy.mock.calls.filter(
        call => call[0]?.includes?.('[code-inspector-plugin]')
      );
      expect(serverInfoCalls.length).toBe(0);

      consoleSpy.mockRestore();
    });
  });
});
