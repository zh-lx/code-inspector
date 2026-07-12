import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock core module before imports
vi.mock('@code-inspector/core', () => ({
  normalizePath: vi.fn((p: string) => p),
  getCodeWithWebComponent: vi.fn(async ({ code }: { code: string }) => `injected:${code}`),
  isExcludedFile: vi.fn(() => false),
}));

import WebpackCodeInjectLoader from '@/webpack/src/inject-loader';
import {
  normalizePath,
  getCodeWithWebComponent,
  isExcludedFile,
} from '@code-inspector/core';

describe('WebpackCodeInjectLoader', () => {
  let mockContext: any;
  const runLoader = async (
    content = 'const x = 1;',
    source: any = null,
    meta: any = null,
  ) => {
    await new Promise<void>((resolve) => {
      const callback = vi.fn((...args: any[]) => {
        mockContext.callback(...args);
        resolve();
      });
      mockContext.async.mockReturnValueOnce(callback);
      WebpackCodeInjectLoader.call(mockContext, content, source, meta);
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      async: vi.fn(),
      cacheable: vi.fn(),
      callback: vi.fn(),
      resourcePath: '/test/file.js',
      query: {
        record: { port: 0, entry: '', output: '/test' },
      },
    };
  });

  it('should call async to indicate async operation', async () => {
    await runLoader();
    expect(mockContext.async).toHaveBeenCalled();
  });

  it('should call cacheable when available', async () => {
    await runLoader();
    expect(mockContext.cacheable).toHaveBeenCalledWith(true);
  });

  it('should work when cacheable is not available', async () => {
    delete mockContext.cacheable;
    await runLoader();
    expect(mockContext.callback).toHaveBeenCalled();
  });

  it('should use callback when async is not available', async () => {
    delete mockContext.async;
    const content = 'const x = 1;';
    const source = { map: {} };
    const meta = { info: 'meta' };

    await new Promise<void>((resolve) => {
      mockContext.callback.mockImplementationOnce(() => resolve());
      WebpackCodeInjectLoader.call(mockContext, content, source, meta);
    });

    expect(mockContext.callback).toHaveBeenCalledWith(
      null,
      `injected:${content}`,
      source,
      meta,
    );
  });

  it('should return original content for excluded files', async () => {
    vi.mocked(isExcludedFile).mockReturnValueOnce(true);
    const content = 'const x = 1;';
    const source = { map: {} };
    const meta = { info: 'meta' };

    await runLoader(content, source, meta);

    expect(mockContext.callback).toHaveBeenCalledWith(null, content, source, meta);
    expect(getCodeWithWebComponent).not.toHaveBeenCalled();
  });

  it('should inject code with web component for non-excluded files', async () => {
    const content = 'const x = 1;';
    const source = { map: {} };
    const meta = { info: 'meta' };

    await runLoader(content, source, meta);

    expect(getCodeWithWebComponent).toHaveBeenCalledWith({
      options: mockContext.query,
      file: '/test/file.js',
      code: content,
      record: mockContext.query.record,
    });
    expect(mockContext.callback).toHaveBeenCalledWith(
      null,
      `injected:${content}`,
      source,
      meta
    );
  });

  it('should normalize file path', async () => {
    mockContext.resourcePath = '/test/path/to/file.js';
    await runLoader('code');

    expect(normalizePath).toHaveBeenCalledWith('/test/path/to/file.js');
  });

  it('should return a promise when no callback is available', async () => {
    delete mockContext.async;
    delete mockContext.callback;
    delete mockContext.query;

    const result = WebpackCodeInjectLoader.call(
      mockContext,
      'const x = 1;',
      null,
      null,
    );

    await expect(result).resolves.toBe('injected:const x = 1;');
    expect(getCodeWithWebComponent).toHaveBeenCalledWith({
      options: {},
      file: '/test/file.js',
      code: 'const x = 1;',
      record: undefined,
    });
  });

  it('should fall back to original content when injection fails', async () => {
    vi.mocked(getCodeWithWebComponent).mockRejectedValueOnce(
      new Error('invalid temporary code'),
    );

    const content = 'const x = <;';
    await runLoader(content);

    expect(mockContext.callback).toHaveBeenCalledWith(null, content, null, null);
  });
});
