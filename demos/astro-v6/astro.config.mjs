import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { codeInspectorPlugin } from 'code-inspector-plugin';

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  vite: {
    plugins: [
      codeInspectorPlugin({
        bundler: 'vite',
      }),
    ],
  },
});
