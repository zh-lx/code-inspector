import { describe, expect, it } from 'vitest';
import {
  belongTemplate,
  isPugTemplate,
  transformPugAst,
} from '@/core/src/server/transform/transform-vue-pug';

const templateNode = {
  loc: {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 4, column: 1, offset: 20 },
  },
  props: [],
} as any;

describe('transform-vue-pug', () => {
  describe('belongTemplate', () => {
    it('should treat undefined column on start line as inside template', () => {
      expect(
        belongTemplate(
          { line: 1, column: undefined },
          { line: 1, column: 3 },
          { line: 3, column: 8 },
        ),
      ).toBe(true);
    });

    it('should treat undefined column on end line as inside template', () => {
      expect(
        belongTemplate(
          { line: 3, column: undefined },
          { line: 1, column: 3 },
          { line: 3, column: 8 },
        ),
      ).toBe(true);
    });
  });

  describe('transformPugAst', () => {
    it('should ignore empty nodes', () => {
      const s = {
        toString: () => 'div Hello',
      } as any;

      expect(() =>
        transformPugAst({
          node: undefined,
          templateNode,
          s,
          escapeTags: [],
          filePath: 'test.vue',
        }),
      ).not.toThrow();
      expect(s.toString()).toBe('div Hello');
    });

    it('should handle block nodes without child nodes array', () => {
      const s = {} as any;

      expect(() =>
        transformPugAst({
          node: {
            type: 'Each',
            block: {},
          } as any,
          templateNode,
          s,
          escapeTags: [],
          filePath: 'test.vue',
        }),
      ).not.toThrow();
    });

    it('should handle conditionals without consequent or alternate blocks', () => {
      const s = {} as any;

      expect(() =>
        transformPugAst({
          node: {
            type: 'Conditional',
          } as any,
          templateNode,
          s,
          escapeTags: [],
          filePath: 'test.vue',
        }),
      ).not.toThrow();
    });
  });

  describe('isPugTemplate', () => {
    it('should return false when template props are missing', () => {
      expect(
        isPugTemplate({
          ...templateNode,
          props: undefined,
        }),
      ).toBe(false);
    });
  });
});
