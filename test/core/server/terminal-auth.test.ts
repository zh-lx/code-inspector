import { describe, expect, it } from 'vitest';
import {
  getTerminalAuthToken,
  isAuthorizedTerminalUpgrade,
} from '@/core/src/ai/server/terminal-auth';

describe('terminal websocket authorization', () => {
  it('requires the server token', () => {
    const token = getTerminalAuthToken();

    expect(
      isAuthorizedTerminalUpgrade(
        new URL(`http://localhost:5678/ai/terminal?token=${token}`),
      ),
    ).toBe(true);
    expect(
      isAuthorizedTerminalUpgrade(
        new URL('http://localhost:5678/ai/terminal?token=invalid'),
      ),
    ).toBe(false);
    expect(
      isAuthorizedTerminalUpgrade(
        new URL('http://localhost:5678/ai/terminal'),
      ),
    ).toBe(false);
  });
});
