import path from 'path';
import os from 'os';
import { FormatColumn, FormatFile, FormatLine, JsFileExtList } from './constant';
import { EscapeTags } from './type';

//获取本机ip地址
export function getIP(ip: boolean | string) {
  if (typeof ip === 'string' && ip !== '') {
    return ip;
  } else if (ip === true) {
    let interfaces = os.networkInterfaces();
    for (let devName in interfaces) {
      let iface = interfaces[devName] as os.NetworkInterfaceInfo[];
      for (let i = 0; i < iface.length; i++) {
        let alias = iface[i];
        if (
          alias.family === 'IPv4' &&
          alias.address !== '127.0.0.1' &&
          !alias.internal
        ) {
          return alias.address;
        }
      }
    }
  }
  return 'localhost';
}

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
  return JsFileExtList.some((ext) => file.endsWith(ext));
}

// 检测是否为 nextjs 中的 client 文件
export function isNextJsEntry(code: string) {
  return (
    code.trim().startsWith(`"use client"`) ||
    code.trim().startsWith(`'use client'`) ||
    code.trim().startsWith(`"use client;"`) ||
    code.trim().startsWith(`'use client;'`)
  );
}

// 检测是否为 useEffect 文件
export function isSsrEntry(code: string) {
  return code.includes(`useEffect(`);
}

// 获取不带文件后缀名的文件路径
export function getFilenameWithoutExt(filePath: string) {
  while (path.parse(filePath).ext) {
    filePath = path.parse(filePath).name;
  }
  return filePath;
}

export function normalizePath(filepath: string) {
  let normalizedPath = path.normalize(filepath);

  // Convert Windows path separators to Mac path separators
  if (process.platform === 'win32') {
    normalizedPath = normalizedPath.replace(/\\/g, '/');
  }

  return normalizedPath;
}

export function formatOpenPath(
  file: string,
  line: string,
  column: string,
  format: string | string[] | boolean
) {
  let path = `${file}:${line}:${column}`;
  if (typeof format === 'string') {
    path = format
      .replace(FormatFile, file)
      .replace(FormatLine, line)
      .replace(FormatColumn, column);
  } else if (format instanceof Array) {
    return format.map((item) => {
      return item
      .replace(FormatFile, file)
      .replace(FormatLine, line)
      .replace(FormatColumn, column);
    });
  }
  return [path];
}

export function isEscapeTags(escapeTags: EscapeTags, tag: string) {
  return escapeTags.some(escapeTag => {
    if (typeof escapeTag === 'string') {
      return escapeTag.toLowerCase() === tag.toLowerCase();
    } else {
      return escapeTag.test(tag) || escapeTag.test(tag.toLowerCase());
    }
  }) 
}