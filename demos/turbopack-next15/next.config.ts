import { codeInspectorPlugin } from 'code-inspector-plugin';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = codeInspectorPlugin({
  bundler: 'turbopack',
  editor: 'code',
  showSwitch: true,
})({});

export default nextConfig;