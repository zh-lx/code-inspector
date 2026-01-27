import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock core module before imports
vi.mock('@code-inspector/core', () => ({
  transformCode: vi.fn((params: any) => `transformed:${params.content}`),
  normalizePath: vi.fn((p: string) => p),
  parseSFC: vi.fn((content: string) => ({
    descriptor: {
      script: { content: '<script>const a = 1;</script>' },
      scriptSetup: { content: '<script setup>const b = 2;</script>' },
    },
  })),
  isJsTypeFile: vi.fn((file: string) => /\.(jsx|tsx|js|ts|mjs|mts)$/.test(file)),
  getMappingFilePath: vi.fn((file: string) => file),
  isExcludedFile: vi.fn(() => false),
}));

import WebpackCodeInspectorLoader from '@/webpack/src/loader';
import {
  transformCode,
  normalizePath,
  parseSFC,
  isJsTypeFile,
  getMappingFilePath,
  isExcludedFile,
} from '@code-inspector/core';

describe('WebpackCodeInspectorLoader', () => {
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      cacheable: vi.fn(),
      resourcePath: '/test/file.tsx',
      resource: '/test/file.tsx',
      query: {
        escapeTags: [],
        mappings: {},
        pathType: 'relative',
      },
    };
  });

  describe('caching', () => {
    it('should call cacheable when available', async () => {
      const result = await WebpackCodeInspectorLoader.call(mockContext, 'const x = 1;');
      expect(mockContext.cacheable).toHaveBeenCalledWith(true);
    });

    it('should work when cacheable is not available', async () => {
      delete mockContext.cacheable;
      const result = await WebpackCodeInspectorLoader.call(mockContext, 'const x = 1;');
      expect(result).toBeDefined();
    });
  });

  describe('excluded files', () => {
    it('should return original content for excluded files', async () => {
      vi.mocked(isExcludedFile).mockReturnValueOnce(true);
      const content = 'const x = 1;';
      const result = await WebpackCodeInspectorLoader.call(mockContext, content);
      expect(result).toBe(content);
    });
  });

  describe('JSX files', () => {
    it('should transform JSX files', async () => {
      mockContext.resourcePath = '/test/file.tsx';
      mockContext.resource = '/test/file.tsx';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(true);

      const result = await WebpackCodeInspectorLoader.call(mockContext, 'const x = 1;');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'jsx',
        })
      );
    });

    it('should transform Vue files with JSX params', async () => {
      mockContext.resourcePath = '/test/file.vue';
      mockContext.resource = '/test/file.vue?isJsx';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const result = await WebpackCodeInspectorLoader.call(mockContext, 'const x = 1;');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'jsx',
        })
      );
    });

    it('should transform Vue files with isTsx param', async () => {
      mockContext.resourcePath = '/test/file.vue';
      mockContext.resource = '/test/file.vue?isTsx';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const result = await WebpackCodeInspectorLoader.call(mockContext, 'const x = 1;');
      expect(transformCode).toHaveBeenCalled();
    });

    it('should transform Vue files with lang.jsx param', async () => {
      mockContext.resourcePath = '/test/file.vue';
      mockContext.resource = '/test/file.vue?lang.jsx';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const result = await WebpackCodeInspectorLoader.call(mockContext, 'const x = 1;');
      expect(transformCode).toHaveBeenCalled();
    });

    it('should transform Vue files with lang.tsx param', async () => {
      mockContext.resourcePath = '/test/file.vue';
      mockContext.resource = '/test/file.vue?lang.tsx';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const result = await WebpackCodeInspectorLoader.call(mockContext, 'const x = 1;');
      expect(transformCode).toHaveBeenCalled();
    });
  });

  describe('Vue JSX with script', () => {
    it('should transform Vue files with lang=tsx', async () => {
      mockContext.resourcePath = '/test/file.vue';
      mockContext.resource = '/test/file.vue?lang=tsx';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const content = '<template></template><script lang="tsx">const a = 1;</script>';
      const result = await WebpackCodeInspectorLoader.call(mockContext, content);
      expect(parseSFC).toHaveBeenCalled();
    });

    it('should transform Vue files with lang=jsx', async () => {
      mockContext.resourcePath = '/test/file.vue';
      mockContext.resource = '/test/file.vue?lang=jsx';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const content = '<template></template><script lang="jsx">const a = 1;</script>';
      const result = await WebpackCodeInspectorLoader.call(mockContext, content);
      expect(parseSFC).toHaveBeenCalled();
    });

    it('should handle Vue files with only script (no scriptSetup)', async () => {
      mockContext.resourcePath = '/test/file.vue';
      mockContext.resource = '/test/file.vue?lang=tsx';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      vi.mocked(parseSFC).mockReturnValueOnce({
        descriptor: {
          script: { content: 'const a = 1;' },
          scriptSetup: null,
        },
      } as any);

      const content = '<script lang="tsx">const a = 1;</script>';
      const result = await WebpackCodeInspectorLoader.call(mockContext, content);
      expect(transformCode).toHaveBeenCalled();
    });

    it('should handle Vue files with only scriptSetup (no script)', async () => {
      mockContext.resourcePath = '/test/file.vue';
      mockContext.resource = '/test/file.vue?lang=tsx';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);
      vi.mocked(parseSFC).mockReturnValueOnce({
        descriptor: {
          script: null,
          scriptSetup: { content: 'const b = 2;' },
        },
      } as any);

      const content = '<script setup lang="tsx">const b = 2;</script>';
      const result = await WebpackCodeInspectorLoader.call(mockContext, content);
      expect(transformCode).toHaveBeenCalled();
    });
  });

  describe('Vue template files', () => {
    it('should transform Vue files without type=style or type=script', async () => {
      mockContext.resourcePath = '/test/file.vue';
      mockContext.resource = '/test/file.vue';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const result = await WebpackCodeInspectorLoader.call(mockContext, '<template></template>');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'vue',
        })
      );
    });

    it('should transform HTML files with vue type=template', async () => {
      mockContext.resourcePath = '/test/template.html';
      mockContext.resource = '/test/template.html?type=template&vue';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const result = await WebpackCodeInspectorLoader.call(mockContext, '<div></div>');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'vue',
        })
      );
    });

    it('should not transform Vue files with type=style', async () => {
      mockContext.resourcePath = '/test/file.vue';
      mockContext.resource = '/test/file.vue?type=style';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const content = '.class { color: red; }';
      const result = await WebpackCodeInspectorLoader.call(mockContext, content);
      expect(result).toBe(content);
    });

    it('should not transform Vue files with type=script', async () => {
      mockContext.resourcePath = '/test/file.vue';
      mockContext.resource = '/test/file.vue?type=script';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const content = 'export default {}';
      const result = await WebpackCodeInspectorLoader.call(mockContext, content);
      expect(result).toBe(content);
    });

    it('should not transform Vue files with raw param', async () => {
      mockContext.resourcePath = '/test/file.vue';
      mockContext.resource = '/test/file.vue?raw';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const content = '<template></template>';
      const result = await WebpackCodeInspectorLoader.call(mockContext, content);
      expect(result).toBe(content);
    });
  });

  describe('Svelte files', () => {
    it('should transform Svelte files', async () => {
      mockContext.resourcePath = '/test/file.svelte';
      mockContext.resource = '/test/file.svelte';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const result = await WebpackCodeInspectorLoader.call(mockContext, '<div></div>');
      expect(transformCode).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'svelte',
        })
      );
    });
  });

  describe('other files', () => {
    it('should return original content for unsupported files', async () => {
      mockContext.resourcePath = '/test/file.css';
      mockContext.resource = '/test/file.css';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(false);

      const content = '.class { color: red; }';
      const result = await WebpackCodeInspectorLoader.call(mockContext, content);
      expect(result).toBe(content);
    });
  });

  describe('options handling', () => {
    it('should handle empty options object', async () => {
      mockContext.query = {};
      mockContext.resourcePath = '/test/file.tsx';
      mockContext.resource = '/test/file.tsx';
      vi.mocked(isJsTypeFile).mockReturnValueOnce(true);

      const result = await WebpackCodeInspectorLoader.call(mockContext, 'const x = 1;');
      expect(result).toBeDefined();
    });
  });
});
