// @vitest-environment node
import { expect, it } from 'vitest';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { pathToFileURL } from 'url';

// Use the built package in a child process so Vitest cannot hide a leaked server handle.
it('serves inspector requests without keeping the host process alive', async () => {
  const entry = pathToFileURL(
    path.resolve('packages/core/dist/index.mjs'),
  ).href;
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
  const { stdout } = await promisify(execFile)(
    process.execPath,
    ['--input-type=module', '--eval', script],
    { timeout: 5_000 },
  );
  expect(JSON.parse(stdout)).toMatchObject({ name: 'code-inspector' });
}, 10_000);
