// Middleware file to verify turbopack compatibility
// 
// ⚠️ This file should be REMOVED once Turbopack fixes the middleware issue ⚠️
// 
// With the improved pattern '**/app/**/*.{jsx,tsx,js,ts,mjs,mts}' in the turbopack plugin,
// code-inspector only processes files in app directories, naturally excluding middleware files.
// This prevents the Turbopack crash issue by default.
// 
// This is still a workaround. Track the issues for removal:
// - https://github.com/vercel/next.js/issues/79592
// - https://github.com/zh-lx/code-inspector/issues/357

export function middleware() {
  // Empty middleware - its presence is enough to test the workaround
}