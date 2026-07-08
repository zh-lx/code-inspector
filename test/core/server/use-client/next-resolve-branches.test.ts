import { beforeEach, describe, expect, it, vi } from 'vitest';

const nextPackageJsonPath =
  '/virtual/project/node_modules/next/package.json';
const nextResolvePath = '/virtual/project/node_modules';
const basedir = '/virtual/project/app/page.tsx';

const mockResolvePaths = vi.hoisted(() => vi.fn());
const mockPackageJsonContent = vi.hoisted(() => vi.fn());
const mockPackageJsonExists = vi.hoisted(() => vi.fn());

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  const fsMock = {
    ...actual,
    existsSync: vi.fn((filePath: string) => {
      if (
        filePath.includes('client.umd.js') ||
        filePath.includes('client.iife.js')
      ) {
        return true;
      }
      if (filePath === nextPackageJsonPath) {
        return mockPackageJsonExists();
      }
      return false;
    }),
    readFileSync: vi.fn((filePath: string) => {
      if (
        filePath.includes('client.umd.js') ||
        filePath.includes('client.iife.js')
      ) {
        return '// mocked client code';
      }
      if (filePath === nextPackageJsonPath) {
        return mockPackageJsonContent();
      }
      return '';
    }),
  };

  return {
    ...actual,
    ...fsMock,
    default: fsMock,
  };
});

vi.mock('module', async () => {
  const actual = await vi.importActual<typeof import('module')>('module');
  const resolve = Object.assign(vi.fn(() => nextPackageJsonPath), {
    paths: mockResolvePaths,
  });

  return {
    ...actual,
    createRequire: vi.fn(() => ({ resolve })),
  };
});

vi.mock('@/core/src/shared', async () => {
  const actual = await vi.importActual<typeof import('@/core/src/shared')>(
    '@/core/src/shared',
  );
  return {
    ...actual,
    getDependencies: vi.fn(() => []),
    getDependenciesMap: vi.fn(() => ({})),
  };
});

import { isNextGET16 } from '@/core/src/server/use-client';

describe('Next.js package resolution branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPackageJsonExists.mockReturnValue(true);
    mockPackageJsonContent.mockReturnValue(JSON.stringify({ version: '16.0.0' }));
  });

  it('should fall back to an empty version when package json content is empty', () => {
    mockResolvePaths.mockReturnValue([nextResolvePath]);
    mockPackageJsonContent.mockReturnValue('');

    expect(isNextGET16(basedir)).toBe(false);
  });
});
