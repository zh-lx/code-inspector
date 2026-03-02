import { describe, expect, it } from 'vitest';
import { getAIOptions } from '@/core/src/server/ai';

describe('getAIOptions', () => {
  it('should return undefined when AI is not configured', () => {
    expect(getAIOptions(undefined)).toBeUndefined();
    expect(getAIOptions({})).toBeUndefined();
    expect(getAIOptions({ ai: {} })).toBeUndefined();
  });

  it('should parse codex boolean config', () => {
    expect(getAIOptions({ ai: { codex: true } })).toEqual({
      provider: 'codex',
      options: {},
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
      })
    ).toEqual({
      provider: 'codex',
      options: {
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
            agent: 'sdk',
            options: {
              model: 'gpt-5-codex',
              approvalPolicy: 'full-auto',
            },
          },
        },
      })
    ).toEqual({
      provider: 'codex',
      options: {
        agent: 'sdk',
        options: {
          model: 'gpt-5-codex',
          approvalPolicy: 'full-auto',
        },
      },
    });
  });

  it('should parse claudeCode config', () => {
    expect(getAIOptions({ ai: { claudeCode: true } })).toEqual({
      provider: 'claudeCode',
      options: {},
    });
  });

  it('should parse claudeCode config with agent and options', () => {
    expect(
      getAIOptions({
        ai: {
          claudeCode: {
            agent: 'sdk',
            options: {
              model: 'claude-sonnet-4-5',
              maxTurns: 20,
            },
          },
        },
      })
    ).toEqual({
      provider: 'claudeCode',
      options: {
        agent: 'sdk',
        options: {
          model: 'claude-sonnet-4-5',
          maxTurns: 20,
        },
      },
    });
  });

  it('should prefer codex when both codex and claudeCode are configured', () => {
    expect(
      getAIOptions({
        ai: {
          codex: true,
          claudeCode: true,
        },
      })
    ).toEqual({
      provider: 'codex',
      options: {},
    });
  });
});
