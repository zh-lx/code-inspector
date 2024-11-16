import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      include: ['packages/*/src/**'],
    },
    alias: {
      '@': path.resolve(__dirname, 'packages')
    }
  },
})