import { defineConfig } from '@farmfe/core';
import vue from '@vitejs/plugin-vue';
import { createRequire } from 'node:module';
import { codeInspectorPlugin } from 'code-inspector-plugin';

const require = createRequire(import.meta.url);
const vueRuntime = require.resolve(
  'vue/dist/vue.runtime.esm-bundler.js',
);

export default defineConfig({
  compilation: {
    resolve: {
      alias: {
        'vue$': vueRuntime,
      },
    },
  },
  vitePlugins: [
    vue(),
    codeInspectorPlugin({
      bundler: 'vite',
    }),
  ],
});
