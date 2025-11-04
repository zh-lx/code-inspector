import { codeInspectorPlugin } from 'code-inspector-plugin';
import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
});

const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  turbopack: {
    rules: codeInspectorPlugin({
      bundler: 'turbopack',
    }),
  },
};

export default withMDX(nextConfig);
