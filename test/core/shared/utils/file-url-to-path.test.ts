import { fileURLToPath } from '@/core/src/shared/utils';
import { expect, describe, test, afterEach, beforeEach } from 'vitest';
import process from 'process';

describe('fileURLToPath', () => {
  // 保存原始的 platform 值
  const originalPlatform = process.platform;

  // 在每个测试后恢复原始的 platform 值
  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
  });

  describe('Windows platform', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });
    });

    test('should convert Windows file URL correctly', () => {
      const testCases = [
        {
          input: 'file:///C:/Users/test/project/file.js',
          expected: 'C:\\Users\\test\\project\\file.js'
        },
        {
          input: 'file:///D:/workspace/project%20name/index.ts',
          expected: 'D:\\workspace\\project name\\index.ts'
        },
        {
          input: 'file:///C:/Users/name%20with%20spaces/file.jsx',
          expected: 'C:\\Users\\name with spaces\\file.jsx'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(fileURLToPath(input)).toBe(expected);
      });
    });
  });

  describe('Unix-like platforms', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin' // macOS
      });
    });

    test('should convert Unix-like file URL correctly', () => {
      const testCases = [
        {
          input: 'file:///Users/test/project/file.js',
          expected: '/Users/test/project/file.js'
        },
        {
          input: 'file:///home/user/project%20name/index.ts',
          expected: '/home/user/project name/index.ts'
        },
        {
          input: 'file:///var/www/site/index.html',
          expected: '/var/www/site/index.html'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(fileURLToPath(input)).toBe(expected);
      });
    });
  });

  test('should handle URLs with special characters', () => {
    // 设置为非 Windows 平台进行测试
    Object.defineProperty(process, 'platform', {
      value: 'darwin'
    });

    const testCases = [
      {
        input: 'file:///path/with%20spaces/file.js',
        expected: '/path/with spaces/file.js'
      },
      {
        input: 'file:///path/with%25percentage/file.js',
        expected: '/path/with%percentage/file.js'
      },
      {
        input: 'file:///path/with%23hash/file.js',
        expected: '/path/with#hash/file.js'
      },
      {
        input: 'file:///path/with%3Fquestion/file.js',
        expected: '/path/with?question/file.js'
      }
    ];

    testCases.forEach(({ input, expected }) => {
      expect(fileURLToPath(input)).toBe(expected);
    });
  });
});