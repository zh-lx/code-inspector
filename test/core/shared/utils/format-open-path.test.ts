import { formatOpenPath } from '@/core/src/shared/utils';
import { FormatColumn, FormatFile, FormatLine } from '@/core/src/shared/constant';
import { expect, describe, it } from 'vitest';

describe('formatOpenPath', () => {
  const testFile = '/path/to/file.js';
  const testLine = 10;
  const testColumn = 5;
  const basicPath = '/path/to/file.js:10:5'

  it('should return default format when format is boolean', () => {
    const result = formatOpenPath(testFile, testLine, testColumn, true);
    expect(result).toEqual([basicPath]);
  });

  it('should handle string line and column inputs', () => {
    const result = formatOpenPath(testFile, '10', '5', true);
    expect(result).toEqual([basicPath]);
  });

  it('should handle string format', () => {
    const format = `code -g ${FormatFile}:${FormatLine}:${FormatColumn}`;
    const result = formatOpenPath(testFile, testLine, testColumn, format);
    
    expect(result).toEqual([`code -g ${basicPath}`]);
  });

  it('should handle array format', () => {
    const format = [
      `code -g ${FormatFile}:${FormatLine}:${FormatColumn}`
    ];
    const result = formatOpenPath(testFile, testLine, testColumn, format);

    expect(result).toEqual([`code -g ${basicPath}`]);
  });

  it('should handle format string without all placeholders', () => {
    const format = `sublime ${FormatFile}`;
    const result = formatOpenPath(testFile, testLine, testColumn, format);
    
    expect(result).toEqual([`sublime ${testFile}`]);
  });
});
