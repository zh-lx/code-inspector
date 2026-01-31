import path from 'path';
import os from 'os';
import fs from 'fs';
import { JsFileExtList } from './constant';
import { CodeOptions, Condition, EscapeTags } from './type';

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
          (alias.family === 'IPv4' ||
            // @ts-expect-error Node 18.0 - 18.3 returns number
            alias.family === 4) &&
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

// 获取不带文件后缀名的文件路径
export function getFilePathWithoutExt(filePath: string) {
  return filePath.slice(0, filePath.lastIndexOf('.'));
}

export function normalizePath(filepath: string) {
  let normalizedPath = path.normalize(filepath);

  // Convert Windows path separators to Mac path separators
  if (process.platform === 'win32') {
    normalizedPath = normalizedPath.replace(/\\/g, '/');
  }

  return normalizedPath;
}

export function isEscapeTags(escapeTags: EscapeTags, tag: string) {
  return escapeTags.some((escapeTag) => {
    if (typeof escapeTag === 'string') {
      return escapeTag.toLowerCase() === tag.toLowerCase();
    } else {
      return escapeTag.test(tag) || escapeTag.test(tag.toLowerCase());
    }
  });
}

export function getDependenciesMap() {
  const packageJsonPath = path.resolve(process.cwd(), './package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf-8') || '{}'
    );
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };
    return dependencies;
  }
  return {};
}

export function getDependencies() {
  return Object.keys(getDependenciesMap());
}

type BooleanFunction = () => boolean;
// 判断当前是否为 development 环境; 优先判定用户指定的环境；其次判断系统默认的环境
export function isDev(
  userDev: boolean | BooleanFunction | undefined,
  systemDev: boolean
) {
  let dev: boolean | undefined;
  if (typeof userDev === 'function') {
    dev = userDev();
  } else {
    dev = userDev;
  }
  if (dev === false) {
    return false;
  }
  return dev || systemDev;
}

export function matchCondition(condition: Condition, file: string) {
  if (typeof condition === 'string') {
    return file.includes(condition);
  } else if (condition instanceof RegExp) {
    return condition.test(file);
  } else if (condition.some((item) => matchCondition(item, file))) {
    return true;
  }
  return false;
}

export function getMappingFilePath(
  file: string,
  mappings?:
    | Record<string, string>
    | Array<{ find: string | RegExp; replacement: string }>
): string {
  if (!mappings) {
    return file;
  }
  if (Array.isArray(mappings)) {
    for (let i = 0; i < mappings.length; i++) {
      let find = mappings[i].find;
      let replacement = mappings[i].replacement;
      if (typeof find === 'string') {
        const realFilePath = replaceFileWithString(file, find, replacement);
        if (realFilePath) {
          return realFilePath;
        }
      } else if (find instanceof RegExp) {
        const realFilePath = replaceFileWithRegExp(file, find, replacement);
        if (realFilePath) {
          return realFilePath;
        }
      }
    }
  } else {
    for (let find in mappings) {
      const replacement = mappings[find];
      const realFilePath = replaceFileWithString(file, find, replacement);
      if (realFilePath) {
        return realFilePath;
      }
    }
  }
  return file;
}

function replaceFileWithString(
  file: string,
  find: string,
  replacement: string
): string | null {
  find = handlePathWithSlash(find);
  replacement = handlePathWithSlash(replacement);
  if (file.startsWith(find)) {
    const realFilePath = file.replace(find, replacement);
    if (fs.existsSync(realFilePath)) {
      return realFilePath;
    }
  } else {
    find = `/node_modules/${find}`;
    const index = file.indexOf(find);
    if (index !== -1) {
      const realFilePath = replacement + file.slice(index + find.length);
      if (fs.existsSync(realFilePath)) {
        return realFilePath;
      }
    }
  }
  return null;
}

function replaceFileWithRegExp(
  file: string,
  find: RegExp,
  replacement: string
): string | null {
  const match = find.exec(file);
  if (match) {
    replacement = handlePathWithSlash(replacement);
    const index = match.index;
    const content = match[0];
    let suffix = file.slice(index + content.length);
    if (suffix.startsWith('/')) {
      suffix = suffix.slice(1);
    }
    const realFilePath = replacement + suffix;
    if (fs.existsSync(realFilePath)) {
      return realFilePath;
    }
  }
  return null;
}

function handlePathWithSlash(path: string) {
  return path.endsWith('/') ? path : `${path}/`;
}

export function isExcludedFile(file: string, options: CodeOptions) {
  let exclude = options.exclude || [];
  if (!Array.isArray(exclude)) {
    exclude = [exclude];
  }
  const isExcluded = matchCondition([...exclude, /\/node_modules\//], file);
  const isIncluded = matchCondition(options.include || [], file);

  if (isExcluded && !isIncluded) {
    return true;
  }

  return false;
}

// check if the file or directory has write permission
export function hasWritePermission(filePath: string): boolean {
  try {
    // if the file does not exist, check the write permission of the parent directory
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      if (fs.existsSync(dir)) {
        fs.accessSync(dir, fs.constants.W_OK);
        return true;
      }
      return false;
    }
    // if the file exists, check the write permission of the file
    fs.accessSync(filePath, fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}
