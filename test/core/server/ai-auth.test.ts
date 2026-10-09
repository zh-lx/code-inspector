import { describe, expect, it } from 'vitest';
import {
  getAIAuthToken,
  isAuthorizedAIRequest,
} from '@/core/src/ai/server/ai-auth';

describe('terminal websocket authorization', () => {
  it('requires the server token', () => {
    const token = getAIAuthToken();

    expect(
      isAuthorizedAIRequest(
        new URL(`http://localhost:5678/ai/terminal?token=${token}`),
      ),
    ).toBe(true);
    expect(
      isAuthorizedAIRequest(
        new URL('http://localhost:5678/ai/terminal?token=invalid'),
      ),
    ).toBe(false);
    expect(
      isAuthorizedAIRequest(
        new URL('http://localhost:5678/ai/terminal'),
      ),
    ).toBe(false);
  });

  it('supports an auth token shared by another process', () => {
    const token = 'a'.repeat(64);

    expect(
      isAuthorizedAIRequest(
        new URL(`http://localhost:5678/ai?token=${token}`),
        token,
      ),
    ).toBe(true);
    expect(
      isAuthorizedAIRequest(
        new URL(`http://localhost:5678/ai?token=${getAIAuthToken()}`),
        token,
      ),
    ).toBe(false);
  });
});
