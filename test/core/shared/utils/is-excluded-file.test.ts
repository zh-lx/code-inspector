import { isExcludedFile } from '@/core/src/shared/utils';
import { CodeOptions } from '@/core/src/shared/type';
import { expect, describe, it } from 'vitest';

describe('isExcludedFile', () => {
  const testFile = '/Users/zlx/project/src/components/Button.tsx';
  const nodeModulesFile = '/Users/zlx/project/node_modules/react/index.js';

  describe('default behavior', () => {
    it('should exclude node_modules by default', () => {
      const options: CodeOptions = {};
      expect(isExcludedFile(nodeModulesFile, options)).toBe(true);
    });

    it('should not exclude regular files by default', () => {
      const options: CodeOptions = {};
      expect(isExcludedFile(testFile, options)).toBe(false);
    });
  });

  describe('with exclude option', () => {
    it('should exclude files matching string pattern', () => {
      const options: CodeOptions = {
        exclude: 'Button',
      };
      expect(isExcludedFile(testFile, options)).toBe(true);
    });

    it('should exclude files matching RegExp pattern', () => {
      const options: CodeOptions = {
        exclude: /Button\.tsx$/,
      };
      expect(isExcludedFile(testFile, options)).toBe(true);
    });

    it('should exclude files matching any pattern in array', () => {
      const options: CodeOptions = {
        exclude: ['Input', /Button\.tsx$/],
      };
      expect(isExcludedFile(testFile, options)).toBe(true);
    });

    it('should not exclude files that do not match patterns', () => {
      const options: CodeOptions = {
        exclude: ['Input', /Modal\.tsx$/],
      };
      expect(isExcludedFile(testFile, options)).toBe(false);
    });
  });

  describe('with include option', () => {
    it('should include files even if they match exclude pattern', () => {
      const options: CodeOptions = {
        exclude: 'Button',
        include: 'Button',
      };
      expect(isExcludedFile(testFile, options)).toBe(false);
    });

    it('should include node_modules files if explicitly included', () => {
      const options: CodeOptions = {
        include: /node_modules\/react/,
      };
      expect(isExcludedFile(nodeModulesFile, options)).toBe(false);
    });

    it('should exclude files if not in include list', () => {
      const options: CodeOptions = {
        exclude: 'components',
        include: 'Input',
      };
      expect(isExcludedFile(testFile, options)).toBe(true);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple exclude patterns with include override', () => {
      const options: CodeOptions = {
        exclude: [/\.tsx$/, 'components'],
        include: [/Button/],
      };
      expect(isExcludedFile(testFile, options)).toBe(false);
    });

    it('should exclude when multiple exclude patterns match and no include', () => {
      const options: CodeOptions = {
        exclude: [/\.tsx$/, 'components'],
      };
      expect(isExcludedFile(testFile, options)).toBe(true);
    });

    it('should handle array include patterns', () => {
      const options: CodeOptions = {
        exclude: /node_modules/,
        include: [/react/, /vue/],
      };
      expect(isExcludedFile(nodeModulesFile, options)).toBe(false);
    });
  });
});
