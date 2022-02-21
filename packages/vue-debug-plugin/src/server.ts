// 启动本地接口，访问时唤起vscode
import http from 'http';
import portFinder from 'portfinder';
import launchEditor from './launch-editor';

let started = false;

export = function StartServer(callback: Function) {
  if (started) {
    return;
  }
  started = true;
  const server = http.createServer((req, res) => {
    // 收到请求唤醒vscode
    const params = new URLSearchParams(req.url.slice(1));
    const file = params.get('file');
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
  portFinder.getPort({ port: 4000 }, (err: Error, port: number) => {
    if (err) {
      throw err;
    }
    server.listen(port, () => {
      callback(port);
    });
  });
};
