import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ['src/index.ts'],
      formats: ['es', 'cjs'],
      fileName: '[name]',
      name: 'viteInspectorCore',
    },
    minify: true,
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'os',
        'path',
        'fs',
        'process',
        'crypto',
        'http',
        'https',
        'chalk',
        'portfinder',
        'child_process',
      ],
    },
  },
});
