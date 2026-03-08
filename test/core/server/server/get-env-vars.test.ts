import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('getEnvVars', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should use launch-ide env variables when project root exists', async () => {
    vi.doMock('child_process', async (importOriginal) => {
      const actual = await importOriginal<typeof import('child_process')>();
      const execSync = vi.fn(() => '/mock/project\n');
      return {
        ...actual,
        execSync,
        default: {
          ...(actual as any).default,
          execSync,
        },
      } as any;
    });
    const mockGetEnvVariables = vi.fn(() => ({ A: '1', B: '2' }));
    vi.doMock('launch-ide', () => ({
      launchIDE: vi.fn(),
      getEnvVariables: mockGetEnvVariables,
    }));

    const { getEnvVars } = await import('@/core/src/server/server');

    expect(getEnvVars()).toEqual({ A: '1', B: '2' });
    expect(mockGetEnvVariables).toHaveBeenCalledWith('/mock/project');
  });

  it('should fallback to process.env when project root is unavailable', async () => {
    vi.doMock('child_process', async (importOriginal) => {
      const actual = await importOriginal<typeof import('child_process')>();
      const execSync = vi.fn(() => {
        throw new Error('not a git repo');
      });
      return {
        ...actual,
        execSync,
        default: {
          ...(actual as any).default,
          execSync,
        },
      } as any;
    });
    const mockGetEnvVariables = vi.fn(() => ({ SHOULD_NOT: 'BE_USED' }));
    vi.doMock('launch-ide', () => ({
      launchIDE: vi.fn(),
      getEnvVariables: mockGetEnvVariables,
    }));

    const { getEnvVars } = await import('@/core/src/server/server');
    const result = getEnvVars();

    expect(result).toBe(process.env);
    expect(mockGetEnvVariables).not.toHaveBeenCalled();
  });
});
