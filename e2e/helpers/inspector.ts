import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { PATH_NAME, repoRoot } from '../demos.config';

export interface InspPath {
  raw: string;
  path: string;
  line: number;
  column: number;
  tag: string;
}

/**
 * 收集页面中所有元素的 data-insp-path 值。
 * 注意：运行时 getHidePathAttrCode() 会把 attribute 搬到 JS 属性并 removeAttribute，
 * 因此必须同时兼顾 attribute 与 JS 属性两种来源。
 */
export async function collectInspPaths(page: Page): Promise<string[]> {
  try {
    return await page.evaluate((attr) => {
      const out: string[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const v =
          el.getAttribute(attr) || (el as unknown as Record<string, unknown>)[attr];
        if (typeof v === 'string' && v) out.push(v);
      });
      return out;
    }, PATH_NAME);
  } catch (err) {
    // 如果执行上下文被销毁（页面导航/刷新），返回空数组让 poll 重试
    if (err instanceof Error && err.message.includes('Execution context was destroyed')) {
      return [];
    }
    throw err;
  }
}

/** 解析 `path:line:column:tag`（posix 绝对路径不含其它冒号，从右侧锚定 line/col/tag）。 */
export function parseInspPath(raw: string): InspPath | null {
  const m = raw.match(/^(.*):(\d+):(\d+):([^:]+)$/);
  if (!m) return null;
  return {
    raw,
    path: m[1],
    line: Number(m[2]),
    column: Number(m[3]),
    tag: m[4],
  };
}

/** 校验注入的源码定位是否合法：路径（绝对或相对仓库根）指向真实存在的源文件、行列为正整数。 */
export function validateInspPath(p: InspPath): string[] {
  const errors: string[] = [];
  const abs = path.isAbsolute(p.path)
    ? path.normalize(p.path)
    : path.resolve(repoRoot, p.path);
  if (!abs.startsWith(repoRoot)) {
    errors.push(`路径不在仓库内: ${p.path}`);
  }
  if (!fs.existsSync(abs)) errors.push(`源文件不存在: ${p.path}`);
  if (!(p.line > 0)) errors.push(`行号非正: ${p.line}`);
  if (!(p.column > 0)) errors.push(`列号非正: ${p.column}`);
  return errors;
}
