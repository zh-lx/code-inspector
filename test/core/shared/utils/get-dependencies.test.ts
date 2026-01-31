import { getDependencies } from '@/core/src/shared/utils';
import { expect, describe, it, vi } from 'vitest';
import fs from 'fs';

vi.mock('fs');

describe('getDependencies', () => {
  it('should return an array of dependencies', () => {
    const packageJson = { 
      dependencies: {
        nextjs: '1.0.0'
      }
    }
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(packageJson));
    expect(getDependencies()).toBeInstanceOf(Array);
    expect(getDependencies().length).toBeGreaterThan(0);
  });

  it('should return an empty array when no package.json', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(getDependencies()).toBeInstanceOf(Array);
    expect(getDependencies().length).toBe(0);
  });

  it('should return an empty array when package.json is empty', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('');
    expect(getDependencies()).toBeInstanceOf(Array);
    expect(getDependencies().length).toBe(0);
  });
});
