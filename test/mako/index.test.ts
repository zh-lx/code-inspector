import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock core module before imports
vi.mock('@code-inspector/core', () => ({
  CodeOptions: {},
  RecordInfo: {},
  getCodeWithWebComponent: vi.fn(async ({ code }: { code: string }) => `injected:${code}`),
  getMappingFilePath: vi.fn((file: string) => file),
  isDev: vi.fn((dev: boolean | undefined, condition: boolean) => dev ?? condition),
  isExcludedFile: vi.fn(() => false),
  isJsTypeFile: vi.fn((file: string) => /\.(jsx|tsx|js|ts|mjs|mts)$/.test(file)),
  normalizePath: vi.fn((p: string) => p),
  transformCode: vi.fn((params: any) => `transformed:${params.content}`),
}));

import { MakoCodeInspectorPlugin } from '@/mako/src/index';
import {
  transformCode,
  getCodeWithWebComponent,
  isDev,
  isJsTypeFile,
  isExcludedFile,
} from '@code-inspector/core';

describe('MakoCodeInspectorPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic plugin structure', () => {
    it('should return plugin with correct name', () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = MakoCodeInspectorPlugin({ bundler: 'mako', output: '/test' });
      expect(plugin.name).toBe('@code-inspector/mako');
    });

    it('should return plugin with only name when close is true', () => {
      const plugin = MakoCodeInspectorPlugin({
        bundler: 'mako',
        output: '/test',
        close: true,
      });
      expect(plugin).toEqual({ name: '@code-inspector/mako' });
    });

    it('should return plugin with only name when not in dev mode', () => {
      vi.mocked(isDev).mockReturnValueOnce(false);
      const plugin = MakoCodeInspectorPlugin({ bundler: 'mako', output: '/test' });
      expect(plugin).toEqual({ name: '@code-inspector/mako' });
    });

    it('should have enforce: pre by default', () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = MakoCodeInspectorPlugin({ bundler: 'mako', output: '/test' });
      expect(plugin.enforce).toBe('pre');
    });

    it('should have enforce: post when enforcePre is false', () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = MakoCodeInspectorPlugin({
        bundler: 'mako',
        output: '/test',
        enforcePre: false,
      });
      expect(plugin.enforce).toBe('post');
    });
  });

  describe('transform', () => {
    it('should return undefined for excluded files', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      vi.mocked(isExcludedFile).mockReturnValueOnce(true);
      const plugin = MakoCodeInspectorPlugin({ bundler: 'mako', output: '/test' });
      const result = await plugin.transform('const x = 1;', '/test/file.tsx');
      expect(result).toBeUndefined();
    });

    it('should return undefined for .umi files', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = MakoCodeInspectorPlugin({ bundler: 'mako', output: '/test' });
      const result = await plugin.transform('const x = 1;', '/test/.umi/file.tsx');
      expect(result).toBeUndefined();
    });

    it('should return undefined when match regex does not match', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = MakoCodeInspectorPlugin({
        bundler: 'mako',
        output: '/test',
        match: /\.custom$/,
      });
      const result = await plugin.transform('const x = 1;', '/test/file.tsx');
      expect(result).toBeUndefined();
    });

    it('should transform JS type files', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      vi.mocked(isJsTypeFile).mockReturnValueOnce(true);
      const plugin = MakoCodeInspectorPlugin({ bundler: 'mako', output: '/test' });
      const result = await plugin.transform('const x = 1;', '/test/file.tsx');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'jsx',
        })
      );
      expect(result).toEqual({
        content: expect.any(String),
        type: 'tsx',
      });
    });

    it('should return undefined for non-JS files', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = MakoCodeInspectorPlugin({ bundler: 'mako', output: '/test' });
      const result = await plugin.transform('.class {}', '/test/file.css');
      expect(result).toBeUndefined();
    });

    it('should call getCodeWithWebComponent', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      vi.mocked(isJsTypeFile).mockReturnValueOnce(true);
      const plugin = MakoCodeInspectorPlugin({ bundler: 'mako', output: '/test' });
      await plugin.transform('const x = 1;', '/test/file.tsx');
      expect(getCodeWithWebComponent).toHaveBeenCalled();
    });
  });
});
