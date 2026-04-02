import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import http from 'http';
import path from 'path';
import { createRequire } from 'module';

const mockHttpCreateServer = vi.hoisted(() => vi.fn());
const mockPortfinderGetPort = vi.hoisted(() => vi.fn());
const mockLaunchIDE = vi.hoisted(() => vi.fn());
const requireFromCore = createRequire(
  path.resolve(process.cwd(), 'packages/core/package.json'),
);
const corePortFinder = requireFromCore('portfinder') as {
  getPort: (...args: any[]) => unknown;
};

const loadServerModule = async () => {
  return import('@/core/src/server/server');
};

describe('createServer', () => {
  let serverModule: Awaited<typeof import('@/core/src/server/server')>;
  let mockServer: any;
  let requestHandler: Function;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doMock('launch-ide', () => ({
      launchIDE: mockLaunchIDE,
      default: {
        launchIDE: mockLaunchIDE,
      },
    }));

    mockServer = {
      listen: vi.fn((port: number, callback: Function) => {
        callback();
      }),
    };

    mockHttpCreateServer.mockImplementation((handler: any) => {
      requestHandler = handler;
      return mockServer as any;
    });
    mockPortfinderGetPort.mockImplementation((options: any, callback: any) => {
      callback(null, options?.port || 5678);
    });
    vi.spyOn(http, 'createServer').mockImplementation(mockHttpCreateServer as any);
    vi.spyOn(corePortFinder, 'getPort').mockImplementation(
      mockPortfinderGetPort as any,
    );

    serverModule = await loadServerModule();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create an HTTP server', () => {
    const callback = vi.fn();

    serverModule.createServer(callback);

    expect(mockHttpCreateServer).toHaveBeenCalled();
    expect(requestHandler).toBeInstanceOf(Function);
  });

  it('should return the server instance', () => {
    const callback = vi.fn();

    const result = serverModule.createServer(callback);

    expect(result).toBe(mockServer);
  });

  it('should throw when getPort returns an error', () => {
    const callback = vi.fn();
    mockPortfinderGetPort.mockImplementationOnce((options: any, portCallback: any) => {
      portCallback(new Error('port failed'));
    });

    expect(() => serverModule.createServer(callback)).toThrow('port failed');
  });

  describe('request handling', () => {
    it('should handle request with file, line, and column parameters', () => {
      serverModule.createServer(vi.fn());

      const mockReq = {
        url: '?file=%2Ftest%2Ffile.ts&line=10&column=5',
      };
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      requestHandler(mockReq, mockRes);

      expect(mockRes.writeHead).toHaveBeenCalledWith(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Private-Network': 'true',
      });
      expect(mockRes.end).toHaveBeenCalledWith('ok');
      expect(mockLaunchIDE).toHaveBeenCalled();
    });

    it('should prepend ProjectRootPath to relative file paths', () => {
      serverModule.createServer(vi.fn());

      const mockReq = {
        url: '?file=src%2Ffile.ts&line=1&column=1',
      };
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      requestHandler(mockReq, mockRes);

      if (serverModule.ProjectRootPath) {
        expect(mockLaunchIDE).toHaveBeenCalledWith(
          expect.objectContaining({
            file: `${serverModule.ProjectRootPath}/src/file.ts`,
          }),
        );
      }
    });

    it('should return 403 for file outside ProjectRootPath with relative pathType', () => {
      serverModule.createServer(vi.fn(), {
        pathType: 'relative',
        bundler: 'vite',
      });

      const mockReq = {
        url: '?file=%2Fetc%2Fpasswd&line=1&column=1',
      };
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      requestHandler(mockReq, mockRes);

      if (serverModule.ProjectRootPath) {
        expect(mockRes.writeHead).toHaveBeenCalledWith(403, expect.any(Object));
        expect(mockRes.end).toHaveBeenCalledWith('not allowed to open this file');
      }
    });

    it('should call afterInspectRequest hook if provided', () => {
      const afterInspectRequest = vi.fn();
      const options = {
        bundler: 'vite' as const,
        hooks: {
          afterInspectRequest,
        },
      };

      serverModule.createServer(vi.fn(), options);

      const mockReq = {
        url: '?file=%2Ftest%2Ffile.ts&line=10&column=5',
      };
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      requestHandler(mockReq, mockRes);

      expect(afterInspectRequest).toHaveBeenCalledWith(options, {
        file: expect.any(String),
        line: 10,
        column: 5,
      });
    });

    it('should pass editor and openIn options to launchIDE', () => {
      serverModule.createServer(
        vi.fn(),
        {
          bundler: 'vite',
          editor: 'code',
          openIn: 'new',
          pathFormat: '{file}:{line}',
          launchType: 'open',
        },
        {
          output: '/test',
          port: 0,
          entry: '',
          envDir: '/project',
        },
      );

      const mockReq = {
        url: '?file=%2Ftest%2Ffile.ts&line=10&column=5',
      };
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      requestHandler(mockReq, mockRes);

      expect(mockLaunchIDE).toHaveBeenCalledWith(
        expect.objectContaining({
          editor: 'code',
          method: 'new',
          format: '{file}:{line}',
          type: 'open',
          rootDir: '/project',
        }),
      );
    });

    it('should decode URL-encoded file paths correctly', () => {
      serverModule.createServer(vi.fn());

      const mockReq = {
        url: '?file=%2Fpath%2Fwith%20spaces%2Ffile.ts&line=5&column=10',
      };
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      requestHandler(mockReq, mockRes);

      expect(mockLaunchIDE).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.stringContaining('/path/with spaces/file.ts'),
          line: 5,
          column: 10,
        }),
      );
    });

    it('should handle missing line and column parameters', () => {
      serverModule.createServer(vi.fn());

      const mockReq = {
        url: '?file=%2Ftest%2Ffile.ts',
      };
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      requestHandler(mockReq, mockRes);

      expect(mockLaunchIDE).toHaveBeenCalledWith(
        expect.objectContaining({
          line: 0,
          column: 0,
        }),
      );
    });
  });
});

