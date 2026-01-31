import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
});

describe('isNextGET16', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
});
