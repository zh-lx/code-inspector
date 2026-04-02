import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock core module before imports
vi.mock('@code-inspector/core', () => ({
  CodeOptions: {},
  RecordInfo: {},
  isDev: vi.fn((dev: boolean | undefined, condition: boolean) => dev ?? condition),
  isNextGET16: vi.fn(() => false),
}));

// Mock path
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    resolve: vi.fn((...args: string[]) => args.join('/')),
  };
});

import {
  resolveWebpackEntry,
  TurbopackCodeInspectorPlugin,
} from '@/turbopack/src/index';
import { isDev, isNextGET16 } from '@code-inspector/core';

describe('TurbopackCodeInspectorPlugin', () => {
  const originalRequire = global.require;

  beforeEach(() => {
    vi.clearAllMocks();
    global.require = {
      resolve: vi.fn(() => '/pkg/webpack/index.js'),
    } as any;
  });

  afterEach(() => {
    global.require = originalRequire;
  });

  describe('basic plugin structure', () => {
    it('should return empty object when close is true', () => {
      const plugin = TurbopackCodeInspectorPlugin({
        bundler: 'turbopack',
        output: '/test',
        close: true,
      });
      expect(plugin).toEqual({});
    });

    it('should return empty object when not in dev mode', () => {
      vi.mocked(isDev).mockReturnValueOnce(false);
      const plugin = TurbopackCodeInspectorPlugin({
        bundler: 'turbopack',
        output: '/test',
      });
      expect(plugin).toEqual({});
    });
  });

  describe('loader configuration', () => {
    it('should return loader config in dev mode', () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      vi.mocked(isNextGET16).mockReturnValueOnce(false);

      const plugin = TurbopackCodeInspectorPlugin({
        bundler: 'turbopack',
        output: '/test',
      });

      // Should have a key for file matching pattern
      const keys = Object.keys(plugin);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should use different file pattern for Next.js >= 16', () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      vi.mocked(isNextGET16).mockReturnValueOnce(true);

      const plugin = TurbopackCodeInspectorPlugin({
        bundler: 'turbopack',
        output: '/test',
      });

      const keys = Object.keys(plugin);
      expect(keys[0]).toBe('**/*.{jsx,tsx,js,ts,mjs,mts}');
    });

    it('should use specific file pattern for Next.js < 16', () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      vi.mocked(isNextGET16).mockReturnValueOnce(false);

      const plugin = TurbopackCodeInspectorPlugin({
        bundler: 'turbopack',
        output: '/test',
      });

      const keys = Object.keys(plugin);
      // Should contain the validFiles pattern
      expect(keys[0]).toContain('*.jsx');
    });

    it('should include loader and inject-loader', () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      vi.mocked(isNextGET16).mockReturnValueOnce(true);

      const plugin = TurbopackCodeInspectorPlugin({
        bundler: 'turbopack',
        output: '/test',
      });

      const key = Object.keys(plugin)[0];
      const loaders = plugin[key].loaders;

      expect(loaders.length).toBe(2);
      expect(loaders[0].loader).toContain('loader.js');
      expect(loaders[1].loader).toContain('inject-loader.js');
    });

    it('should pass options to loaders', () => {
      vi.mocked(isDev).mockReturnValueOnce(true);
      vi.mocked(isNextGET16).mockReturnValueOnce(true);

      const options = {
        bundler: 'turbopack' as const,
        output: '/test',
        escapeTags: ['div'],
      };
      const plugin = TurbopackCodeInspectorPlugin(options);

      const key = Object.keys(plugin)[0];
      const loaderOptions = plugin[key].loaders[0].options;

      expect(loaderOptions.escapeTags).toEqual(['div']);
      expect(loaderOptions.record).toBeDefined();
    });
  });

  describe('resolveWebpackEntry', () => {
    it('should return null when no resolver is provided', () => {
      expect(resolveWebpackEntry({})).toBeNull();
    });

    it('should use require.resolve when provided', () => {
      expect(
        resolveWebpackEntry({
          requireResolve: vi.fn(() => '/pkg/webpack/index.js'),
        }),
      ).toBe('/pkg/webpack/index.js');
    });

    it('should prefer import.meta.resolve when provided', () => {
      expect(
        resolveWebpackEntry({
          requireResolve: vi.fn(() => '/pkg/webpack/index.js'),
          importMetaResolve: vi.fn(() => 'file:///esm/webpack/index.js'),
        }),
      ).toBe('/esm/webpack/index.js');
    });
  });
});
