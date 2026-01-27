import { describe, it, expect, vi } from 'vitest';

// Mock core module before imports
vi.mock('@code-inspector/core', () => ({
  normalizePath: vi.fn((p: string) => p.replace(/\\/g, '/')),
}));

import { getWebpackEntrys } from '@/webpack/src/entry';

describe('getWebpackEntrys', () => {
  const context = '/test/project';

  describe('empty inputs', () => {
    it('should return empty array when entry is undefined', async () => {
      const result = await getWebpackEntrys(undefined as any, context);
      expect(result).toEqual([]);
    });

    it('should return empty array when context is undefined', async () => {
      const result = await getWebpackEntrys('./src/index.js', undefined as any);
      expect(result).toEqual([]);
    });

    it('should return empty array when both are undefined', async () => {
      const result = await getWebpackEntrys(undefined as any, undefined as any);
      expect(result).toEqual([]);
    });
  });

  describe('string entry', () => {
    it('should handle relative path string entry', async () => {
      const result = await getWebpackEntrys('./src/index.js', context);
      expect(result).toEqual(['/test/project/src/index.js']);
    });

    it('should handle absolute path string entry', async () => {
      const result = await getWebpackEntrys('/absolute/path/index.js', context);
      expect(result).toEqual(['/absolute/path/index.js']);
    });

    it('should return empty string for non-relative non-absolute paths', async () => {
      const result = await getWebpackEntrys('node_modules/package/index.js', context);
      expect(result).toEqual([]);
    });
  });

  describe('array entry', () => {
    it('should handle array of relative paths', async () => {
      const result = await getWebpackEntrys(['./src/a.js', './src/b.js'], context);
      expect(result).toEqual(['/test/project/src/a.js', '/test/project/src/b.js']);
    });

    it('should handle array with mixed paths', async () => {
      const result = await getWebpackEntrys(
        ['./src/a.js', '/absolute/b.js', 'node_modules/c.js'],
        context
      );
      expect(result).toEqual(['/test/project/src/a.js', '/absolute/b.js']);
    });
  });

  describe('object entry', () => {
    it('should handle object entry with string values', async () => {
      const result = await getWebpackEntrys(
        {
          main: './src/main.js',
          vendor: './src/vendor.js',
        },
        context
      );
      expect(result).toEqual(['/test/project/src/main.js', '/test/project/src/vendor.js']);
    });

    it('should handle object entry with array values', async () => {
      const result = await getWebpackEntrys(
        {
          main: ['./src/a.js', './src/b.js'],
        },
        context
      );
      expect(result).toEqual(['/test/project/src/a.js', '/test/project/src/b.js']);
    });

    it('should handle object entry with EntryDescription (import property)', async () => {
      const result = await getWebpackEntrys(
        {
          main: { import: './src/main.js' },
          vendor: { import: ['./src/vendor1.js', './src/vendor2.js'] },
        },
        context
      );
      expect(result).toEqual([
        '/test/project/src/main.js',
        '/test/project/src/vendor1.js',
        '/test/project/src/vendor2.js',
      ]);
    });
  });

  describe('function entry', () => {
    it('should handle sync function entry returning string', async () => {
      const result = await getWebpackEntrys(() => './src/index.js', context);
      expect(result).toEqual(['/test/project/src/index.js']);
    });

    it('should handle async function entry returning string', async () => {
      const result = await getWebpackEntrys(
        async () => './src/index.js',
        context
      );
      expect(result).toEqual(['/test/project/src/index.js']);
    });

    it('should handle async function entry returning object', async () => {
      const result = await getWebpackEntrys(
        async () => ({
          main: './src/main.js',
        }),
        context
      );
      expect(result).toEqual(['/test/project/src/main.js']);
    });
  });
});
