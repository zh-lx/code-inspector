import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@code-inspector/core', () => ({
  transformCode: vi.fn(async ({ content }) => `transformed:${content}`),
  startServer: vi.fn(async () => undefined),
  getProjectRecord: vi.fn(() => ({ port: 5678 })),
  getInjectedCode: vi.fn(() => 'injected-runtime;'),
}));

import { transform, getCacheKey } from '../../packages/metro/src/transformer';

const projectRoot = process.cwd();
const injectTo = path.join(projectRoot, 'app/_layout.tsx');
const upstreamPath = path.join(projectRoot, 'test/metro/fixtures/upstream-transformer.cjs');

describe('Expo Metro adapter', () => {
  it('preserves existing Metro config and delegates native and production bundles unchanged', async () => {
    process.env.CODE_INSPECTOR_METRO_CONFIG = JSON.stringify({ projectRoot, injectTo, originalTransformerPath: upstreamPath });
    expect((await transform({ filename: injectTo, src: 'native', options: { platform: 'ios', dev: true } }))?.src).toBe('native');
    expect((await transform({ filename: injectTo, src: 'production', options: { platform: 'web', dev: false } }))?.src).toBe('production');
    expect(getCacheKey({})).toContain('upstream-key');
  });

  it('transforms app sources and injects the client only into the chosen web entry', async () => {
    process.env.CODE_INSPECTOR_METRO_CONFIG = JSON.stringify({ projectRoot, injectTo, originalTransformerPath: upstreamPath });
    const source = path.join(projectRoot, 'app/example.tsx');
    expect((await transform({ filename: source, src: 'jsx', options: { platform: 'web', dev: true } }))?.src).toBe('transformed:jsx');
    expect((await transform({ filename: injectTo, src: 'root', options: { platform: 'web', dev: true } }))?.src).toBe('injected-runtime;\ntransformed:root');
    const excluded = path.join(projectRoot, 'node_modules/pkg/index.js');
    expect((await transform({ filename: excluded, src: 'dependency', options: { platform: 'web', dev: true } }))?.src).toBe('dependency');
  });
});
