import { defineConfig } from 'astro/config';
import { codeInspectorPlugin } from 'code-inspector-plugin'

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [
      codeInspectorPlugin({
        bundler: 'vite'
      })
    ]
  }
});
