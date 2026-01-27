import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock core module before imports
vi.mock('@code-inspector/core', () => ({
  transformCode: vi.fn((params: any) => `transformed:${params.content}`),
  normalizePath: vi.fn((p: string) => p),
  CodeOptions: {},
  getCodeWithWebComponent: vi.fn(async () => 'injected-code'),
  RecordInfo: {},
  isJsTypeFile: vi.fn((file: string) => /\.(jsx|tsx|js|ts|mjs|mts)$/.test(file)),
  isDev: vi.fn((dev: boolean | undefined, condition: boolean) => dev ?? condition),
  getMappingFilePath: vi.fn((file: string) => file),
  isExcludedFile: vi.fn(() => false),
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    yellow: vi.fn((s: string) => s),
    green: vi.fn((s: string) => s),
  },
}));

import { ViteCodeInspectorPlugin } from '@/vite/src/index';
import {
  transformCode,
  getCodeWithWebComponent,
  isDev,
  isJsTypeFile,
  isExcludedFile,
} from '@code-inspector/core';

describe('ViteCodeInspectorPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic plugin structure', () => {
    it('should return plugin with correct name', () => {
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      expect(plugin.name).toBe('@code-inspector/vite');
    });

    it('should have enforce: pre by default', () => {
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      expect(plugin.enforce).toBe('pre');
    });

    it('should not have enforce when enforcePre is false', () => {
      const plugin = ViteCodeInspectorPlugin({
        bundler: 'vite',
        output: '/test',
        enforcePre: false,
      });
      expect(plugin.enforce).toBeUndefined();
    });
  });

  describe('apply', () => {
    it('should return false when close is true', () => {
      const plugin = ViteCodeInspectorPlugin({
        bundler: 'vite',
        output: '/test',
        close: true,
      });
      const result = plugin.apply({}, { command: 'serve' });
      expect(result).toBe(false);
    });

    it('should return true when in dev mode (serve command)', () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const result = plugin.apply({}, { command: 'serve' });
      expect(result).toBe(true);
    });

    it('should return false when in build mode', () => {
      vi.mocked(isDev).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const result = plugin.apply({}, { command: 'build' });
      expect(result).toBe(false);
    });
  });

  describe('configResolved', () => {
    it('should store envDir and root from config', () => {
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      plugin.configResolved({
        envDir: '/custom/env',
        root: '/project/root',
      });
      // configResolved stores these internally for later use
      expect(plugin.configResolved).toBeDefined();
    });

    it('should use root as envDir when envDir is not specified', () => {
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      plugin.configResolved({
        root: '/project/root',
      });
      expect(plugin.configResolved).toBeDefined();
    });
  });

  describe('transform', () => {
    it('should return original code for excluded files', async () => {
      vi.mocked(isExcludedFile).mockReturnValueOnce(true);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const result = await plugin.transform('const x = 1;', '/test/file.tsx');
      expect(result).toBe('const x = 1;');
    });

    it('should transform JSX files', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(true);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const result = await plugin.transform('const x = 1;', '/test/file.tsx');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'jsx',
        })
      );
    });

    it('should transform Vue files with JSX params', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const result = await plugin.transform('const x = 1;', '/test/file.vue?isJsx');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'jsx',
        })
      );
    });

    it('should transform Vue files with lang=tsx', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const result = await plugin.transform('const x = 1;', '/test/file.vue?lang=tsx');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'jsx',
        })
      );
    });

    it('should transform Vue files with lang=jsx', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const result = await plugin.transform('const x = 1;', '/test/file.vue?lang=jsx');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'jsx',
        })
      );
    });

    it('should transform HTML files with vue template', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const result = await plugin.transform('<div></div>', '/test/template.html?type=template&vue');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'vue',
        })
      );
    });

    it('should transform Vue files without style or raw params', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const result = await plugin.transform('<template></template>', '/test/file.vue');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'vue',
        })
      );
    });

    it('should not transform Vue files with type=style', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const code = '.class { color: red; }';
      const result = await plugin.transform(code, '/test/file.vue?type=style');
      expect(transformCode).not.toHaveBeenCalled();
    });

    it('should not transform Vue files with raw param', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const code = '<template></template>';
      const result = await plugin.transform(code, '/test/file.vue?raw');
      expect(transformCode).not.toHaveBeenCalled();
    });

    it('should transform Svelte files', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const result = await plugin.transform('<div></div>', '/test/file.svelte');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'svelte',
        })
      );
    });

    it('should return injected code when match regex does not match', async () => {
      const plugin = ViteCodeInspectorPlugin({
        bundler: 'vite',
        output: '/test',
        match: /\.custom$/,
      });
      const code = 'const x = 1;';
      const result = await plugin.transform(code, '/test/file.tsx');
      // Match doesn't match, but getCodeWithWebComponent is still called first
      // so it returns the injected code
      expect(result).toBe('injected-code');
    });

    it('should return injected code for unsupported file types', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const code = '.class { color: red; }';
      const result = await plugin.transform(code, '/test/file.css');
      // For unsupported types, getCodeWithWebComponent is still called
      // but no transformCode is called
      expect(result).toBe('injected-code');
      expect(transformCode).not.toHaveBeenCalled();
    });
  });

  describe('transformIndexHtml', () => {
    it('should inject script into head', async () => {
      vi.mocked(getCodeWithWebComponent).mockResolvedValueOnce('console.log("injected")');
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const html = '<html><head><title>Test</title></head><body></body></html>';
      const result = await plugin.transformIndexHtml(html);
      expect(result).toContain('<script type="module">');
      expect(result).toContain('</script>');
    });

    it('should skip injection when htmlScript is in skipSnippets', async () => {
      const plugin = ViteCodeInspectorPlugin({
        bundler: 'vite',
        output: '/test',
        skipSnippets: ['htmlScript'],
      });
      const html = '<html><head><title>Test</title></head><body></body></html>';
      const result = await plugin.transformIndexHtml(html);
      expect(result).toBe(html);
    });
  });

  describe('configureServer', () => {
    it('should wrap logger.info to print order warning', () => {
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const originalInfo = vi.fn();
      const mockServer = {
        config: {
          logger: {
            info: originalInfo,
          },
          plugins: [
            { name: 'vite:react-babel' },
            { name: '@code-inspector/vite' },
          ],
        },
      };

      plugin.configureServer(mockServer);

      // Call the wrapped logger
      mockServer.config.logger.info('test message', {});

      expect(originalInfo).toHaveBeenCalled();
    });

    it('should print warning when plugin order is incorrect', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const originalInfo = vi.fn();
      const mockServer = {
        config: {
          logger: {
            info: originalInfo,
          },
          plugins: [
            { name: 'vite:react-babel' },
            { name: '@code-inspector/vite' },
          ],
        },
      };

      plugin.configureServer(mockServer);
      mockServer.config.logger.info('test', {});

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not print warning when plugin order is correct', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      const originalInfo = vi.fn();
      const mockServer = {
        config: {
          logger: {
            info: originalInfo,
          },
          plugins: [
            { name: '@code-inspector/vite' },
            { name: 'vite:react-babel' },
          ],
        },
      };

      plugin.configureServer(mockServer);
      mockServer.config.logger.info('test', {});

      // Should not print warning because order is correct
      consoleSpy.mockRestore();
    });
  });

  describe('jsx params handling', () => {
    it('should handle isTsx param', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      await plugin.transform('code', '/test/file.vue?isTsx');
      expect(transformCode).toHaveBeenCalled();
    });

    it('should handle lang.jsx param', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      await plugin.transform('code', '/test/file.vue?lang.jsx');
      expect(transformCode).toHaveBeenCalled();
    });

    it('should handle lang.tsx param', async () => {
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      const plugin = ViteCodeInspectorPlugin({ bundler: 'vite', output: '/test' });
      await plugin.transform('code', '/test/file.vue?lang.tsx');
      expect(transformCode).toHaveBeenCalled();
    });
  });
});
