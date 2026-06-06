import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock fs.readFileSync to handle missing client files and package.json
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs') as typeof fs;
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn((filePath: string) => {
        if (typeof filePath === 'string' && (filePath.includes('client.umd.js') || filePath.includes('client.iife.js'))) {
          return true;
        }
        return actual.existsSync(filePath);
      }),
      readFileSync: vi.fn((filePath: string, encoding?: string) => {
        if (typeof filePath === 'string' && (filePath.includes('client.umd.js') || filePath.includes('client.iife.js'))) {
          return '// mocked client code';
        }
        return actual.readFileSync(filePath, encoding as BufferEncoding);
      }),
    },
    existsSync: vi.fn((filePath: string) => {
      if (typeof filePath === 'string' && (filePath.includes('client.umd.js') || filePath.includes('client.iife.js'))) {
        return true;
      }
      return actual.existsSync(filePath);
    }),
    readFileSync: vi.fn((filePath: string, encoding?: string) => {
      if (typeof filePath === 'string' && (filePath.includes('client.umd.js') || filePath.includes('client.iife.js'))) {
        return '// mocked client code';
      }
      return actual.readFileSync(filePath, encoding as BufferEncoding);
    }),
  };
});

import { isNextjsProject, isNextGET16 } from '@/core/src/server/use-client';
import * as sharedUtils from '@/core/src/shared/utils';

describe('isNextjsProject', () => {
  let testDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-next-resolve-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (testDir && fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should return true when next is in dependencies', () => {
    vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['next', 'react']);
    expect(isNextjsProject()).toBe(true);
  });

  it('should return false when next is not in any dependencies', () => {
    vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['react', 'vue']);
    expect(isNextjsProject()).toBe(false);
  });

  it('should return false when dependencies is empty', () => {
    vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue([]);
    expect(isNextjsProject()).toBe(false);
  });

  it('should detect next by resolving next/package.json from basedir', () => {
    const nextPackageDir = path.join(testDir, 'node_modules/next');
    fs.mkdirSync(nextPackageDir, { recursive: true });
    fs.writeFileSync(
      path.join(nextPackageDir, 'package.json'),
      JSON.stringify({ name: 'next', version: '16.2.3' }),
    );
    vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue([]);

    expect(isNextjsProject(path.join(testDir, 'app'))).toBe(true);
  });
});

describe('isNextGET16', () => {
  let testDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-next-version-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (testDir && fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should return true when next version is 16 or higher', () => {
    vi.spyOn(sharedUtils, 'getDependenciesMap').mockReturnValue({ next: '16.0.0' });
    expect(isNextGET16()).toBe(true);
  });

  it('should return true when next version is latest', () => {
    vi.spyOn(sharedUtils, 'getDependenciesMap').mockReturnValue({ next: 'latest' });
    expect(isNextGET16()).toBe(true);
  });

  it('should return false when next version is below 16', () => {
    vi.spyOn(sharedUtils, 'getDependenciesMap').mockReturnValue({ next: '15.0.0' });
    expect(isNextGET16()).toBe(false);
  });

  it('should return false when next version is 14', () => {
    vi.spyOn(sharedUtils, 'getDependenciesMap').mockReturnValue({ next: '14.2.3' });
    expect(isNextGET16()).toBe(false);
  });

  it('should return false when next is not installed', () => {
    vi.spyOn(sharedUtils, 'getDependenciesMap').mockReturnValue({ react: '18.0.0' });
    expect(isNextGET16()).toBe(false);
  });

  it('should handle version with caret prefix', () => {
    vi.spyOn(sharedUtils, 'getDependenciesMap').mockReturnValue({ next: '^16.0.0' });
    expect(isNextGET16()).toBe(true);
  });

  it('should handle version with tilde prefix', () => {
    vi.spyOn(sharedUtils, 'getDependenciesMap').mockReturnValue({ next: '~16.0.0' });
    expect(isNextGET16()).toBe(true);
  });

  it('should return true for version 20', () => {
    vi.spyOn(sharedUtils, 'getDependenciesMap').mockReturnValue({ next: '20.0.0' });
    expect(isNextGET16()).toBe(true);
  });

  it('should return false when dependencies map is empty', () => {
    vi.spyOn(sharedUtils, 'getDependenciesMap').mockReturnValue({});
    expect(isNextGET16()).toBe(false);
  });

  it('should read next version from resolved next/package.json before dependency declarations', () => {
    const nextPackageDir = path.join(testDir, 'node_modules/next');
    fs.mkdirSync(nextPackageDir, { recursive: true });
    fs.writeFileSync(
      path.join(nextPackageDir, 'package.json'),
      JSON.stringify({ name: 'next', version: '16.2.3' }),
    );
    vi.spyOn(sharedUtils, 'getDependenciesMap').mockReturnValue({
      next: '15.0.0',
    });

    expect(isNextGET16(path.join(testDir, 'app/page.tsx'))).toBe(true);
  });

  it('should return false when resolved next version is below 16', () => {
    const nextPackageDir = path.join(testDir, 'node_modules/next');
    fs.mkdirSync(nextPackageDir, { recursive: true });
    fs.writeFileSync(
      path.join(nextPackageDir, 'package.json'),
      JSON.stringify({ name: 'next', version: '15.5.0' }),
    );
    vi.spyOn(sharedUtils, 'getDependenciesMap').mockReturnValue({
      next: '16.0.0',
    });

    expect(isNextGET16(path.join(testDir, 'app/page.tsx'))).toBe(false);
  });
});
