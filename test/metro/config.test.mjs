import assert from 'node:assert/strict';
import path from 'node:path';
import { withCodeInspectorMetro } from '../../packages/metro/dist/index.mjs';

const original = path.resolve('test/metro/fixtures/upstream-transformer.cjs');
const config = withCodeInspectorMetro(
  { transformer: { babelTransformerPath: original, existing: true }, extra: true },
  { projectRoot: process.cwd(), injectTo: path.resolve('app/_layout.tsx'), editor: 'code-insiders' },
);
assert.equal(config.extra, true);
assert.equal(config.transformer.existing, true);
assert.equal(config.transformer.babelTransformerPath, path.resolve('packages/metro/dist/transformer.cjs'));
assert.equal(JSON.parse(process.env.CODE_INSPECTOR_METRO_CONFIG).originalTransformerPath, original);
assert.equal(JSON.parse(process.env.CODE_INSPECTOR_METRO_CONFIG).editor, 'code-insiders');
