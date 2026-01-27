import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import http from 'http';

// Store reference to portfinder mock for testing error cases
const mockPortfinderGetPort = vi.hoisted(() => vi.fn((options: any, callback: any) => {
  callback(null, options?.port || 5678);
}));

vi.mock('http');
vi.mock('portfinder', () => ({
  default: {
    getPort: mockPortfinderGetPort,
  },
  getPort: mockPortfinderGetPort,
}));
vi.mock('launch-ide', () => ({
  launchIDE: vi.fn(),
}));

import { createServer, ProjectRootPath, getRelativePath, getRelativeOrAbsolutePath } from '@/core/src/server/server';
import { launchIDE } from 'launch-ide';

describe('createServer', () => {
  let mockServer: any;
  let requestHandler: Function;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset portfinder mock to default implementation
    mockPortfinderGetPort.mockImplementation((options: any, callback: any) => {
      callback(null, options?.port || 5678);
    });

    mockServer = {
      listen: vi.fn((port: number, callback: Function) => {
        callback();
      }),
    };

    vi.mocked(http.createServer).mockImplementation((handler: any) => {
      requestHandler = handler;
      return mockServer as any;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create an HTTP server', () => {
    const callback = vi.fn();
    createServer(callback);
    expect(http.createServer).toHaveBeenCalled();
  });

  it('should return the server instance', () => {
    const callback = vi.fn();
    const result = createServer(callback);
    expect(result).toBe(mockServer);
  });

  describe('request handling', () => {
    it('should handle request with file, line, and column parameters', () => {
      const callback = vi.fn();
      createServer(callback);

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
      expect(launchIDE).toHaveBeenCalled();
    });

    it('should prepend ProjectRootPath to relative file paths', () => {
      const callback = vi.fn();
      createServer(callback);

      const mockReq = {
        url: '?file=src%2Ffile.ts&line=1&column=1',
      };
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      requestHandler(mockReq, mockRes);

      if (ProjectRootPath) {
        expect(launchIDE).toHaveBeenCalledWith(
          expect.objectContaining({
            file: `${ProjectRootPath}/src/file.ts`,
          })
        );
      }
    });

    it('should return 403 for file outside ProjectRootPath with relative pathType', async () => {
      const callback = vi.fn();
      createServer(callback, { pathType: 'relative', bundler: 'vite' });

      const mockReq = {
        url: '?file=%2Fetc%2Fpasswd&line=1&column=1',
      };
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      requestHandler(mockReq, mockRes);

      if (ProjectRootPath) {
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
      const callback = vi.fn();
      createServer(callback, options);

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
      const callback = vi.fn();
      const options = {
        bundler: 'vite' as const,
        editor: 'code' as const,
        openIn: 'new' as const,
        pathFormat: '{file}:{line}',
        launchType: 'open' as const,
      };
      createServer(callback, options, { output: '/test', port: 0, entry: '', envDir: '/project' });

      const mockReq = {
        url: '?file=%2Ftest%2Ffile.ts&line=10&column=5',
      };
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      requestHandler(mockReq, mockRes);

      expect(launchIDE).toHaveBeenCalledWith(
        expect.objectContaining({
          editor: 'code',
          method: 'new',
          format: '{file}:{line}',
          type: 'open',
          rootDir: '/project',
        })
      );
    });

    it('should decode URL-encoded file paths correctly', () => {
      const callback = vi.fn();
      createServer(callback);

      const mockReq = {
        url: '?file=%2Fpath%2Fwith%20spaces%2Ffile.ts&line=5&column=10',
      };
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      requestHandler(mockReq, mockRes);

      expect(launchIDE).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.stringContaining('/path/with spaces/file.ts'),
          line: 5,
          column: 10,
        })
      );
    });

    it('should handle missing line and column parameters', () => {
      const callback = vi.fn();
      createServer(callback);

      const mockReq = {
        url: '?file=%2Ftest%2Ffile.ts',
      };
      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      };

      requestHandler(mockReq, mockRes);

      // When line/column are missing, Number(null) returns 0
      expect(launchIDE).toHaveBeenCalledWith(
        expect.objectContaining({
          line: 0,
          column: 0,
        })
      );
    });
  });
});

describe('getRelativePath', () => {
  it('should return relative path when ProjectRootPath is set', () => {
    if (ProjectRootPath) {
      const result = getRelativePath(`${ProjectRootPath}/src/file.ts`);
      expect(result).toBe('src/file.ts');
    }
  });

  it('should return original path when not under ProjectRootPath', () => {
    const result = getRelativePath('/other/path/file.ts');
    expect(result).toBe('/other/path/file.ts');
  });
});

describe('getRelativeOrAbsolutePath', () => {
  it('should return relative path when pathType is "relative"', () => {
    if (ProjectRootPath) {
      const result = getRelativeOrAbsolutePath(`${ProjectRootPath}/src/file.ts`, 'relative');
      expect(result).toBe('src/file.ts');
    }
  });

  it('should return absolute path when pathType is "absolute"', () => {
    const result = getRelativeOrAbsolutePath('/test/file.ts', 'absolute');
    expect(result).toBe('/test/file.ts');
  });

  it('should return absolute path when pathType is undefined', () => {
    const result = getRelativeOrAbsolutePath('/test/file.ts', undefined);
    expect(result).toBe('/test/file.ts');
  });
});

describe('ProjectRootPath (getProjectRoot)', () => {
  it('should be a string', () => {
    expect(typeof ProjectRootPath).toBe('string');
  });

  it('should be a valid git root or empty string', () => {
    if (ProjectRootPath) {
      // If it's set, it should be an absolute path
      expect(ProjectRootPath.startsWith('/')).toBe(true);
    } else {
      expect(ProjectRootPath).toBe('');
    }
  });
});

describe('getRelativePath edge cases', () => {
  it('should return original path when file is not under ProjectRootPath', () => {
    // This tests the case where filePath doesn't start with ProjectRootPath
    const result = getRelativePath('/completely/different/path/file.ts');
    // If ProjectRootPath is set, the path won't be modified since it doesn't contain ProjectRootPath
    // If ProjectRootPath is empty, it returns the original path
    expect(result).toBe('/completely/different/path/file.ts');
  });

  it('should handle empty file path', () => {
    const result = getRelativePath('');
    expect(result).toBe('');
  });
});
