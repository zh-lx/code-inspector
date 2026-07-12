/// <reference types="node" />
import http from 'http';
export interface HistoryEntry {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    provider: string | null;
    messageCount: number;
}
/**
 * 获取对话历史列表
 */
export declare function handleAIHistoryListRequest(res: http.ServerResponse, corsHeaders: Record<string, string>, projectRootPath: string, expireDays: number): Promise<void>;
/**
 * 保存对话
 */
export declare function handleAIHistorySaveRequest(req: http.IncomingMessage, res: http.ServerResponse, corsHeaders: Record<string, string>, projectRootPath: string): Promise<void>;
/**
 * 加载对话
 */
export declare function handleAIHistoryLoadRequest(req: http.IncomingMessage, res: http.ServerResponse, corsHeaders: Record<string, string>, projectRootPath: string): Promise<void>;
/**
 * 删除对话
 */
export declare function handleAIHistoryDeleteRequest(req: http.IncomingMessage, res: http.ServerResponse, corsHeaders: Record<string, string>, projectRootPath: string): Promise<void>;
