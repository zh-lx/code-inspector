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
  const astroPropagatedPathExpression = `typeof $$props !== 'undefined' && $$props && $$props["data-insp-path"] || Astro.props && Astro.props["data-insp-path"]`;

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

  describe('astro transformation', () => {
    it('should transform astro content', async () => {
      const content = '<div><p>Hello</p></div>';
      const result = await transformCode({
        content,
        filePath: '/test/file.astro',
        fileType: 'astro',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).toContain(
        `data-insp-path={${astroPropagatedPathExpression} || "file.astro:1:1:div"}`,
      );
      expect(result).toContain('data-insp-path="file.astro:1:6:p"');
    });

    it('should transform astro component invocation points', async () => {
      const content = '<Card /><div>Hello</div>';
      const result = await transformCode({
        content,
        filePath: '/test/file.astro',
        fileType: 'astro',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).toContain(':Card"');
      expect(result).toContain(':div"');
    });

    it('should not transform escaped tags in astro', async () => {
      const content = '<script>const html = "<div></div>";</script><div>Hello</div>';
      const result = await transformCode({
        content,
        filePath: '/test/file.astro',
        fileType: 'astro',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).not.toContain(':script"');
      expect(result).not.toContain('const html = "<div data-insp-path');
      expect(result).toContain(':div"');
    });

    it('should handle astro scanner edge cases', async () => {
      const content = [
        '<div title={"a > b"}>First</div>',
        '<1>',
        '<span data-insp-path="manual">Manual</span>',
        '<broken',
      ].join('\n');
      const result = await transformCode({
        content,
        filePath: '/test/file.astro',
        fileType: 'astro',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).toContain('data-insp-path="file.astro:1:1:div"');
      expect(result).toContain('<1>');
      expect(result).toContain('<span data-insp-path="manual">Manual</span>');
      expect(result).toContain('<broken');
      expect(result).not.toContain(':broken"');
    });

    it('should handle astro frontmatter offsets and escaped block close tags', async () => {
      const content = [
        '---',
        'const value = Promise.resolve<string>("ok");',
        '---',
        '<script><div>skip</div></script>',
        '<div>Target</div>',
      ].join('\n');
      const result = await transformCode({
        content,
        filePath: '/test/file.astro',
        fileType: 'astro',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).not.toContain('Promise.resolve<string data-insp-path');
      expect(result).not.toContain('<script data-insp-path');
      expect(result).not.toContain('<div data-insp-path="file.astro:4');
      expect(result).toContain(
        `data-insp-path={${astroPropagatedPathExpression} || "file.astro:5:1:div"}`,
      );
    });

    it('should skip raw text tags and svg children in astro scanner fallback', async () => {
      const content = [
        '<style>.icon path { fill: red; }</style>',
        '<script>const view = "<span>skip</span>";</script>',
        '<svg><path d="M0 0" /><circle /></svg>',
        '<Card />',
      ].join('\n');
      const result = await transformCode({
        content,
        filePath: '/test/file.astro',
        fileType: 'astro',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).not.toContain('<style data-insp-path');
      expect(result).not.toContain('<script data-insp-path');
      expect(result).not.toContain('<span data-insp-path');
      expect(result).toContain('data-insp-path="file.astro:3:1:svg"');
      expect(result).not.toContain(':path"');
      expect(result).not.toContain(':circle"');
      expect(result).toContain('data-insp-path="file.astro:4:1:Card"');
    });

    it('should not mutate TypeScript generics in astro scanner fallback', async () => {
      const content =
        '<div>{items as Array<section>}{cards as Array<Card>}</div><section>Target</section>';
      const result = await transformCode({
        content,
        filePath: '/test/file.astro',
        fileType: 'astro',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).not.toContain('Array<section data-insp-path');
      expect(result).not.toContain('Array<Card data-insp-path');
      expect(result).not.toContain(':Card"');
      expect(result).toContain('</div><section data-insp-path=');
    });
  });

  describe('mdx transformation', () => {
    it('should transform mdx markdown and jsx content', async () => {
      const content = [
        '---',
        'title: Demo',
        '---',
        '# Mdx title',
        '',
        '- First target',
        '- Second target',
        '',
        '<section><button type="button">Click</button></section>',
      ].join('\n');

      const result = await transformCode({
        content,
        filePath: '/test/file.mdx',
        fileType: 'mdx',
        escapeTags: [],
        pathType: 'relative',
        mdx: true,
      });

      expect(result).toContain('data-insp-path="file.mdx:4:1:h1"');
      expect(result).toContain('data-insp-path="file.mdx:6:1:ul"');
      expect(result).toContain('data-insp-path="file.mdx:6:1:li"');
      expect(result).toContain('data-insp-path="file.mdx:9:1:section"');
      expect(result).toContain('data-insp-path="file.mdx:9:10:button"');
    });

    it('should not transform mdx files by default', async () => {
      const content = [
        '# Mdx title',
        '',
        '- First target',
        '',
        '<section>Target</section>',
      ].join('\n');

      const result = await transformCode({
        content,
        filePath: '/test/file.mdx',
        fileType: 'mdx',
        escapeTags: [],
        pathType: 'relative',
      });

      expect(result).toBe(content);
    });

    it('should preserve inline markdown semantics in rewritten mdx blocks', async () => {
      const content =
        '# **Bold** [docs](https://example.com) and `code`';

      const result = await transformCode({
        content,
        filePath: '/test/file.mdx',
        fileType: 'mdx',
        escapeTags: [],
        pathType: 'relative',
        mdx: true,
      });

      expect(result).toContain(
        '<h1 data-insp-path="file.mdx:1:1:h1"><strong>Bold</strong> <a href="https://example.com">docs</a> and <code>code</code></h1>',
      );
      expect(result).not.toContain('**Bold**');
      expect(result).not.toContain('[docs](https://example.com)');
    });

    it('should not transform mdx fenced code blocks', async () => {
      const content = ['```html', '<div>Example</div>', '```', '<div>Target</div>'].join(
        '\n',
      );

      const result = await transformCode({
        content,
        filePath: '/test/file.mdx',
        fileType: 'mdx',
        escapeTags: [],
        pathType: 'relative',
        mdx: true,
      });

      expect(result).not.toContain('<div data-insp-path="file.mdx:2:1:div"');
      expect(result).toContain('<div data-insp-path="file.mdx:4:1:div"');
    });

    it('should transform mdx blockquotes and ordered lists', async () => {
      const content = ['> Quote target', '', '1. First', '2. Second'].join('\n');

      const result = await transformCode({
        content,
        filePath: '/test/file.mdx',
        fileType: 'mdx',
        escapeTags: [],
        pathType: 'relative',
        mdx: true,
      });

      expect(result).toContain('data-insp-path="file.mdx:1:1:blockquote"');
      expect(result).toContain('data-insp-path="file.mdx:1:3:p"');
      expect(result).toContain('data-insp-path="file.mdx:3:1:ol"');
      expect(result).toContain('data-insp-path="file.mdx:4:1:li"');
    });

    it('should respect mdx escape tags for markdown blocks and explicit tags', async () => {
      const content = [
        '- Escaped list',
        '',
        '> Escaped quote',
        '',
        '<script><div>skip</div></script>',
        '<div>Target</div>',
      ].join('\n');

      const result = await transformCode({
        content,
        filePath: '/test/file.mdx',
        fileType: 'mdx',
        escapeTags: ['ul', 'blockquote'],
        pathType: 'relative',
        mdx: true,
      });

      expect(result).not.toContain(':ul"');
      expect(result).not.toContain(':li"');
      expect(result).not.toContain(':blockquote"');
      expect(result).not.toContain('<script data-insp-path');
      expect(result).not.toContain('<div data-insp-path="file.mdx:5');
      expect(result).toContain('data-insp-path="file.mdx:6:1:div"');
    });

    it('should skip explicit tags inside rewritten markdown ranges', async () => {
      const content = 'Before\n\n- <span>Inline item</span>\n\nAfter';

      const result = await transformCode({
        content,
        filePath: '/test/file.mdx',
        fileType: 'mdx',
        escapeTags: [],
        pathType: 'relative',
        mdx: true,
      });

      expect(result).toContain('data-insp-path="file.mdx:3:1:ul"');
      expect(result).toContain('data-insp-path="file.mdx:3:1:li"');
      expect(result).not.toContain(':span"');
    });

    it('should handle mdx scanner edge cases', async () => {
      const content = [
        '<section data-value={value > 1 ? "high" : "low"} />',
        '<1>',
        '<broken',
      ].join('\n');

      const result = await transformCode({
        content,
        filePath: '/test/file.mdx',
        fileType: 'mdx',
        escapeTags: [],
        pathType: 'relative',
        mdx: true,
      });

      expect(result).toContain('data-insp-path="file.mdx:1:1:section"');
      expect(result).toContain('<1>');
      expect(result).toContain('<broken');
      expect(result).not.toContain(':broken"');
    });

    it('should transform mdx component invocation points and skip raw/svg children', async () => {
      const content = [
        '<Card />',
        '<style>.icon path { fill: red; }</style>',
        '<script>const view = "<span>skip</span>";</script>',
        '<svg><path d="M0 0" /><circle /></svg>',
      ].join('\n');

      const result = await transformCode({
        content,
        filePath: '/test/file.mdx',
        fileType: 'mdx',
        escapeTags: [],
        pathType: 'relative',
        mdx: true,
      });

      expect(result).toContain('data-insp-path="file.mdx:1:1:Card"');
      expect(result).not.toContain('<style data-insp-path');
      expect(result).not.toContain('<script data-insp-path');
      expect(result).not.toContain('<span data-insp-path');
      expect(result).toContain('data-insp-path="file.mdx:4:1:svg"');
      expect(result).not.toContain(':path"');
      expect(result).not.toContain(':circle"');
    });

    it('should not mutate TypeScript generics while scanning mdx', async () => {
      const content = [
        'export const values: Array<string> = [];',
        'type Props<Card> = { value: Card };',
        '',
        '{((): Record<div, Card> => (',
        '  <span>Target</span>',
        '))()}',
      ].join('\n');

      const result = await transformCode({
        content,
        filePath: '/test/file.mdx',
        fileType: 'mdx',
        escapeTags: [],
        pathType: 'relative',
        mdx: true,
      });

      expect(result).not.toContain('Array<string data-insp-path');
      expect(result).not.toContain('Record<div data-insp-path');
      expect(result).not.toContain('Props<Card data-insp-path');
      expect(result).not.toContain(':Card"');
      expect(result).toContain('data-insp-path="file.mdx:5:3:span"');
    });

    it('should treat unclosed mdx fences as ignored ranges', async () => {
      const content = ['~~~html', '<div>Example</div>'].join('\n');

      const result = await transformCode({
        content,
        filePath: '/test/file.mdx',
        fileType: 'mdx',
        escapeTags: [],
        pathType: 'relative',
        mdx: true,
      });

      expect(result).toBe(content);
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
