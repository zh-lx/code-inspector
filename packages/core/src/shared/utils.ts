import path from 'path';
import { JsFileExtList } from "./constant";

// 将 import.meta.url 转换为 __dirname: 兼容 mac linux 和 windows
export function fileURLToPath(fileURL: string) {
  let filePath = fileURL;
  if (process.platform === 'win32') {
    filePath = filePath.replace(/^file:\/\/\//, '');
    filePath = decodeURIComponent(filePath);
    filePath = filePath.replace(/\//g, '\\');
  } else {
    filePath = filePath.replace(/^file:\/\//, '');
    filePath = decodeURIComponent(filePath);
  }
  return filePath;
}

// 是否为 JS 类型的文件
export function isJsTypeFile(file: string) {
  return JsFileExtList.some((ext) =>
    file.endsWith(ext)
  );
}

// 检测是否为 nextjs 中的 client 文件
export function isNextClientFile(code: string) {
  return (
    code.trim().startsWith(`"use client"`) ||
    code.trim().startsWith(`'use client'`) ||
    code.trim().startsWith(`"use client;"`) ||
    code.trim().startsWith(`'use client;'`)
  );
}

// 检测是否为 useEffect 文件
export function isUseEffectFile(code: string) {
  return code.includes(`useEffect(`);
}

// 获取不带文件后缀名的文件路径
export function getFilenameWithoutExt(filePath: string) {
  while (path.parse(filePath).ext) {
    filePath = path.parse(filePath).name;
  }
  return filePath;
}
