/**
 * AI 对话历史持久化 - 服务端文件存储
 * 将对话历史保存到 node_modules/.code-inspector/ 目录
 */
import fs from 'fs';
import path from 'path';
import http from 'http';

const HISTORY_DIR_NAME = path.join('node_modules', '.code-inspector');
const INDEX_FILE = 'history-index.json';

/**
 * 校验 id 不包含路径穿越字符，resolve 后必须仍在 dir 内
 */
function isSafeId(id: string, dir: string): boolean {
  if (!id || /[\/\\]/.test(id) || id === '.' || id === '..') {
    return false;
  }
  const resolved = path.resolve(dir, `${id}.json`);
  return resolved.startsWith(dir + path.sep);
}

export interface HistoryEntry {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  provider: string | null;
  messageCount: number;
}

function getHistoryDir(projectRootPath: string): string {
  const root = projectRootPath || process.cwd();
  return path.join(root, HISTORY_DIR_NAME);
}

function ensureHistoryDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readIndex(dir: string): Record<string, HistoryEntry> {
  const indexPath = path.join(dir, INDEX_FILE);
  try {
    if (!fs.existsSync(indexPath)) return {};
    return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch {
    return {};
  }
}

function writeIndex(dir: string, index: Record<string, HistoryEntry>): void {
  const indexPath = path.join(dir, INDEX_FILE);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}

function cleanupExpired(dir: string, expireDays: number): void {
  if (expireDays <= 0) return;
  const index = readIndex(dir);
  const now = Date.now();
  const maxAge = expireDays * 86400000;
  let changed = false;

  const ids = Object.keys(index);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const entry = index[id];
    if (entry.createdAt + maxAge < now) {
      if (isSafeId(id, dir)) {
        const filePath = path.join(dir, `${id}.json`);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch {
          // 静默
        }
      }
      delete index[id];
      changed = true;
    }
  }

  if (changed) {
    writeIndex(dir, index);
  }
}

function extractTitle(messages: any[]): string {
  if (!Array.isArray(messages)) return '';
  let title = '';
  for (let i = 0; i < messages.length; i++) {
    if (messages[i]?.role === 'user' && typeof messages[i]?.content === 'string') {
      const text = messages[i].content.trim();
      title = text.length > 80 ? text.slice(0, 80) + '...' : text;
    }
  }
  return title;
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }
  return body;
}

/**
 * 获取对话历史列表
 */
export async function handleAIHistoryListRequest(
  res: http.ServerResponse,
  corsHeaders: Record<string, string>,
  projectRootPath: string,
  expireDays: number,
): Promise<void> {
  const dir = getHistoryDir(projectRootPath);

  try {
    ensureHistoryDir(dir);
    if (expireDays > 0) {
      cleanupExpired(dir, expireDays);
    }
    const index = readIndex(dir);
    // 按 updatedAt 降序排列
    const conversations = Object.keys(index)
      .map((id) => ({ ...index[id], id }))
      .sort((a, b) => b.updatedAt - a.updatedAt);

    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ conversations }));
  } catch {
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ conversations: [] }));
  }
}

/**
 * 保存对话
 */
export async function handleAIHistorySaveRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  corsHeaders: Record<string, string>,
  projectRootPath: string,
): Promise<void> {
  const body = await readBody(req);
  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const id = parsed.id ? String(parsed.id) : String(Date.now());
  const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
  const dir = getHistoryDir(projectRootPath);

  if (!isSafeId(id, dir)) {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid_id' }));
    return;
  }

  try {
    ensureHistoryDir(dir);

    // 写入对话文件
    const conversationData = {
      messages,
      context: parsed.context ?? null,
      sessionId: parsed.sessionId ?? null,
      provider: parsed.provider ?? null,
      model: parsed.model ?? '',
      revertedToolIds: Array.isArray(parsed.revertedToolIds) ? parsed.revertedToolIds : [],
    };
    fs.writeFileSync(
      path.join(dir, `${id}.json`),
      JSON.stringify(conversationData, null, 2),
      'utf-8',
    );

    // 更新 index
    const index = readIndex(dir);
    const now = Date.now();
    index[id] = {
      id,
      title: extractTitle(messages),
      createdAt: index[id]?.createdAt || now,
      updatedAt: now,
      provider: parsed.provider ?? null,
      messageCount: messages.length,
    };
    writeIndex(dir, index);

    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id, success: true }));
  } catch {
    res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'write_error' }));
  }
}

/**
 * 加载对话
 */
export async function handleAIHistoryLoadRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  corsHeaders: Record<string, string>,
  projectRootPath: string,
): Promise<void> {
  const body = await readBody(req);
  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const id = String(parsed.id || '');
  if (!id) {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'missing_id' }));
    return;
  }

  const dir = getHistoryDir(projectRootPath);

  if (!isSafeId(id, dir)) {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid_id' }));
    return;
  }

  const filePath = path.join(dir, `${id}.json`);

  try {
    if (!fs.existsSync(filePath)) {
      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not_found' }));
      return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch {
    res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'read_error' }));
  }
}

/**
 * 删除对话
 */
export async function handleAIHistoryDeleteRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  corsHeaders: Record<string, string>,
  projectRootPath: string,
): Promise<void> {
  const body = await readBody(req);
  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const id = String(parsed.id || '');
  if (!id) {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'missing_id' }));
    return;
  }

  const dir = getHistoryDir(projectRootPath);

  if (!isSafeId(id, dir)) {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid_id' }));
    return;
  }

  try {
    // 删除对话文件
    const filePath = path.join(dir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 更新 index
    const index = readIndex(dir);
    delete index[id];
    writeIndex(dir, index);

    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch {
    res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'delete_error' }));
  }
}
