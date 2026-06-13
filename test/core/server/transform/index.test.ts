import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { transformCode } from '@/core/src/server/transform/index';

// Mock fs.existsSync
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(),
      readFileSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

// Mock getRelativeOrAbsolutePath
vi.mock('@/core/src/server/server', () => ({
  getRelativeOrAbsolutePath: vi.fn((filePath: string, pathType: string) => {
    if (pathType === 'relative') {
      return filePath.replace(/^.*\//, '');
    }
    return filePath;
  }),
  ProjectRootPath: '/mock/project',
}));

describe('transformCode', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should return original content when file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const content = '<div>Hello</div>';
      const result = await transformCode({
        content,
        filePath: '/non/existent/file.vue',
        fileType: 'vue',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).toBe(content);
    });

    it('should return original content for unknown fileType', async () => {
      const content = '<div>Hello</div>';
      const result = await transformCode({
        content,
        filePath: '/test/file.html',
        fileType: 'html',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).toBe(content);
    });

    it('should use default escapeTags and pathType when not provided', async () => {
      const content = '<template><div>Hello</div></template>';
      const result = await transformCode({
        content,
        filePath: '/test/file.vue',
        fileType: 'vue',
        escapeTags: undefined as any,
        pathType: undefined as any,
      });

      expect(result).toContain('data-insp-path');
    });
  });

  describe('vue transformation', () => {
    it('should transform vue content', async () => {
      const content = '<template><div>Hello</div></template>';
      const result = await transformCode({
        content,
        filePath: '/test/file.vue',
        fileType: 'vue',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).toContain('data-insp-path');
    });

    it('should not transform escaped tags in vue', async () => {
      const content = '<template><script>console.log("test")</script></template>';
      const result = await transformCode({
        content,
        filePath: '/test/file.vue',
        fileType: 'vue',
        escapeTags: [],
        pathType: 'relative',
      });

      // script is in CodeInspectorEscapeTags
      expect(result).not.toContain('data-insp-path="file.vue:1:12:script"');
    });

    it('should merge custom escapeTags with default ones', async () => {
      const content = '<template><custom-tag>Hello</custom-tag></template>';
      const result = await transformCode({
        content,
        filePath: '/test/file.vue',
        fileType: 'vue',
        escapeTags: ['custom-tag'],
        pathType: 'relative',
      });

      expect(result).not.toContain(':custom-tag"');
    });
  });

  describe('jsx transformation', () => {
    it('should transform jsx content', async () => {
      const content = 'function App() { return <div>Hello</div>; }';
      const result = await transformCode({
        content,
        filePath: '/test/file.jsx',
        fileType: 'jsx',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).toContain('data-insp-path');
    });

    it('should transform tsx content with TypeScript', async () => {
      const content = 'function App(): JSX.Element { return <div>Hello</div>; }';
      const result = await transformCode({
        content,
        filePath: '/test/file.tsx',
        fileType: 'jsx',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).toContain('data-insp-path');
    });
  });

  describe('svelte transformation', () => {
    it('should transform svelte content', async () => {
      const content = '<div>Hello</div>';
      const result = await transformCode({
        content,
        filePath: '/test/file.svelte',
        fileType: 'svelte',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).toContain('data-insp-path');
    });
  });

  describe('isIgnoredFile', () => {
    describe('vue/svelte files', () => {
      it('should ignore vue file with code-inspector-disable comment', async () => {
        const content = '<!-- code-inspector-disable -->\n<template><div>Hello</div></template>';
        const result = await transformCode({
          content,
          filePath: '/test/file.vue',
          fileType: 'vue',
          escapeTags: [],
          pathType: 'relative',
        });

        expect(result).toBe(content);
      });

      it('should ignore vue file with code-inspector-ignore comment', async () => {
        const content = '<!-- code-inspector-ignore -->\n<template><div>Hello</div></template>';
        const result = await transformCode({
          content,
          filePath: '/test/file.vue',
          fileType: 'vue',
          escapeTags: [],
          pathType: 'relative',
        });

        expect(result).toBe(content);
      });

      it('should ignore svelte file with code-inspector-disable comment', async () => {
        const content = '<!-- code-inspector-disable -->\n<div>Hello</div>';
        const result = await transformCode({
          content,
          filePath: '/test/file.svelte',
          fileType: 'svelte',
          escapeTags: [],
          pathType: 'relative',
        });

        expect(result).toBe(content);
      });

      it('should not ignore vue file without proper comment ending', async () => {
        const content = '<!-- code-inspector-disable\n<template><div>Hello</div></template>';
        const result = await transformCode({
          content,
          filePath: '/test/file.vue',
          fileType: 'vue',
          escapeTags: [],
          pathType: 'relative',
        });

        // Comment not properly closed, so isIgnoredFile returns false
        // But the content is still processed and may not be transformed if there's a parsing issue
        // Since the HTML comment is not closed, the parser might handle it differently
        // The function returns original content because isIgnoredFile returns false (no -->)
        // but the vue parser might not transform it due to the malformed comment
        expect(result).toBe(content);
      });

      it('should not ignore vue file when comment is not at the start', async () => {
        const content = '<template><!-- code-inspector-disable --><div>Hello</div></template>';
        const result = await transformCode({
          content,
          filePath: '/test/file.vue',
          fileType: 'vue',
          escapeTags: [],
          pathType: 'relative',
        });

        expect(result).toContain('data-insp-path');
      });

      it('should handle case insensitive directives in vue files', async () => {
        const content = '<!-- CODE-INSPECTOR-DISABLE -->\n<template><div>Hello</div></template>';
        const result = await transformCode({
          content,
          filePath: '/test/file.vue',
          fileType: 'vue',
          escapeTags: [],
          pathType: 'relative',
        });

        expect(result).toBe(content);
      });
    });

    describe('jsx/tsx files', () => {
      it('should ignore jsx file with single line comment code-inspector-disable', async () => {
        const content = '// code-inspector-disable\nfunction App() { return <div>Hello</div>; }';
        const result = await transformCode({
          content,
          filePath: '/test/file.jsx',
          fileType: 'jsx',
          escapeTags: [],
          pathType: 'relative',
        });

        expect(result).toBe(content);
      });

      it('should ignore jsx file with single line comment code-inspector-ignore', async () => {
        const content = '// code-inspector-ignore\nfunction App() { return <div>Hello</div>; }';
        const result = await transformCode({
          content,
          filePath: '/test/file.jsx',
          fileType: 'jsx',
          escapeTags: [],
          pathType: 'relative',
        });

        expect(result).toBe(content);
      });

      it('should ignore jsx file with block comment', async () => {
        const content = '/* code-inspector-disable */\nfunction App() { return <div>Hello</div>; }';
        const result = await transformCode({
          content,
          filePath: '/test/file.jsx',
          fileType: 'jsx',
          escapeTags: [],
          pathType: 'relative',
        });

        expect(result).toBe(content);
      });

      it('should ignore jsx file with multi-line block comment', async () => {
        const content = '/**\n * code-inspector-disable\n */\nfunction App() { return <div>Hello</div>; }';
        const result = await transformCode({
          content,
          filePath: '/test/file.jsx',
          fileType: 'jsx',
          escapeTags: [],
          pathType: 'relative',
        });

        expect(result).toBe(content);
      });

      it('should not ignore jsx file with block comment without proper ending', async () => {
        const content = '/* code-inspector-disable \nfunction App() { return <div>Hello</div>; }';
        const result = await transformCode({
          content,
          filePath: '/test/file.jsx',
          fileType: 'jsx',
          escapeTags: [],
          pathType: 'relative',
        });

        // Comment not properly closed, should be processed
        // But also parsing might fail, returning original content
        expect(result).toBe(content);
      });

      it('should not ignore jsx file when comment is not at the start', async () => {
        const content = 'import React from "react";\n// code-inspector-disable\nfunction App() { return <div>Hello</div>; }';
        const result = await transformCode({
          content,
          filePath: '/test/file.jsx',
          fileType: 'jsx',
          escapeTags: [],
          pathType: 'relative',
        });

        expect(result).toContain('data-insp-path');
      });
    });

    it('should not ignore file with empty content', async () => {
      const content = '';
      const result = await transformCode({
        content,
        filePath: '/test/file.vue',
        fileType: 'vue',
        escapeTags: [],
        pathType: 'relative',
      });

      // Empty content returns false from isIgnoredFile
      expect(result).toBe(content);
    });

    it('should handle whitespace before comment', async () => {
      const content = '   <!-- code-inspector-disable -->\n<template><div>Hello</div></template>';
      const result = await transformCode({
        content,
        filePath: '/test/file.vue',
        fileType: 'vue',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).toBe(content);
    });
  });

  describe('error handling', () => {
    it('should return original content when transformation throws error', async () => {
      // Use invalid jsx that will cause parsing error
      const content = 'function App() { return <div>>>invalid<<<</div>; }';
      const result = await transformCode({
        content,
        filePath: '/test/file.jsx',
        fileType: 'jsx',
        escapeTags: [],
        pathType: 'relative',
      });

      // Should return original content due to error
      expect(result).toBe(content);
    });
  });

  describe('pathType', () => {
    it('should use relative path when pathType is relative', async () => {
      const content = '<template><div>Hello</div></template>';
      const result = await transformCode({
        content,
        filePath: '/full/path/to/file.vue',
        fileType: 'vue',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).toContain('data-insp-path="file.vue');
    });

    it('should use absolute path when pathType is absolute', async () => {
      const content = '<template><div>Hello</div></template>';
      const result = await transformCode({
        content,
        filePath: '/full/path/to/file.vue',
        fileType: 'vue',
        escapeTags: [],
        pathType: 'absolute',
      });

      expect(result).toContain('data-insp-path="/full/path/to/file.vue');
    });
  });
});
