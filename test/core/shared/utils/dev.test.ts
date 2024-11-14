import { isDev } from '@/core/src/shared/utils';
import { expect, describe, it } from 'vitest';

describe('isDev', () => {
  // 测试 userDev 为布尔值的情况
  it('should return false when userDev is false, regardless of systemDev', () => {
    expect(isDev(false, true)).toBe(false);
    expect(isDev(false, false)).toBe(false);
  });

  it('should return true when userDev is true, regardless of systemDev', () => {
    expect(isDev(true, true)).toBe(true);
    expect(isDev(true, false)).toBe(true);
  });

  // 测试 userDev 为函数的情况
  it('should evaluate function and return its result', () => {
    expect(isDev(() => true, false)).toBe(true);
    expect(isDev(() => false, true)).toBe(false);
  });

  // 测试 userDev 为 undefined 的情况
  it('should fall back to systemDev when userDev is undefined', () => {
    expect(isDev(undefined, true)).toBe(true);
    expect(isDev(undefined, false)).toBe(false);
  });
});