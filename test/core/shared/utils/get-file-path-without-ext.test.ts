import { getFilePathWithoutExt } from '@/core/src/shared/utils';
import { expect, describe, it } from 'vitest';

describe('getFilePathWithoutExt', () => {
  it('should handle paths with directories', () => {
    expect(getFilePathWithoutExt('/path/to/file.js')).toBe('/path/to/file');
  });

  it('should handle files with multiple dots', () => {
    expect(getFilePathWithoutExt('file.test.js')).toBe('file.test');
  });
});
