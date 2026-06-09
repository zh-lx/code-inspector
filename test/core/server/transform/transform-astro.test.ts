import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { PathName } from '@/core/src/shared';
import { transformAstro } from '@/core/src/server/transform/transform-astro';

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
  it('should inject paths from compiler AST nodes and skip non-injectable nodes', async () => {
    const content =
      '<div title={"a > b"}><p data-insp-path="old">Text</p><custom-el /></div><broken';
    const customOffset = content.indexOf('<custom-el');
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
            ],
          },
          {
            type: 'component',
            name: 'Card',
            position: { start: { line: 1, column: 1, offset: 0 } },
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

      expect(result).toContain(`${PathName}="${fixture.filePath}:1:1:div"`);
      expect(result).toContain(
        `${PathName}="${fixture.filePath}:1:${customOffset + 1}:custom-el"`,
      );
      expect(result).toContain('<p data-insp-path="old">Text</p>');
      expect(result).not.toContain(':Card"');
      expect(result).not.toContain(':span"');
      expect(result).not.toContain(':broken"');
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

      expect(result).toContain(`${PathName}="${fixture.filePath}:1:1:div"`);
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

      expect(result).toContain(`${PathName}="${fixture.filePath}:1:1:section"`);
    } finally {
      fixture.cleanup();
    }
  });
});
