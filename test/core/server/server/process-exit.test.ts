// @vitest-environment node
import { afterAll, beforeAll, expect, it } from 'vitest';
import { execFile } from 'child_process';
import { createRequire } from 'module';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const run = promisify(execFile);
const coreDir = path.resolve('packages/core');
let outDir: string;

// Build current source so the test never runs a stale or missing dist; stay under core so externals resolve.
beforeAll(async () => {
  const cacheDir = path.join(coreDir, 'node_modules/.cache');
  fs.mkdirSync(cacheDir, { recursive: true });
  outDir = fs.mkdtempSync(path.join(cacheDir, 'process-exit-test-'));
  const viteDir = path.dirname(
    createRequire(path.join(coreDir, 'package.json')).resolve(
      'vite/package.json',
    ),
  );
  await run(
    process.execPath,
    [
      path.join(viteDir, 'bin/vite.js'),
      'build',
      '--outDir',
      outDir,
      '--logLevel',
      'error',
    ],
    { cwd: coreDir },
  );
  // The server reads client bundles at import time, but their content does not matter here.
  fs.writeFileSync(path.join(outDir, 'client.umd.js'), '');
  fs.writeFileSync(path.join(outDir, 'client.iife.js'), '');
}, 60_000);

afterAll(() => {
  fs.rmSync(outDir, { recursive: true, force: true });
});

// Use a child process so Vitest cannot hide a leaked server handle.
it('serves inspector requests without keeping the host process alive', async () => {
  const entry = pathToFileURL(path.join(outDir, 'index.mjs')).href;
  const script = `
    import { createServer } from ${JSON.stringify(entry)};
    import http from 'node:http';

    const server = createServer(() => {
      const { port } = server.address();
      http.get({
        hostname: '127.0.0.1',
        port,
        path: '/__code_inspector_health',
        agent: false,
      }, (response) => {
        response.pipe(process.stdout);
      }).on('error', (error) => { throw error; });
    }, { port: 0 });
  `;

  // The request must complete and Node must exit naturally, without server.close().
  const { stdout } = await run(
    process.execPath,
    ['--input-type=module', '--eval', script],
    { timeout: 5_000 },
  );
  expect(JSON.parse(stdout)).toMatchObject({ name: 'code-inspector' });
}, 10_000);
