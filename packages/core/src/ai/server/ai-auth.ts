import crypto from 'crypto';

const aiAuthToken = crypto.randomBytes(32).toString('hex');

function toAsciiBytes(value: string): Uint8Array {
  return Uint8Array.from(value, (char) => char.charCodeAt(0));
}

export function getAIAuthToken(): string {
  return aiAuthToken;
}

export function isAuthorizedAIRequest(requestUrl: URL): boolean {
  const providedToken = requestUrl.searchParams.get('token') || '';
  return (
    providedToken.length === aiAuthToken.length &&
    crypto.timingSafeEqual(
      toAsciiBytes(providedToken),
      toAsciiBytes(aiAuthToken),
    )
  );
}
