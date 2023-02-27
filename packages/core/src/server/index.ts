// 启动本地接口，访问时唤起vscode
const http = require('http');
const portFinder = require('portfinder');
import launchEditor from './launch-editor';
export { getEnhanceContent } from './content-enhance';

let started = false;
let recordPort = 5678;

export function StartServer(callback: Function) {
  if (started) {
    callback(recordPort);
    return;
  }
  started = true;
  const server = http.createServer((req: any, res: any) => {
    // 收到请求唤醒vscode
    const params = new URLSearchParams(req.url.slice(1));
    const file = params.get('file') as string;
    const line = Number(params.get('line'));
    const column = Number(params.get('column'));
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers':
        'Content-Type,XFILENAME,XFILECATEGORY,XFILESIZE,X-URL-PATH,x-access-token',
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
