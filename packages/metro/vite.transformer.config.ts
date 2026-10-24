import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/transformer.ts', formats: ['cjs'], fileName: () => 'transformer.cjs' },
    emptyOutDir: false,
    rollupOptions: { external: ['@code-inspector/core', 'node:path', 'node:module'] },
    target: 'node18',
  },
});
