import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
  test: {
    environment: 'jsdom',
    fileParallelism: false,
    // e2e 用 @playwright/test 运行，排除避免被 vitest 误收集
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    coverage: {
      include: ['packages/*/src/**'],
      exclude: [
        '**/*.d.ts',
        'packages/core/src/shared/type.ts',
        'packages/core/src/client/ai-terminal.ts',
        'packages/core/src/client/ai.ts',
        'packages/core/src/client/i18n.ts',
        'packages/core/src/client/index.ts',
        'packages/core/src/server/ai-provider-common.ts',
        'packages/core/src/server/ai-provider-opencode.ts',
        'packages/core/src/server/ai-terminal.ts',
        'packages/core/src/server/ai.ts',
      ],
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
