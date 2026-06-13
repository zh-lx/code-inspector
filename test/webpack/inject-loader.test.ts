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

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      async: vi.fn().mockReturnValue(() => {}),
      cacheable: vi.fn(),
      callback: vi.fn(),
      resourcePath: '/test/file.js',
      query: {
        record: { port: 0, entry: '', output: '/test' },
      },
    };
  });

  it('should call async to indicate async operation', async () => {
    await WebpackCodeInjectLoader.call(mockContext, 'const x = 1;', null, null);
    expect(mockContext.async).toHaveBeenCalled();
  });

  it('should call cacheable when available', async () => {
    await WebpackCodeInjectLoader.call(mockContext, 'const x = 1;', null, null);
    expect(mockContext.cacheable).toHaveBeenCalledWith(true);
  });

  it('should work when cacheable is not available', async () => {
    delete mockContext.cacheable;
    await WebpackCodeInjectLoader.call(mockContext, 'const x = 1;', null, null);
    expect(mockContext.callback).toHaveBeenCalled();
  });

  it('should return original content for excluded files', async () => {
    vi.mocked(isExcludedFile).mockReturnValueOnce(true);
    const content = 'const x = 1;';
    const source = { map: {} };
    const meta = { info: 'meta' };

    await WebpackCodeInjectLoader.call(mockContext, content, source, meta);

    expect(mockContext.callback).toHaveBeenCalledWith(null, content, source, meta);
    expect(getCodeWithWebComponent).not.toHaveBeenCalled();
  });

  it('should inject code with web component for non-excluded files', async () => {
    const content = 'const x = 1;';
    const source = { map: {} };
    const meta = { info: 'meta' };

    await WebpackCodeInjectLoader.call(mockContext, content, source, meta);

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
    await WebpackCodeInjectLoader.call(mockContext, 'code', null, null);

    expect(normalizePath).toHaveBeenCalledWith('/test/path/to/file.js');
  });
});
