// 启动本地接口，访问时唤起vscode
import http from 'http';
import portFinder from 'portfinder';
import launchEditor from './launch-editor';
import { DefaultPort } from '../shared/constant';
import type { CodeOptions, RecordInfo } from '../shared';

export function createServer(callback: (port: number) => any, options?: CodeOptions) {
  const server = http.createServer((req: any, res: any) => {
    // 收到请求唤醒vscode
    const params = new URLSearchParams(req.url.slice(1));
    const file = decodeURIComponent(params.get('file') as string);
    const line = Number(params.get('line'));
    const column = Number(params.get('column'));
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Private-Network': 'true',
    });
    res.end('ok');
    launchEditor(file, line, column, options?.editor, options?.openIn, options?.pathFormat);
  });

  // 寻找可用接口
  portFinder.getPort({ port: DefaultPort }, (err: Error, port: number) => {
    if (err) {
      throw err;
    }
    server.listen(port, () => {
      callback(port);
    });
  });
}

export async function startServer(options: CodeOptions, record: RecordInfo) {
  if (!record.port) {
    if (!record.findPort) {
      record.findPort = new Promise((resolve) => {
        createServer((port: number) => {
          resolve(port);
        }, options);
      });
    }
    record.port = await record.findPort;
  }
}
