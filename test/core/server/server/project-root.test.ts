import { afterEach, describe, expect, it, vi } from 'vitest';

describe('server project root helpers', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('child_process');
  });

  it('should derive relative path when git root is available', async () => {
    vi.doMock('child_process', async (importOriginal) => {
      const actual = await importOriginal<typeof import('child_process')>();
      return {
        ...actual,
        default: {
          ...actual,
          execSync: vi.fn(() => '/repo/root\n'),
        },
        execSync: vi.fn(() => '/repo/root\n'),
      };
    });

    const serverModule = await import('@/core/src/server/server');

    expect(serverModule.ProjectRootPath).toBe('/repo/root');
    expect(serverModule.getRelativePath('/repo/root/src/main.ts')).toBe(
      'src/main.ts',
    );
  });

  it('should fall back to empty project root outside git repo', async () => {
    vi.doMock('child_process', async (importOriginal) => {
      const actual = await importOriginal<typeof import('child_process')>();
      const execSync = vi.fn(() => {
        throw new Error('not a git repo');
      });
      return {
        ...actual,
        default: {
          ...actual,
          execSync,
        },
        execSync,
      };
    });

    const serverModule = await import('@/core/src/server/server');

    expect(serverModule.ProjectRootPath).toBe('');
    expect(serverModule.getRelativePath('/tmp/src/main.ts')).toBe(
      '/tmp/src/main.ts',
    );
  });
});
