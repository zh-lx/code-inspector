/// <reference types="node" />
import http from 'http';
import { type CodeOptions, type RecordInfo } from '../shared';
export declare const ProjectRootPath: string;
export declare function getRelativePath(filePath: string): string;
export declare function createServer(callback: (port: number) => any, options?: CodeOptions): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
export declare function startServer(options: CodeOptions, record: RecordInfo): Promise<void>;
