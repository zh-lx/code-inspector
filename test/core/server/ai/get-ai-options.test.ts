import { describe, expect, it } from 'vitest';
import {
  getAIOptions,
  getAvailableAIProviders,
  resolveAIOptions,
} from '@/core/src/server/ai';

describe('getAIOptions', () => {
  it('should return undefined when AI is not configured', () => {
    expect(getAIOptions(undefined)).toBeUndefined();
    expect(getAIOptions({})).toBeUndefined();
    expect(getAIOptions({ ai: {} })).toBeUndefined();
  });

  it('should parse codex boolean config', () => {
    expect(getAIOptions({ ai: { codex: true } })).toEqual({
      codex: {},
    });
  });

  it('should parse codex object config', () => {
    expect(
      getAIOptions({
        ai: {
          codex: {
            options: {
              model: 'gpt-5.3-codex',
              sandbox: 'workspace-write',
            },
          },
        },
      }),
    ).toEqual({
      codex: {
        options: {
          model: 'gpt-5.3-codex',
          sandbox: 'workspace-write',
        },
      },
    });
  });

  it('should parse codex config with agent and options', () => {
    expect(
      getAIOptions({
        ai: {
          codex: {
            type: 'sdk',
            options: {
              model: 'gpt-5-codex',
              approvalPolicy: 'full-auto',
            },
          },
        },
      }),
    ).toEqual({
      codex: {
        type: 'sdk',
        options: {
          model: 'gpt-5-codex',
          approvalPolicy: 'full-auto',
        },
      },
    });
  });

  it('should parse claudeCode config', () => {
    expect(getAIOptions({ ai: { claudeCode: true } })).toEqual({
      claudeCode: {},
    });
  });

  it('should parse claudeCode config with agent and options', () => {
    expect(
      getAIOptions({
        ai: {
          claudeCode: {
            type: 'sdk',
            options: {
              model: 'claude-sonnet-4-5',
              maxTurns: 20,
            },
          },
        },
      }),
    ).toEqual({
      claudeCode: {
        type: 'sdk',
        options: {
          model: 'claude-sonnet-4-5',
          maxTurns: 20,
        },
      },
    });
  });

  it('should keep both codex and claudeCode when both are configured', () => {
    expect(
      getAIOptions({
        ai: {
          codex: true,
          claudeCode: true,
        },
      }),
    ).toEqual({
      codex: {},
      claudeCode: {},
    });
  });
});

describe('getAvailableAIProviders', () => {
  it('should return providers in stable priority order', () => {
    expect(
      getAvailableAIProviders({
        claudeCode: {},
        codex: {},
      }),
    ).toEqual(['codex', 'claudeCode']);
  });
});

describe('resolveAIOptions', () => {
  it('should honor requested provider when configured', () => {
    const aiOptions = getAIOptions({
      ai: {
        claudeCode: true,
        codex: true,
      },
    });
    expect(resolveAIOptions(aiOptions, 'claudeCode')).toEqual({
      provider: 'claudeCode',
      options: {},
    });
  });

  it('should fallback to default priority provider when request provider is missing', () => {
    const aiOptions = getAIOptions({
      ai: {
        claudeCode: true,
        codex: true,
      },
    });
    expect(resolveAIOptions(aiOptions)).toEqual({
      provider: 'codex',
      options: {},
    });
  });
});
