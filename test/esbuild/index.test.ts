import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock functions with vi.hoisted to ensure they're available before module mocking
const mockReadFile = vi.hoisted(() => vi.fn());

// Mock fs before imports
vi.mock('fs', () => ({
  default: {
    promises: {
      readFile: mockReadFile,
    },
  },
  promises: {
    readFile: mockReadFile,
  },
}));

// Mock core module before imports
vi.mock('@code-inspector/core', () => ({
  transformCode: vi.fn((params: any) => `transformed:${params.content}`),
  CodeOptions: {},
  getCodeWithWebComponent: vi.fn(async ({ code }: { code: string }) => `injected:${code}`),
  RecordInfo: {},
  isJsTypeFile: vi.fn((file: string) => /\.(jsx|tsx|js|ts|mjs|mts)$/.test(file)),
  parseSFC: vi.fn((content: string) => ({
    descriptor: {
      template: { content: '<div>template</div>' },
    },
  })),
  isDev: vi.fn((dev: boolean | undefined, condition: boolean) => dev ?? condition),
  getMappingFilePath: vi.fn((file: string) => file),
  isExcludedFile: vi.fn(() => false),
}));

import { EsbuildCodeInspectorPlugin } from '@/esbuild/src/index';
import {
  transformCode,
  isDev,
  isJsTypeFile,
  parseSFC,
  isExcludedFile,
} from '@code-inspector/core';

describe('EsbuildCodeInspectorPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic plugin structure', () => {
    it('should return plugin with correct name', () => {
      const plugin = EsbuildCodeInspectorPlugin({ bundler: 'esbuild', output: '/test' });
      expect(plugin.name).toBe('@code-inspector/esbuild');
    });

    it('should have setup function', () => {
      const plugin = EsbuildCodeInspectorPlugin({ bundler: 'esbuild', output: '/test' });
      expect(plugin.setup).toBeInstanceOf(Function);
    });
  });

  describe('setup', () => {
    it('should return early when close is true', () => {
      const plugin = EsbuildCodeInspectorPlugin({
        bundler: 'esbuild',
        output: '/test',
        close: true,
      });
      const mockBuild = { onLoad: vi.fn() };
      plugin.setup(mockBuild);
      expect(mockBuild.onLoad).not.toHaveBeenCalled();
    });

    it('should return early when not in dev mode', () => {
      vi.mocked(isDev).mockReturnValueOnce(false);
      const plugin = EsbuildCodeInspectorPlugin({ bundler: 'esbuild', output: '/test' });
      const mockBuild = { onLoad: vi.fn() };
      plugin.setup(mockBuild);
      expect(mockBuild.onLoad).not.toHaveBeenCalled();
    });

    it('should register onLoad handler in dev mode', () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = EsbuildCodeInspectorPlugin({ bundler: 'esbuild', output: '/test' });
      const mockBuild = { onLoad: vi.fn() };
      plugin.setup(mockBuild);
      expect(mockBuild.onLoad).toHaveBeenCalled();
    });

    it('should use custom match regex when provided', () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const customMatch = /\.custom$/;
      const plugin = EsbuildCodeInspectorPlugin({
        bundler: 'esbuild',
        output: '/test',
        match: customMatch,
      });
      const mockBuild = { onLoad: vi.fn() };
      plugin.setup(mockBuild);
      expect(mockBuild.onLoad).toHaveBeenCalledWith(
        { filter: customMatch },
        expect.any(Function)
      );
    });
  });

  describe('onLoad handler', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Reset mock implementations to defaults
      vi.mocked(isExcludedFile).mockReturnValue(false);
      vi.mocked(isJsTypeFile).mockImplementation((file: string) => /\.(jsx|tsx|js|ts|mjs|mts)$/.test(file));
    });

    it('should return code string for excluded files', async () => {
      vi.mocked(isDev).mockReturnValue(true);
      mockReadFile.mockResolvedValue('const excluded = 1;');
      vi.mocked(isExcludedFile).mockReturnValue(true);

      const mockBuild = { onLoad: vi.fn() };
      const plugin = EsbuildCodeInspectorPlugin({ bundler: 'esbuild', output: '/test' });
      plugin.setup(mockBuild);
      const onLoadCallback = mockBuild.onLoad.mock.calls[0][1];

      const result = await onLoadCallback({ path: '/test/excluded-file-1.tsx' });
      // When excluded and not in cache, returns the code string (checked source code line 56)
      expect(result).toBe('const excluded = 1;');
    });

    it('should transform JSX files and return output object', async () => {
      vi.mocked(isDev).mockReturnValue(true);
      mockReadFile.mockResolvedValue('const jsx = 1;');
      vi.mocked(isExcludedFile).mockReturnValue(false);
      vi.mocked(isJsTypeFile).mockReturnValue(true);

      const mockBuild = { onLoad: vi.fn() };
      const plugin = EsbuildCodeInspectorPlugin({ bundler: 'esbuild', output: '/test' });
      plugin.setup(mockBuild);
      const onLoadCallback = mockBuild.onLoad.mock.calls[0][1];

      const result = await onLoadCallback({ path: '/test/jsx-new-file.tsx' });
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'jsx',
        })
      );
      // The function returns result.output (line 102), which is { contents, loader }
      expect(result).toHaveProperty('contents');
      expect(result).toHaveProperty('loader');
      expect(result.loader).toBe('tsx');
    });

    it('should transform Svelte files', async () => {
      vi.mocked(isDev).mockReturnValue(true);
      mockReadFile.mockResolvedValue('<div>svelte</div>');
      vi.mocked(isExcludedFile).mockReturnValue(false);
      vi.mocked(isJsTypeFile).mockReturnValue(false);

      const mockBuild = { onLoad: vi.fn() };
      const plugin = EsbuildCodeInspectorPlugin({ bundler: 'esbuild', output: '/test' });
      plugin.setup(mockBuild);
      const onLoadCallback = mockBuild.onLoad.mock.calls[0][1];

      const result = await onLoadCallback({ path: '/test/svelte-file-1.svelte' });
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'svelte',
        })
      );
    });

    it('should transform Vue files', async () => {
      vi.mocked(isDev).mockReturnValue(true);
      mockReadFile.mockResolvedValue('<template><div>vue</div></template>');
      vi.mocked(isExcludedFile).mockReturnValue(false);
      vi.mocked(isJsTypeFile).mockReturnValue(false);

      const mockBuild = { onLoad: vi.fn() };
      const plugin = EsbuildCodeInspectorPlugin({ bundler: 'esbuild', output: '/test' });
      plugin.setup(mockBuild);
      const onLoadCallback = mockBuild.onLoad.mock.calls[0][1];

      const result = await onLoadCallback({ path: '/test/vue-file-1.vue' });
      expect(parseSFC).toHaveBeenCalled();
    });

    it('should use cache for unchanged files', async () => {
      vi.mocked(isDev).mockReturnValue(true);
      mockReadFile.mockResolvedValue('const cached = 1;');
      vi.mocked(isExcludedFile).mockReturnValue(false);
      vi.mocked(isJsTypeFile).mockReturnValue(true);

      const mockBuild = { onLoad: vi.fn() };
      const plugin = EsbuildCodeInspectorPlugin({ bundler: 'esbuild', output: '/test' });
      plugin.setup(mockBuild);
      const onLoadCallback = mockBuild.onLoad.mock.calls[0][1];
      vi.mocked(transformCode).mockClear();

      // First call - should transform
      await onLoadCallback({ path: '/test/cached-unique-file-2.tsx' });
      const callCount1 = vi.mocked(transformCode).mock.calls.length;

      // Second call with same content - should use cache
      await onLoadCallback({ path: '/test/cached-unique-file-2.tsx' });
      const callCount2 = vi.mocked(transformCode).mock.calls.length;

      // transformCode should only be called once for same file with same content
      expect(callCount2).toBe(callCount1);
    });
  });
});
