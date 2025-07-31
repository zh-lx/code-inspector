/// <reference types="node" />
import http from 'http';
import type { PathType, CodeOptions, RecordInfo } from '../shared';
export declare const ProjectRootPath: string;
export declare function getRelativePath(filePath: string): string;
export declare function getRelativeOrAbsolutePath(filePath: string, pathType?: PathType): string;
export declare function createServer(callback: (port: number) => any, options?: CodeOptions, record?: RecordInfo): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
export declare function startServer(options: CodeOptions, record: RecordInfo): Promise<void>;
