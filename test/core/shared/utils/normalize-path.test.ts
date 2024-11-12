import { normalizePath } from '@/core/src/shared/utils';
import { expect, describe, it, afterEach } from 'vitest';

describe('normalizePath', () => {
  // 保存原始的 process.platform，执行完后恢复
  const originalPlatform = process.platform;
  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
  });

  it('should normalize Unix-style paths on non-Windows platforms', () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin'
    });

    const testCases = [
      {
        input: '/path/to/file',
        expected: '/path/to/file'
      },
      {
        input: 'path//to////file',
        expected: 'path/to/file'
      },
      {
        input: './path/to/file',
        expected: 'path/to/file'
      },
      {
        input: '../path/to/file',
        expected: '../path/to/file'
      },
    ];

    testCases.forEach(({ input, expected }) => {
      expect(normalizePath(input)).toBe(expected);
    });
  });

  it('should convert Windows paths to Unix-style paths on Windows platform', () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    });

    const testCases = [
      {
        input: 'C:\\path\\to\\file',
        expected: 'C:/path/to/file'
      },
      {
        input: 'C:/path/to/file',
        expected: 'C:/path/to/file'
      },
      {
        input: 'C:/path\\to/file',
        expected: 'C:/path/to/file'
      }
    ];

    testCases.forEach(({ input, expected }) => {
      expect(normalizePath(input)).toBe(expected);
    });
  });

  it('should handle empty paths', () => {
    expect(normalizePath('')).toBe('.');
  });

  it('should handle paths with dots', () => {
    const testCases = [
      {
        input: './././file',
        expected: 'file'
      },
      {
        input: '../../../file',
        expected: '../../../file'
      }
    ];

    testCases.forEach(({ input, expected }) => {
      expect(normalizePath(input)).toBe(expected);
    });
  });
});
