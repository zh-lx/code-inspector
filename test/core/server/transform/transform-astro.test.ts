import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { PathName } from '@/core/src/shared';
import { transformAstro } from '@/core/src/server/transform/transform-astro';

function getAstroPropagatedPathExpression() {
  const pathName = JSON.stringify(PathName);
  return `typeof $$props !== 'undefined' && $$props && $$props[${pathName}] || Astro.props && Astro.props[${pathName}]`;
}

function createAstroFixture(content: string, compilerSource: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'code-inspector-astro-'));
  const srcDir = path.join(root, 'src');
  const astroDir = path.join(root, 'node_modules/astro');
  const compilerDir = path.join(root, 'node_modules/@astrojs/compiler');
  const filePath = path.join(srcDir, 'file.astro');

  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(astroDir, { recursive: true });
  fs.mkdirSync(compilerDir, { recursive: true });
  fs.writeFileSync(filePath, content);
  fs.writeFileSync(path.join(astroDir, 'package.json'), '{"name":"astro"}');
  fs.writeFileSync(
    path.join(compilerDir, 'package.json'),
    '{"name":"@astrojs/compiler","main":"index.cjs"}',
  );
  fs.writeFileSync(path.join(compilerDir, 'index.cjs'), compilerSource);

  return {
    filePath,
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

describe('transformAstro compiler path', () => {
  it('should fall back to scanner when compiler cannot be resolved', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'code-inspector-astro-missing-'));
    const filePath = path.join(root, 'src', 'file.astro');
    const astroDir = path.join(root, 'src/node_modules/astro');

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.mkdirSync(astroDir, { recursive: true });
    fs.writeFileSync(filePath, '<main>Missing compiler</main>');
    fs.writeFileSync(
      path.join(astroDir, 'package.json'),
      '{"name":"astro","exports":{}}',
    );

    try {
      const result = await transformAstro(
        '<main>Missing compiler</main>',
        filePath,
        [],
      );

      expect(result).toContain(
        `${PathName}={${getAstroPropagatedPathExpression()} || "${filePath}:1:1:main"}`,
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('should inject paths from compiler AST nodes and skip non-injectable nodes', async () => {
    const content =
      '<div title={"a > b"}><p data-insp-path="old">Text</p><custom-el /><Card /><svg><path d="M0 0" /></svg></div><broken';
    const customOffset = content.indexOf('<custom-el');
    const cardOffset = content.indexOf('<Card');
    const svgOffset = content.indexOf('<svg');
    const pathOffset = content.indexOf('<path');
    const brokenOffset = content.indexOf('<broken');
    const fixture = createAstroFixture(
      content,
      `
module.exports = {
  parse: async (content) => {
    const pathName = ${JSON.stringify(PathName)};
    const pOffset = content.indexOf('<p');
    const customOffset = content.indexOf('<custom-el');
    const brokenOffset = content.indexOf('<broken');
    return {
      ast: {
        type: 'root',
        children: [
          {
            type: 'element',
            name: 'div',
            position: { start: { line: 1, column: 1, offset: 0 } },
            children: [
              {
                type: 'element',
                name: 'p',
                attributes: [{ name: pathName }],
                position: {
                  start: {
                    line: 1,
                    column: pOffset + 1,
                    offset: pOffset,
                  },
                },
              },
              {
                type: 'custom-element',
                name: 'custom-el',
                position: {
                  start: {
                    line: 1,
                    column: customOffset + 1,
                    offset: customOffset,
                  },
                },
              },
              {
                type: 'component',
                name: 'Card',
                position: {
                  start: {
                    line: 1,
                    column: cardOffset + 1,
                    offset: cardOffset,
                  },
                },
              },
              {
                type: 'element',
                name: 'svg',
                position: {
                  start: {
                    line: 1,
                    column: svgOffset + 1,
                    offset: svgOffset,
                  },
                },
                children: [
                  {
                    type: 'element',
                    name: 'path',
                    position: {
                      start: {
                        line: 1,
                        column: pathOffset + 1,
                        offset: pathOffset,
                      },
                    },
                  },
                ],
              },
            ],
          },
          {
            type: 'element',
            name: 'span',
          },
          {
            type: 'element',
            name: 'broken',
            position: {
              start: {
                line: 1,
                column: brokenOffset + 1,
                offset: brokenOffset,
              },
            },
          },
        ],
      },
    };
  },
};
`,
    );

    try {
      const result = await transformAstro(content, fixture.filePath, []);

      expect(result).toContain(
        `${PathName}={${getAstroPropagatedPathExpression()} || "${fixture.filePath}:1:1:div"}`,
      );
      expect(result).toContain(
        `${PathName}="${fixture.filePath}:1:${customOffset + 1}:custom-el"`,
      );
      expect(result).toContain(
        `${PathName}="${fixture.filePath}:1:${cardOffset + 1}:Card"`,
      );
      expect(result).toContain(
        `${PathName}="${fixture.filePath}:1:${svgOffset + 1}:svg"`,
      );
      expect(result).toContain('<p data-insp-path="old">Text</p>');
      expect(result).not.toContain(':path"');
      expect(result).not.toContain(':span"');
      expect(result).not.toContain(':broken"');
    } finally {
      fixture.cleanup();
    }
  });

  it('should handle non-propagated AST roots and skipped SVG children', async () => {
    const content = '<div>One</div><svg><path d="M0 0" /></svg>';
    const svgOffset = content.indexOf('<svg');
    const pathOffset = content.indexOf('<path');
    const fixture = createAstroFixture(
      content,
      `
module.exports = {
  parse: async () => ({
    ast: {
      type: 'root',
      children: [
        {
          type: 'element',
          name: 'div',
          position: { start: { line: 1, column: 1, offset: 0 } },
        },
        {
          type: 'element',
          name: 'svg',
          position: { start: { line: 1, column: ${svgOffset + 1}, offset: ${svgOffset} } },
          children: [
            {
              type: 'element',
              name: 'path',
              position: { start: { line: 1, column: ${pathOffset + 1}, offset: ${pathOffset} } },
            },
          ],
        },
      ],
    },
  }),
};
`,
    );

    try {
      const result = await transformAstro(content, fixture.filePath, []);

      expect(result).toContain(`${PathName}="${fixture.filePath}:1:1:div"`);
      expect(result).toContain(
        `${PathName}="${fixture.filePath}:1:${svgOffset + 1}:svg"`,
      );
      expect(result).not.toContain(`${fixture.filePath}:1:${pathOffset + 1}:path`);
      expect(result).not.toContain(getAstroPropagatedPathExpression());
    } finally {
      fixture.cleanup();
    }
  });

  it('should skip AST nodes with invalid positions and malformed opening tags', async () => {
    const content = '<aside>Invalid position</aside><section';
    const sectionOffset = content.indexOf('<section');
    const fixture = createAstroFixture(
      content,
      `
module.exports = {
  parse: async () => ({
    ast: {
      type: 'root',
      children: [
        {
          type: 'element',
          name: 'aside',
          position: { start: { line: 1, offset: 0 } },
        },
        {
          type: 'element',
          name: 'section',
          position: { start: { line: 1, column: ${sectionOffset + 1}, offset: ${sectionOffset} } },
        },
      ],
    },
  }),
};
`,
    );

    try {
      const result = await transformAstro(content, fixture.filePath, []);

      expect(result).toBe(content);
    } finally {
      fixture.cleanup();
    }
  });

  it('should fall back to scanner when compiler returns no AST', async () => {
    const content = '<div>Fallback</div>';
    const fixture = createAstroFixture(
      content,
      'module.exports = { parse: async () => ({}) };',
    );

    try {
      const result = await transformAstro(content, fixture.filePath, []);

      expect(result).toContain(
        `${PathName}={${getAstroPropagatedPathExpression()} || "${fixture.filePath}:1:1:div"}`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should propagate component invocation path to a single root node', async () => {
    const content = '<div>Root</div>';
    const fixture = createAstroFixture(
      content,
      `
module.exports = {
  parse: async () => ({
    ast: {
      type: 'root',
      children: [
        {
          type: 'element',
          name: 'div',
          position: { start: { line: 1, column: 1, offset: 0 } },
        },
      ],
    },
  }),
};
`,
    );

    try {
      const result = await transformAstro(content, fixture.filePath, []);

      expect(result).toContain(
        `${PathName}={${getAstroPropagatedPathExpression()} || "${fixture.filePath}:1:1:div"}`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should propagate component invocation path through scanner fallback for a single root', async () => {
    const content = [
      '---',
      "const title = 'Complex';",
      '---',
      '<section class="inspector-complex">{title}</section>',
    ].join('\n');
    const fixture = createAstroFixture(
      content,
      `
module.exports = {
  parse: async () => {
    throw new Error('parse failed');
  },
};
`,
    );

    try {
      const result = await transformAstro(content, fixture.filePath, []);

      expect(result).toContain(
        `<section class="inspector-complex" ${PathName}={${getAstroPropagatedPathExpression()} || "${fixture.filePath}:4:1:section"}`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should fall back to scanner when compiler parsing fails', async () => {
    const content = '<section>Fallback</section>';
    const fixture = createAstroFixture(
      content,
      `
module.exports = {
  parse: async () => {
    throw new Error('parse failed');
  },
};
`,
    );

    try {
      const result = await transformAstro(content, fixture.filePath, []);

      expect(result).toContain(
        `${PathName}={${getAstroPropagatedPathExpression()} || "${fixture.filePath}:1:1:section"}`,
      );
    } finally {
      fixture.cleanup();
    }
  });

  it('should scan fallback content without root tags', async () => {
    const content = [
      '---',
      "const title = 'No tags';",
      '---',
      'Plain text only',
    ].join('\n');
    const fixture = createAstroFixture(
      content,
      `
module.exports = {
  parse: async () => {
    throw new Error('parse failed');
  },
};
`,
    );

    try {
      const result = await transformAstro(content, fixture.filePath, []);

      expect(result).toBe(content);
    } finally {
      fixture.cleanup();
    }
  });
});
