import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface CapturedRequest {
  url: string;
  file: string | null;
  line: number | null;
  column: number | null;
}

export class MockInspectorServer {
  private server: http.Server | null = null;
  private captured: CapturedRequest | null = null;
  private port: number;

  constructor(port: number = 5678) {
    this.port = port;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
        // 设置 CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        const url = new URL(req.url!, `http://localhost:${this.port}`);

        if (!this.captured) {
          this.captured = {
            url: req.url!,
            file: url.searchParams.get('file'),
            line: url.searchParams.get('line') ? Number(url.searchParams.get('line')) : null,
            column: url.searchParams.get('column') ? Number(url.searchParams.get('column')) : null,
          };
        }

        // 返回空的 GIF 图片
        res.writeHead(200, {
          'Content-Type': 'image/gif',
          'Content-Length': '43'
        });
        // 1x1 透明 GIF
        const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        res.end(gif);
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.port} is already in use`));
        } else {
          reject(err);
        }
      });

      this.server.listen(this.port, () => {
        resolve();
      });
    });
  }

  getCaptured(): CapturedRequest | null {
    return this.captured;
  }

  reset(): void {
    this.captured = null;
  }

  async close(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.server = null;
          resolve();
        });
      });
    }
  }
}
