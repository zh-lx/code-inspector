import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { transformMdx } from '@/core/src/server/transform/transform-mdx';
import { PathName } from '@/core/src/shared';

function createMdxFixture(content: string, parserSource: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'code-inspector-mdx-'));
  const srcDir = path.join(root, 'src');
  const parserDir = path.join(root, 'node_modules/@mdx-js/mdx');
  const filePath = path.join(srcDir, 'file.mdx');

  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(parserDir, { recursive: true });
  fs.writeFileSync(filePath, content);
  fs.writeFileSync(
    path.join(parserDir, 'package.json'),
    '{"name":"@mdx-js/mdx","main":"index.cjs"}',
  );
  fs.writeFileSync(path.join(parserDir, 'index.cjs'), parserSource);

  return {
    filePath,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

function transformWholeMdx(
  content: string,
  filePath: string,
  escapeTags = [],
) {
  return transformMdx(content, filePath, escapeTags, filePath);
}

function mdxPath(filePath: string, line: number, column: number, name: string) {
  return JSON.stringify(`${filePath}:${line}:${column}:${name}`);
}

describe('transformMdx parser path', () => {
  it('should fall back to scanner when parser package cannot be resolved', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'code-inspector-mdx-missing-'));
    const filePath = path.join(root, 'src', 'file.mdx');

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, '<section>Missing parser</section>');

    try {
      const result = await transformMdx(
        '<section>Missing parser</section>',
        filePath,
        [],
      );
      const cachedResult = await transformMdx(
        '<section>Missing parser</section>',
        filePath,
        [],
      );

      expect(result).toContain(
        `${PathName}=${mdxPath(filePath, 1, 1, 'section')}`,
      );
      expect(cachedResult).toContain(
        `${PathName}=${mdxPath(filePath, 1, 1, 'section')}`,
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should fall back to scanner when parser package entry is invalid', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'code-inspector-mdx-broken-'));
    const filePath = path.join(root, 'src', 'file.mdx');
    const parserDir = path.join(root, 'src/node_modules/@mdx-js/mdx');

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.mkdirSync(parserDir, { recursive: true });
    fs.writeFileSync(filePath, '<article>Broken parser</article>');
    fs.writeFileSync(
      path.join(parserDir, 'package.json'),
      '{"name":"@mdx-js/mdx","main":"missing.cjs"}',
    );

    try {
      const result = await transformMdx(
        '<article>Broken parser</article>',
        filePath,
        [],
      );

      expect(result).toContain(
        `${PathName}=${mdxPath(filePath, 1, 1, 'article')}`,
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should resolve parser from a missing source file path', async () => {
    const content = '<main>Missing source path</main>';
    const fixture = createMdxFixture(
      content,
      `
module.exports = {
  createProcessor: () => ({
    parse: () => ({
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'main',
          attributes: [],
          children: [],
          position: { start: { line: 1, column: 1, offset: 0 } },
        },
      ],
    }),
  }),
};
`,
    );
    const missingFilePath = path.join(
      path.dirname(path.dirname(fixture.filePath)),
      'missing',
      'file.mdx',
    );

    try {
      const result = await transformMdx(content, missingFilePath, []);

      expect(result).toContain(
        `${PathName}={props && props[${JSON.stringify(PathName)}] || ${mdxPath(missingFilePath, 1, 1, 'main')}}`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should support default-exported MDX parser modules', async () => {
    const content = '<article>Default parser</article>';
    const fixture = createMdxFixture(
      content,
      `
module.exports = {
  default: {
    createProcessor: () => ({
      parse: () => ({
        type: 'root',
        children: [
          {
            type: 'mdxJsxFlowElement',
            name: 'article',
            attributes: [],
            children: [],
            position: { start: { line: 1, column: 1, offset: 0 } },
          },
        ],
      }),
    }),
  },
};
`,
    );

    try {
      const result = await transformMdx(content, fixture.filePath, []);
      const cachedResult = await transformMdx(content, fixture.filePath, []);

      expect(result).toContain(
        `${PathName}={props && props[${JSON.stringify(PathName)}] || ${mdxPath(fixture.filePath, 1, 1, 'article')}}`,
      );
      expect(cachedResult).toContain(
        `${PathName}={props && props[${JSON.stringify(PathName)}] || ${mdxPath(fixture.filePath, 1, 1, 'article')}}`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should fall back to scanner when parser module has no processor', async () => {
    const content = '<main>No processor</main>';
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(`${PathName}=${mdxPath(fixture.filePath, 1, 1, 'main')}`);
    } finally {
      fixture.cleanup();
    }
  });

  it('should skip dynamic root propagation when AST root has no offset', async () => {
    const content = '<article>No offset</article>';
    const fixture = createMdxFixture(
      content,
      `
module.exports = {
  createProcessor: () => ({
    parse: () => ({
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'article',
          attributes: [],
          children: [],
          position: { start: { line: 1, column: 1 } },
        },
      ],
    }),
  }),
};
`,
    );

    try {
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).toBe(content);
    } finally {
      fixture.cleanup();
    }
  });

  it('should handle parser AST roots without children', async () => {
    const content = 'Plain only';
    const fixture = createMdxFixture(
      content,
      `
module.exports = {
  createProcessor: () => ({
    parse: () => ({ type: 'root' }),
  }),
};
`,
    );

    try {
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).toBe(content);
    } finally {
      fixture.cleanup();
    }
  });

  it('should transform markdown blocks and explicit tags', async () => {
    const content = [
      '# Title',
      '',
      '- First',
      '- Second',
      '',
      '<section>Target</section>',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).toContain(`${PathName}=${mdxPath(fixture.filePath, 1, 1, 'h1')}`);
      expect(result).toContain(`${PathName}=${mdxPath(fixture.filePath, 3, 1, 'ul')}`);
      expect(result).toContain(`${PathName}=${mdxPath(fixture.filePath, 3, 1, 'li')}`);
      expect(result).toContain(`${PathName}=${mdxPath(fixture.filePath, 6, 1, 'section')}`);
    } finally {
      fixture.cleanup();
    }
  });

  it('should inject explicit MDX JSX elements from parser AST', async () => {
    const content = [
      'type Props<Card> = { value: Card };',
      '',
      '# Title',
      '',
      '<Card />',
      '<svg><path d="M0 0" /></svg>',
      '<span data-insp-path="manual">Manual</span>',
    ].join('\n');

    const cardOffset = content.indexOf('<Card />');
    const svgOffset = content.indexOf('<svg');
    const pathOffset = content.indexOf('<path');
    const spanOffset = content.indexOf('<span');
    const fixture = createMdxFixture(
      content,
      `
module.exports = {
  createProcessor: () => ({
    parse: () => ({
      type: 'root',
      children: [
        {
          type: 'mdxjsEsm',
          value: 'type Props<Card> = { value: Card };',
          position: { start: { line: 1, column: 1, offset: 0 } },
        },
        {
          type: 'heading',
          depth: 1,
          position: { start: { line: 3, column: 1, offset: ${content.indexOf('# Title')} } },
        },
        {
          type: 'mdxJsxFlowElement',
          name: 'Card',
          attributes: [],
          children: [],
          position: { start: { line: 5, column: 1, offset: ${cardOffset} } },
        },
        {
          type: 'mdxJsxFlowElement',
          name: 'svg',
          attributes: [],
          children: [
            {
              type: 'mdxJsxFlowElement',
              name: 'path',
              attributes: [],
              children: [],
              position: { start: { line: 6, column: 6, offset: ${pathOffset} } },
            },
          ],
          position: { start: { line: 6, column: 1, offset: ${svgOffset} } },
        },
        {
          type: 'mdxJsxFlowElement',
          name: 'span',
          attributes: [{ name: ${JSON.stringify(PathName)} }],
          children: [],
          position: { start: { line: 7, column: 1, offset: ${spanOffset} } },
        },
      ],
    }),
  }),
};
`,
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        `${PathName}=${mdxPath(fixture.filePath, 5, 1, 'Card')}`,
      );
      expect(result).toContain(
        `${PathName}=${mdxPath(fixture.filePath, 6, 1, 'svg')}`,
      );
      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 3, 1, 'h1')}>Title</h1>`,
      );
      expect(result).not.toContain('Props<Card data-insp-path');
      expect(result).not.toContain(`:path"`);
      expect(result).not.toContain(`props && props[${JSON.stringify(PathName)}]`);
      expect(result).toContain('<span data-insp-path="manual">Manual</span>');
    } finally {
      fixture.cleanup();
    }
  });

  it('should propagate component invocation path to a single root node', async () => {
    const content = '<div>Root</div>';
    const fixture = createMdxFixture(
      content,
      `
module.exports = {
  createProcessor: () => ({
    parse: () => ({
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'div',
          attributes: [],
          children: [],
          position: { start: { line: 1, column: 1, offset: 0 } },
        },
      ],
    }),
  }),
};
`,
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        `${PathName}={props && props[${JSON.stringify(PathName)}] || ${mdxPath(fixture.filePath, 1, 1, 'div')}}`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should fall back to scanner when parser is unavailable or fails', async () => {
    const content = '<Card /><div>Target</div>';
    const fixture = createMdxFixture(
      content,
      `
module.exports = {
  createProcessor: () => ({
    parse: () => {
      throw new Error('parse failed');
    },
  }),
};
`,
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        `${PathName}=${mdxPath(fixture.filePath, 1, 1, 'Card')}`,
      );
      expect(result).toContain(
        `${PathName}=${mdxPath(fixture.filePath, 1, 9, 'div')}`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should ignore AST nodes that already have source path attrs or invalid positions', async () => {
    const content = [
      '<section data-insp-path="manual">Manual</section>',
      '<aside>Invalid position</aside>',
      '<nav>Missing offset</nav>',
    ].join('\n');
    const asideOffset = content.indexOf('<aside');
    const navOffset = content.indexOf('<nav');
    const fixture = createMdxFixture(
      content,
      `
module.exports = {
  createProcessor: () => ({
    parse: () => ({
      type: 'root',
      children: [
        {
          type: 'mdxJsxFlowElement',
          name: 'section',
          attributes: [],
          children: [],
          position: { start: { line: 1, column: 1, offset: 0 } },
        },
        {
          type: 'mdxJsxFlowElement',
          name: 'aside',
          attributes: [],
          children: [],
          position: { start: { line: 2, column: ${asideOffset + 1} } },
        },
        {
          type: 'mdxJsxFlowElement',
          name: 'nav',
          attributes: [],
          children: [],
          position: { start: { line: 3, column: 1, offset: ${navOffset} } },
        },
      ],
    }),
  }),
};
`,
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain('<section data-insp-path="manual">Manual</section>');
      expect(result).toContain('<aside>Invalid position</aside>');
      expect(result).toContain(
        `${PathName}=${mdxPath(fixture.filePath, 3, 1, 'nav')}`,
      );
      expect(result).not.toContain(':section"');
      expect(result).not.toContain(':aside"');
    } finally {
      fixture.cleanup();
    }
  });

  it('should preserve inline markdown edge cases in scanner fallback', async () => {
    const content = [
      '# Escaped \\*literal\\* image ![**Logo** `raw`](https://img.test/logo.png "Hero title") ~~gone~~ _em_ `open',
      '# Broken ![missing [dangling [escaped\\]label](https://example.com "Quoted title") [titled](https://example.com Title) [unterminated](https://example.com "Title" **',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain('*literal*');
      expect(result).toContain(
        '<img src="https://img.test/logo.png" alt="Logo raw" title="Hero title" />',
      );
      expect(result).toContain('<del>gone</del>');
      expect(result).toContain('<em>em</em>');
      expect(result).toContain(
        '<a href="https://example.com" title="Quoted title">escaped]label</a>',
      );
      expect(result).toContain(
        '<a href="https://example.com" title="Title">titled</a>',
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should split adjacent list groups when marker kinds change', async () => {
    const content = ['- Bullet', '1. Ordered'].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        `<ul ${PathName}=${mdxPath(fixture.filePath, 1, 1, 'ul')}>`,
      );
      expect(result).toContain(
        `<li ${PathName}=${mdxPath(fixture.filePath, 1, 1, 'li')}>Bullet</li>`,
      );
      expect(result).toContain(
        `<ol ${PathName}=${mdxPath(fixture.filePath, 2, 1, 'ol')}>`,
      );
      expect(result).toContain(
        `<li ${PathName}=${mdxPath(fixture.filePath, 2, 1, 'li')}>Ordered</li>`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should escape structural text characters in rewritten markdown blocks', async () => {
    const content = [
      '# 1 < 2 and 3 > 2 and <span>ok</span>',
      '',
      '- a < b > c',
      '',
      '> c < d > e',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 1, 1, 'h1')}>1 &lt; 2 and 3 &gt; 2 and <span>ok</span></h1>`,
      );
      expect(result).toContain(
        `<li ${PathName}=${mdxPath(fixture.filePath, 3, 1, 'li')}>a &lt; b &gt; c</li>`,
      );
      expect(result).toContain(
        `<p ${PathName}=${mdxPath(fixture.filePath, 5, 3, 'p')}>c &lt; d &gt; e</p>`,
      );
      expect(result).not.toContain(`${fixture.filePath}:1:13:span`);
    } finally {
      fixture.cleanup();
    }
  });

  it('should preserve mdx expressions and markdown-sensitive inline text', async () => {
    const content = [
      '# C# and &copy;',
      '',
      '# Escaped \\{literal\\} and {value}',
      '',
      '# Keep closing marker ###',
      '',
      '# **bold #** and \\- marker',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 1, 1, 'h1')}>C# and &copy;</h1>`,
      );
      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 3, 1, 'h1')}>Escaped &#123;literal&#125; and {value}</h1>`,
      );
      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 5, 1, 'h1')}>Keep closing marker</h1>`,
      );
      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 7, 1, 'h1')}><strong>bold #</strong> and - marker</h1>`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should render plugin-sensitive markdown syntax as pre-rewritten jsx', async () => {
    const content = [
      '- [x] Completed task from remark-gfm syntax',
      '- [ ] Pending task from remark-gfm syntax',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        `<ul ${PathName}=${mdxPath(fixture.filePath, 1, 1, 'ul')}>`,
      );
      expect(result).toContain(
        `<li ${PathName}=${mdxPath(fixture.filePath, 1, 1, 'li')}>[x] Completed task from remark-gfm syntax</li>`,
      );
      expect(result).toContain(
        `<li ${PathName}=${mdxPath(fixture.filePath, 2, 1, 'li')}>[ ] Pending task from remark-gfm syntax</li>`,
      );
      expect(result).not.toContain('type="checkbox"');
      expect(result).not.toContain('<input');
    } finally {
      fixture.cleanup();
    }
  });

  it('should preserve complex inline markdown links and image destinations', async () => {
    const content = [
      '# [Nested [label] link](https://example.com/docs/(section) "Nested title") and ![**Decorated** `alt` text](https://example.com/assets/(demo).png "Asset title")',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 1, 1, 'h1')}><a href="https://example.com/docs/(section)" title="Nested title">Nested [label] link</a> and <img src="https://example.com/assets/(demo).png" alt="Decorated alt text" title="Asset title" /></h1>`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should preserve mdx expressions with comments, regex, and quoted braces', async () => {
    const content = [
      "# Result {format({ label: 'brace } text', meta: { count: visibleGroups.length }, template: `value ${visibleGroups[0]?.id}` })}",
      '',
      "# Regex {(/value\\}/).test('value}') ? 'regex literal matched' : 'regex literal missed'}",
      '',
      "# Comment {value /* comment } */ ?? 'fallback'}",
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 1, 1, 'h1')}>Result {format({ label: 'brace } text', meta: { count: visibleGroups.length }, template: \`value \${visibleGroups[0]?.id}\` })}</h1>`,
      );
      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 3, 1, 'h1')}>Regex {(/value\\}/).test('value}') ? 'regex literal matched' : 'regex literal missed'}</h1>`,
      );
      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 5, 1, 'h1')}>Comment {value /* comment } */ ?? 'fallback'}</h1>`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should preserve mdx expressions with regex character classes and regex keyword prefixes', async () => {
    const content = [
      '# Regex {/[\\]}]/.test(value)}',
      '',
      '# Leading regex { /abc/.test(value) }',
      '',
      '# Return regex {(() => { return /abc/.test(value) })()}',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 1, 1, 'h1')}>Regex {/[\\]}]/.test(value)}</h1>`,
      );
      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 3, 1, 'h1')}>Leading regex { /abc/.test(value) }</h1>`,
      );
      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 5, 1, 'h1')}>Return regex {(() => { return /abc/.test(value) })()}</h1>`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should render malformed inline jsx and mdx expressions as text', async () => {
    const content = [
      '# Closed <!-- note --> and open <!-- note',
      '',
      '# Broken tag <span title="broken"',
      '',
      '# Broken expression {value',
      '',
      '# Line comment {value // comment}',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain('Closed <!-- note --> and open &lt;!-- note');
      expect(result).toContain('Broken tag &lt;span title="broken"');
      expect(result).toContain('Broken expression &#123;value');
      expect(result).toContain('Line comment &#123;value // comment&#125;');
    } finally {
      fixture.cleanup();
    }
  });

  it('should preserve escaped link destinations and images without titles', async () => {
    const escapedUrl = 'https://example.com/a\\)b';
    const escapedTitle = 'A \\"quoted\\" title';
    const content = [
      `# ![Plain alt](https://img.test/plain.png) [url](${escapedUrl}) [title](https://example.com "${escapedTitle}")`,
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        '<img src="https://img.test/plain.png" alt="Plain alt" />',
      );
      expect(result).toContain(
        `<a href=${JSON.stringify(escapedUrl)}>url</a>`,
      );
      expect(result).toContain(
        `<a href="https://example.com" title=${JSON.stringify(escapedTitle)}>title</a>`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should escape structural text characters inside nested inline markdown', async () => {
    const content = [
      '# **strong < text >** _em \\{ text \\}_ ~~del < text~~ [`code < > { }`](https://example.com)',
      '',
      '- **# label < 2** and \\- literal',
      '',
      '> [label < value >](https://example.com) and `code <tag> {x}`',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 1, 1, 'h1')}><strong>strong &lt; text &gt;</strong> <em>em &#123; text &#125;</em> <del>del &lt; text</del> <a href="https://example.com"><code>code &lt; &gt; &#123; &#125;</code></a></h1>`,
      );
      expect(result).toContain(
        `<li ${PathName}=${mdxPath(fixture.filePath, 3, 1, 'li')}><strong># label &lt; 2</strong> and - literal</li>`,
      );
      expect(result).toContain(
        `<p ${PathName}=${mdxPath(fixture.filePath, 5, 3, 'p')}><a href="https://example.com">label &lt; value &gt;</a> and <code>code &lt;tag&gt; &#123;x&#125;</code></p>`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should leave complex list constructs unchanged in scanner fallback', async () => {
    const content = [
      '- parent',
      '  continuation',
      '- next',
      '',
      '- parent',
      '  - child',
      '',
      '- parent',
      '  # Nested',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toBe(content);
    } finally {
      fixture.cleanup();
    }
  });

  it('should leave multi-line blockquotes unchanged in scanner fallback', async () => {
    const content = ['> first', '> second'].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toBe(content);
    } finally {
      fixture.cleanup();
    }
  });

  it('should not scan explicit tags inside rewritten markdown blocks', async () => {
    const content = [
      'Plain intro',
      '# <span>Nested</span>',
      '<div>Outside</div>',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformWholeMdx(content, fixture.filePath);

      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 2, 1, 'h1')}><span>Nested</span></h1>`,
      );
      expect(result).toContain(`${PathName}=${mdxPath(fixture.filePath, 3, 1, 'div')}`);
      expect(result).not.toContain(`${fixture.filePath}:2:3:span`);
    } finally {
      fixture.cleanup();
    }
  });

  it('should ignore MDX ESM regions while scanning explicit tags', async () => {
    const content = [
      'export const config = {',
      '  label: "quoted <span>",',
      '  values: [1, 2],',
      '};',
      '<section>Visible</section>',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).not.toContain(`${fixture.filePath}:2:18:span`);
      expect(result).toContain(`${PathName}=${mdxPath(fixture.filePath, 5, 1, 'section')}`);
    } finally {
      fixture.cleanup();
    }
  });

  it('should preserve frontmatter while transforming markdown after it', async () => {
    const content = ['---', 'title: Demo', '---', '# Title'].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).toContain('title: Demo');
      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 4, 1, 'h1')}>Title</h1>`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should transform markdown after unterminated frontmatter marker', async () => {
    const content = ['---', '# Title'].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).toContain(
        `<h1 ${PathName}=${mdxPath(fixture.filePath, 2, 1, 'h1')}>Title</h1>`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should treat unfinished MDX ESM regions as ignored ranges', async () => {
    const content = [
      'export const config = {',
      '  label: "quoted <span>"',
      '<div>Ignored</div>',
    ].join('\n');
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).toBe(content);
    } finally {
      fixture.cleanup();
    }
  });

  it('should handle empty unfinished MDX ESM ranges', async () => {
    const content = '';
    const fixture = createMdxFixture(
      content,
      'module.exports = { notCreateProcessor: true };',
    );

    try {
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).toBe(content);
    } finally {
      fixture.cleanup();
    }
  });
});
