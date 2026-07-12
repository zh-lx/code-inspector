import crypto from 'crypto';

const terminalAuthToken = crypto.randomBytes(32).toString('hex');

function toAsciiBytes(value: string): Uint8Array {
  return Uint8Array.from(value, (char) => char.charCodeAt(0));
}

export function getTerminalAuthToken(): string {
  return terminalAuthToken;
}

export function isAuthorizedTerminalUpgrade(requestUrl: URL): boolean {
  const providedToken = requestUrl.searchParams.get('token') || '';
  return (
    providedToken.length === terminalAuthToken.length &&
    crypto.timingSafeEqual(
      toAsciiBytes(providedToken),
      toAsciiBytes(terminalAuthToken),
    )
  );
}
