import assert from 'node:assert/strict';
import path from 'node:path';
import { withCodeInspectorMetro } from '../../packages/metro/dist/index.mjs';

const original = path.resolve('test/metro/fixtures/upstream-transformer.cjs');
const calls = [];
const config = withCodeInspectorMetro(
  {
    transformer: { babelTransformerPath: original, existing: true },
    server: {
      enhanceMiddleware(middleware) {
        calls.push('existing wrapper');
        return middleware;
      },
    },
    extra: true,
  },
  { projectRoot: process.cwd(), injectTo: path.resolve('app/_layout.tsx'), editor: 'code-insiders' },
);
assert.equal(config.extra, true);
assert.equal(config.transformer.existing, true);
assert.equal(config.transformer.babelTransformerPath, path.resolve('packages/metro/dist/transformer.cjs'));
assert.equal(JSON.parse(process.env.CODE_INSPECTOR_METRO_CONFIG).originalTransformerPath, original);
assert.equal(JSON.parse(process.env.CODE_INSPECTOR_METRO_CONFIG).editor, 'code-insiders');
const enhanced = config.server.enhanceMiddleware((request, response, next) => {
  calls.push(request.url);
  next();
});
enhanced({ url: '/entry.bundle?platform=ios&dev=true' }, {}, () => {});
enhanced({ url: '/entry.bundle?platform=web&dev=false' }, {}, () => {});
assert.deepEqual(calls, [
  'existing wrapper',
  '/entry.bundle?platform=ios&dev=true',
  '/entry.bundle?platform=web&dev=false',
]);
