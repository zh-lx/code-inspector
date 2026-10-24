import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'index.mjs' },
    emptyOutDir: false,
    rollupOptions: { external: ['@code-inspector/core', 'node:fs', 'node:path', 'node:url'] },
    target: 'node18',
  },
});
