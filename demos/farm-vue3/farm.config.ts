import { defineConfig } from '@farmfe/core';
import vue from '@vitejs/plugin-vue';
import { codeInspectorPlugin } from 'code-inspector-plugin'

export default defineConfig({
  vitePlugins: [
    vue(),
    codeInspectorPlugin({
      bundler: 'vite'
    })
  ]
});
