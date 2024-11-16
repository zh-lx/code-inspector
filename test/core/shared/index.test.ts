import * as sharedExports from '@/core/src/shared';
import { describe, it, expect } from 'vitest';

describe('Shared index exports', () => {
  it('should export all modules correctly', () => {
    // 检查是否包含所有预期的导出模块
    const expectedExports = [
      'getMappingFilePath',
    ];

    const actualExports = Object.keys(sharedExports);
    
    // 确保所有预期的导出都存在
    expectedExports.forEach(exportName => {
      expect(actualExports).toContain(exportName);
    });
  });

  it('should not have undefined exports', () => {
    // print
    Object.entries(sharedExports).forEach(([key, value]) => {
      expect(value).toBeDefined();
    });
  });
});