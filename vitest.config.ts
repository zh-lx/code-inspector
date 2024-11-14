import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
  test: {
    coverage: {
      include: ['packages/*/src/**'],
    },
    alias: {
      '@': path.resolve(__dirname, 'packages')
    }
  },
})