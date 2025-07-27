import type { NextConfig } from 'next';
import { codeInspectorPlugin } from 'code-inspector-plugin';

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: codeInspectorPlugin({
        bundler: 'turbopack',
      }),
    },
  },
};

export default nextConfig;