describe('server path helpers', () => {
  let serverModule: Awaited<typeof import('@/core/src/server/server')>;

  beforeEach(async () => {
    vi.clearAllMocks();
    serverModule = await loadServerModule();
  });

  it('should return relative path when ProjectRootPath is set', () => {
    if (!serverModule.ProjectRootPath) {
      return;
    }

    const result = serverModule.getRelativePath(
      `${serverModule.ProjectRootPath}/src/file.ts`,
    );

    expect(result).toBe('src/file.ts');
  });

  it('should return original path when not under ProjectRootPath', () => {
    expect(serverModule.getRelativePath('/other/path/file.ts')).toBe(
      '/other/path/file.ts',
    );
  });

  it('should return relative path when pathType is "relative"', () => {
    if (!serverModule.ProjectRootPath) {
      return;
    }

    const result = serverModule.getRelativeOrAbsolutePath(
      `${serverModule.ProjectRootPath}/src/file.ts`,
      'relative',
    );

    expect(result).toBe('src/file.ts');
  });

  it('should return absolute path when pathType is "absolute"', () => {
    expect(
      serverModule.getRelativeOrAbsolutePath('/test/file.ts', 'absolute'),
    ).toBe('/test/file.ts');
  });

  it('should return absolute path when pathType is undefined', () => {
    expect(
      serverModule.getRelativeOrAbsolutePath('/test/file.ts', undefined),
    ).toBe('/test/file.ts');
  });

  it('should expose ProjectRootPath as a string', () => {
    expect(typeof serverModule.ProjectRootPath).toBe('string');
  });

  it('should expose a valid git root or empty string', () => {
    if (serverModule.ProjectRootPath) {
      expect(serverModule.ProjectRootPath.startsWith('/')).toBe(true);
      return;
    }

    expect(serverModule.ProjectRootPath).toBe('');
  });

  it('should return original path when file is outside ProjectRootPath', () => {
    expect(serverModule.getRelativePath('/completely/different/path/file.ts')).toBe(
      '/completely/different/path/file.ts',
    );
  });

  it('should handle empty file path', () => {
    expect(serverModule.getRelativePath('')).toBe('');
  });
});
