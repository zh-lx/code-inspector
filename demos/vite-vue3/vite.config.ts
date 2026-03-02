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
          claudeCode: {
            agent: 'sdk',
            options: {
              model: 'claude-opus-4-6',
              maxTurns: 50,
            },
          },
          // codex: {
          //   agent: 'sdk',
          //   options: {
          //     model: 'gpt-5.3-codex'
          //   }
          // }
        },
        defaultAction: 'ai'
      }
      // pathFormat: ['-g', '-r', '{file}:{line}:{column}']
    }),
    vueJsx(),
  ],
});
