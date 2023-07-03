// 启动本地接口，访问时唤起vscode
import http from 'http';
import portFinder from 'portfinder';
import path from 'path';
import launchEditor from './launch-editor';
export { getEnhanceContent } from './content-enhance';
import { parse } from '@vue/compiler-sfc';

let started = false;
let recordPort = 5678;

export function StartServer(callback: Function, rootPath: string) {
  if (started) {
    callback(recordPort);
    return;
  }
  started = true;
  const server = http.createServer((req: any, res: any) => {
    // 收到请求唤醒vscode
    const params = new URLSearchParams(req.url.slice(1));
    const file = path.join(rootPath, params.get('file') as string);
    const line = Number(params.get('line'));
    const column = Number(params.get('column'));
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    });
    res.end('ok');
    launchEditor(file, line, column);
  });

  // 寻找可用接口
  portFinder.getPort({ port: recordPort }, (err: Error, port: number) => {
    if (err) {
      throw err;
    }
    server.listen(port, () => {
      recordPort = port;
      callback(port);
    });
  });
}

export function _normalizePath(filepath: string) {
  let normalizedPath = path.normalize(filepath);

  // Convert Windows path separators to Mac path separators
  if (process.platform === 'win32') {
    normalizedPath = normalizedPath.replace(/\\/g, '/');
  }

  return normalizedPath;
}

export const parseSFC = parse;
