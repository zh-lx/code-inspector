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

      expect(result).toContain(
        `${PathName}="${filePath}:1:1:section"`,
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
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

      expect(result).toContain(
        `${PathName}={props && props[${JSON.stringify(PathName)}] || "${fixture.filePath}:1:1:article"}`,
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
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).toContain(`${PathName}="${fixture.filePath}:1:1:main"`);
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
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).toContain(
        `${PathName}="${fixture.filePath}:5:1:Card"`,
      );
      expect(result).toContain(
        `${PathName}="${fixture.filePath}:6:1:svg"`,
      );
      expect(result).toContain(
        `<h1 ${PathName}="${fixture.filePath}:3:1:h1">Title</h1>`,
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
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).toContain(
        `${PathName}={props && props[${JSON.stringify(PathName)}] || "${fixture.filePath}:1:1:div"}`,
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
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).toContain(
        `${PathName}="${fixture.filePath}:1:1:Card"`,
      );
      expect(result).toContain(
        `${PathName}="${fixture.filePath}:1:9:div"`,
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
      const result = await transformMdx(content, fixture.filePath, []);

      expect(result).toContain('<section data-insp-path="manual">Manual</section>');
      expect(result).toContain('<aside>Invalid position</aside>');
      expect(result).toContain(
        `${PathName}="${fixture.filePath}:3:1:nav"`,
      );
      expect(result).not.toContain(':section"');
      expect(result).not.toContain(':aside"');
    } finally {
      fixture.cleanup();
    }
  });
});
