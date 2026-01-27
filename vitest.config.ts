import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      include: ['packages/*/src/**'],
    },
    alias: {
      '@': path.resolve(__dirname, 'packages'),
      '@code-inspector/core': path.resolve(__dirname, 'packages/core/src'),
      '@code-inspector/vite': path.resolve(__dirname, 'packages/vite/src'),
      '@code-inspector/webpack': path.resolve(__dirname, 'packages/webpack/src'),
      '@code-inspector/esbuild': path.resolve(__dirname, 'packages/esbuild/src'),
      '@code-inspector/mako': path.resolve(__dirname, 'packages/mako/src'),
      '@code-inspector/turbopack': path.resolve(__dirname, 'packages/turbopack/src'),
    }
  },
})