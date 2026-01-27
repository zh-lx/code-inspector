import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock core module before imports
vi.mock('@code-inspector/core', () => ({
  CodeOptions: {},
  RecordInfo: {},
  fileURLToPath: vi.fn((url: string) => url.replace('file://', '')),
  getCodeWithWebComponent: vi.fn(async () => 'injected-code'),
  getProjectRecord: vi.fn(() => ({ previousPort: 3000 })),
  isDev: vi.fn((dev: boolean | undefined, condition: boolean) => dev ?? condition),
  isNextjsProject: vi.fn(() => false),
}));

// Mock path
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    dirname: vi.fn((p: string) => p.replace(/\/[^/]+$/, '')),
    resolve: vi.fn((...args: string[]) => args.join('/')),
  };
});

// Mock entry module
vi.mock('@/webpack/src/entry', () => ({
  getWebpackEntrys: vi.fn(() => Promise.resolve(['/test/entry.js'])),
}));

import WebpackCodeInspectorPlugin from '@/webpack/src/index';
import {
  getCodeWithWebComponent,
  getProjectRecord,
  isDev,
  isNextjsProject,
} from '@code-inspector/core';
import { getWebpackEntrys } from '@/webpack/src/entry';

describe('WebpackCodeInspectorPlugin', () => {
  let mockCompiler: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCompiler = {
      options: {
        mode: 'development',
        entry: './src/index.js',
        context: '/test/project',
        module: {
          rules: [],
        },
        cache: false,
      },
      hooks: {
        emit: {
          tapAsync: vi.fn(),
        },
      },
    };
  });

  describe('constructor', () => {
    it('should store options', () => {
      const options = { bundler: 'webpack' as const, output: '/test' };
      const plugin = new WebpackCodeInspectorPlugin(options);
      expect(plugin.options).toBe(options);
    });
  });

  describe('apply', () => {
    it('should return early when close is true', async () => {
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
        close: true,
      });

      await plugin.apply(mockCompiler);

      expect(mockCompiler.hooks.emit.tapAsync).not.toHaveBeenCalled();
    });

    it('should return early when not in dev mode', async () => {
      vi.mocked(isDev).mockReturnValueOnce(false);
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
      });

      await plugin.apply(mockCompiler);

      expect(mockCompiler.hooks.emit.tapAsync).not.toHaveBeenCalled();
    });

    it('should apply loader and emit hook in dev mode', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
      });

      await plugin.apply(mockCompiler);

      expect(mockCompiler.options.module.rules.length).toBeGreaterThan(0);
      expect(mockCompiler.hooks.emit.tapAsync).toHaveBeenCalledWith(
        'WebpackCodeInspectorPlugin',
        expect.any(Function)
      );
    });

    it('should skip htmlScript injection when specified in skipSnippets', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
        skipSnippets: ['htmlScript'],
      });

      await plugin.apply(mockCompiler);

      expect(mockCompiler.hooks.emit.tapAsync).not.toHaveBeenCalled();
    });

    it('should handle compiler without hooks.emit', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      delete mockCompiler.hooks;
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
      });

      await plugin.apply(mockCompiler);

      expect(mockCompiler.options.module.rules.length).toBeGreaterThan(0);
    });
  });

  describe('filesystem cache handling', () => {
    it('should handle filesystem cache with cache option enabled', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      mockCompiler.options.cache = { type: 'filesystem' };

      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
        cache: true,
        port: 5000,
      });

      await plugin.apply(mockCompiler);

      expect(getCodeWithWebComponent).toHaveBeenCalled();
    });

    it('should set cache version when cache option is disabled', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      mockCompiler.options.cache = { type: 'filesystem' };

      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
        cache: false,
      });

      await plugin.apply(mockCompiler);

      expect(mockCompiler.options.cache.version).toMatch(/^code-inspector-/);
    });

    it('should use previousPort when port is not specified', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      vi.mocked(getProjectRecord).mockReturnValueOnce({ previousPort: 4000 } as any);
      mockCompiler.options.cache = { type: 'filesystem' };

      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
        cache: true,
      });

      await plugin.apply(mockCompiler);

      expect(getProjectRecord).toHaveBeenCalled();
    });
  });

  describe('emit hook - replaceHtml', () => {
    it('should replace head tag in HTML files', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
      });

      await plugin.apply(mockCompiler);

      // Get the emit callback
      const emitCallback = mockCompiler.hooks.emit.tapAsync.mock.calls[0][1];

      const assets: Record<string, any> = {
        'index.html': {
          source: () => '<head><title>Test</title></head>',
        },
      };
      const mockCompilation = {
        getAssets: vi.fn().mockResolvedValue(assets),
      };
      const cb = vi.fn();

      await emitCallback(mockCompilation, cb);

      // Verify the HTML was replaced and new source/size functions work
      const newAsset = assets['index.html'];
      expect(newAsset.source()).toContain('injected-code');
      expect(newAsset.source()).toContain('<head>');
      expect(newAsset.size()).toBeGreaterThan(0);
      expect(cb).toHaveBeenCalled();
    });

    it('should use compilation.assets when getAssets is not available', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
      });

      await plugin.apply(mockCompiler);

      const emitCallback = mockCompiler.hooks.emit.tapAsync.mock.calls[0][1];

      const assets: Record<string, any> = {
        'index.html': {
          source: () => '<head><title>Test</title></head>',
        },
      };
      const mockCompilation = {
        assets,
      };
      const cb = vi.fn();

      await emitCallback(mockCompilation, cb);

      // Verify the HTML was replaced
      const newAsset = assets['index.html'];
      expect(newAsset.source()).toContain('injected-code');
      expect(newAsset.size()).toBeGreaterThan(0);
      expect(cb).toHaveBeenCalled();
    });

    it('should skip non-HTML files', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
      });

      await plugin.apply(mockCompiler);

      const emitCallback = mockCompiler.hooks.emit.tapAsync.mock.calls[0][1];

      const mockCompilation = {
        assets: {
          'bundle.js': {
            source: () => 'console.log("test")',
          },
        },
      };
      const cb = vi.fn();

      await emitCallback(mockCompilation, cb);

      expect(cb).toHaveBeenCalled();
    });

    it('should handle assets with non-string source', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
      });

      await plugin.apply(mockCompiler);

      const emitCallback = mockCompiler.hooks.emit.tapAsync.mock.calls[0][1];

      const mockCompilation = {
        assets: {
          'index.html': {
            source: () => Buffer.from('<head></head>'),
          },
        },
      };
      const cb = vi.fn();

      await emitCallback(mockCompilation, cb);

      expect(cb).toHaveBeenCalled();
    });
  });

  describe('applyLoader', () => {
    it('should add loaders with enforcePre=true by default', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
      });

      await plugin.apply(mockCompiler);

      const rules = mockCompiler.options.module.rules;
      expect(rules.some((r: any) => r.enforce === 'pre')).toBe(true);
    });

    it('should not add enforce when enforcePre=false', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
        enforcePre: false,
      });

      await plugin.apply(mockCompiler);

      const rules = mockCompiler.options.module.rules;
      // Some rules should not have enforce when enforcePre is false
      expect(rules.some((r: any) => !r.enforce)).toBe(true);
    });

    it('should use custom match regex when provided', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const customMatch = /\.custom$/;
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
        match: customMatch,
      });

      await plugin.apply(mockCompiler);

      const rules = mockCompiler.options.module.rules;
      expect(rules.some((r: any) => r.test === customMatch)).toBe(true);
    });

    it('should use injectTo when provided', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
        injectTo: '/custom/entry.js',
      });

      await plugin.apply(mockCompiler);

      const rules = mockCompiler.options.module.rules;
      expect(rules.some((r: any) => r.resource === '/custom/entry.js')).toBe(true);
    });

    it('should set enforce to pre for nextjs projects', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      vi.mocked(isNextjsProject).mockReturnValueOnce(true);

      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
      });

      await plugin.apply(mockCompiler);

      const rules = mockCompiler.options.module.rules;
      const injectLoader = rules.find((r: any) =>
        r.use?.some?.((u: any) => u.loader?.includes?.('inject-loader'))
      );
      expect(injectLoader?.enforce).toBe('pre');
    });
  });

  describe('rspack persistent cache', () => {
    it('should handle rspack experiments.cache', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      mockCompiler.options.experiments = { cache: { type: 'filesystem' } };

      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'rspack',
        output: '/test',
        cache: true,
      });

      await plugin.apply(mockCompiler);

      expect(getCodeWithWebComponent).toHaveBeenCalled();
    });
  });

  describe('compiler compatibility', () => {
    it('should handle nested compiler structure', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      const nestedCompiler = {
        compiler: mockCompiler,
        options: {},
      };

      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
      });

      await plugin.apply(nestedCompiler);

      expect(mockCompiler.options.module.rules.length).toBeGreaterThan(0);
    });

    it('should handle module.loaders instead of module.rules', async () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      mockCompiler.options.module = { loaders: [] };

      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
      });

      await plugin.apply(mockCompiler);

      expect(mockCompiler.options.module.loaders.length).toBeGreaterThan(0);
    });
  });

  describe('environment detection', () => {
    it('should detect development via process.env.NODE_ENV', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      mockCompiler.options.mode = undefined;

      vi.mocked(isDev).mockImplementation((dev, condition) => dev ?? condition);

      const plugin = new WebpackCodeInspectorPlugin({
        bundler: 'webpack',
        output: '/test',
      });

      await plugin.apply(mockCompiler);

      process.env.NODE_ENV = originalEnv;
    });
  });
});
