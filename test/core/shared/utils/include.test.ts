import { matchCondition } from '@/core/src/shared/utils';
import { Condition } from '@/core/src/shared/type';
import { expect, describe, it } from 'vitest';

describe('matchCondition', () => {
  const testFile = '/Users/zlx/code-inspector/node_modules/pkg-1/a/b/c';

  describe('string condition', () => {
    it('should return true when file includes the string condition', () => {
      expect(matchCondition('pkg-1', testFile)).toBe(true);
    });

    it('should return false when file does not include the string condition', () => {
      expect(matchCondition('pkg-2', testFile)).toBe(false);
    });
  });

  describe('RegExp condition', () => {
    it('should return true when file matches the RegExp condition', () => {
      expect(matchCondition(/pkg\-1/, testFile)).toBe(true);
      expect(matchCondition(/node_modules\/pkg/, testFile)).toBe(true);
    });

    it('should return false when file does not match the RegExp condition', () => {
      expect(matchCondition(/pkg\-2/, testFile)).toBe(false);
    });
  });

  describe('array condition', () => {
    it('should return true when file matches string condition in the array', () => {
      const conditions: Condition = [
        'pkg-1',
      ];
      expect(matchCondition(conditions, testFile)).toBe(true);
    });

    it('should return true when file matches RegExp condition in the array', () => {
      const conditions: Condition = [
        /node_modules/,
        'pkg-1'
      ];
      expect(matchCondition(conditions, testFile)).toBe(true);
    });

    it('should return false when file does not match any condition in the array', () => {
      const conditions: Condition = [
        'pkg-2',
        /node_modules\/pkg\-3$/,
      ];
      expect(matchCondition(conditions, testFile)).toBe(false);
    });
  });
});
