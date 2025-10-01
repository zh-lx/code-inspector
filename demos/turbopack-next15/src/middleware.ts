// Middleware file to verify code-inspector works with middleware present
//
// This file proves that code-inspector is compatible with Next.js middleware.
// The middleware crash bug existed in Next.js 15.4.4 and below but has been
// fixed in Next.js 15.6.0-canary.38 and later versions.

export function middleware() {
  // Empty middleware - its presence is enough to verify compatibility
}