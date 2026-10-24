import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'index.mjs' },
    emptyOutDir: false,
    rollupOptions: { external: ['node:url'] },
    target: 'node18',
  },
});
