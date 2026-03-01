/// <reference types="node" />
/**
 * 本地服务器模块 - 处理 IDE 打开和 AI 请求
 */
import http from 'http';
import type { CodeOptions, RecordInfo } from '../shared';
export declare function getEnvVars(): Record<string, string>;
/** 项目根目录 */
export declare const ProjectRootPath: string;
/**
 * 获取相对路径
 */
export declare function getRelativePath(filePath: string): string;
/**
 * 根据用户配置返回绝对路径或者相对路径
 */
export declare function getRelativeOrAbsolutePath(filePath: string, pathType?: 'relative' | 'absolute'): string;
/**
 * 创建 HTTP 服务器
 */
export declare function createServer(callback: (port: number) => void, options?: CodeOptions, record?: RecordInfo): http.Server;
/**
 * 启动服务器
 */
export declare function startServer(options: CodeOptions, record: RecordInfo): Promise<void>;
