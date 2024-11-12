import { isJsTypeFile } from '@/core/src/shared/utils';
import { expect, describe, test } from 'vitest';

describe('isJsTypeFile', () => {
  test('should return true for files with JavaScript-related extensions', () => {
    const validFiles = [
      'test.js',
      'component.jsx',
      'module.ts',
      'interface.tsx',
      'config.mjs',
      'module.mts',
    ];

    validFiles.forEach(file => {
      expect(isJsTypeFile(file)).toBe(true);
    });
  });

  test('should return false for non-JavaScript files', () => {
    const invalidFiles = [
      'style.css',
      'image.png',
      'document.pdf',
      'data.json',
      'file.txt',
      // 测试没有扩展名的文件
      'README',
      // 测试以点结尾的文件
      'file.',
      // 测试空字符串
      '',
    ];

    invalidFiles.forEach(file => {
      expect(isJsTypeFile(file)).toBe(false);
    });
  });

  test('should return false for files with similar but invalid extensions', () => {
    const similarFiles = [
      'file.jsx.bak',
      'file.ts.old',
      'file.typescript',
      'file.javascript',
      'file._js',
    ];

    similarFiles.forEach(file => {
      expect(isJsTypeFile(file)).toBe(false);
    });
  });

  test('should be case sensitive', () => {
    const upperCaseFiles = [
      'test.JS',
      'component.JSX',
      'module.TS',
      'interface.TSX',
    ];

    upperCaseFiles.forEach(file => {
      expect(isJsTypeFile(file)).toBe(false);
    });
  });
});