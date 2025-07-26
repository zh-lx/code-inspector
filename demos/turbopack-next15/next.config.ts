import { codeInspectorPlugin } from 'code-inspector-plugin';

export default {
  turbopack: {
    rules: codeInspectorPlugin({
      bundler: 'turbopack',
    }),
  },
};
