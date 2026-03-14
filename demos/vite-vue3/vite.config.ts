import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { CodeInspectorPlugin } from 'code-inspector-plugin';
import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    CodeInspectorPlugin({
      bundler: 'vite',
      behavior: {
        ai: {
          // claudeCode: {
          //   type: 'cli',
          //   options: {
          //     models: ['claude-opus-4-6', 'claude-sonnet-4-5'],
          //     maxTurns: 50,
          //   },
          // },
          codex: {
            type: 'cli',
            options: {
              models: ['gpt-5.2'],
            },
          },
        },
        defaultAction: 'ai',
      },
      // pathFormat: ['-g', '-r', '{file}:{line}:{column}']
    }),
    vueJsx(),
  ],
});
