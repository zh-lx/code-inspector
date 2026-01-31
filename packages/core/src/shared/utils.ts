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

/**
 * Determine if the current environment is development mode
 *
 * Priority: user-specified environment > system default environment
 *
 * @param userDev - User-specified development mode setting:
 *   - `true`: Force development mode
 *   - `false`: Force production mode
 *   - `function`: Dynamic function that returns boolean
 *   - `undefined`: Use system default
 * @param systemDev - System default development mode (e.g., from NODE_ENV)
 * @returns `true` if in development mode, `false` otherwise
 *
 * @example
 * ```typescript
 * // Force development mode
 * isDev(true, false) // Returns: true
 *
 * // Force production mode
 * isDev(false, true) // Returns: false
 *
 * // Use system default
 * isDev(undefined, true) // Returns: true
 *
 * // Dynamic function
 * isDev(() => process.env.NODE_ENV === 'development', false)
 * ```
 */
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

/**
 * Check if a file matches the given condition
 *
 * Supports multiple condition types for flexible file matching:
 * - String: Checks if file path contains the string
 * - RegExp: Tests file path against the regular expression
 * - Array: Recursively checks if file matches any condition in the array
 *
 * @param condition - The condition to match against:
 *   - `string`: File path must contain this string
 *   - `RegExp`: File path must match this pattern
 *   - `Array`: File path must match at least one condition
 * @param file - The file path to check
 * @returns `true` if the file matches the condition, `false` otherwise
 *
 * @example
 * ```typescript
 * // String matching
 * matchCondition('node_modules', '/path/to/node_modules/pkg') // Returns: true
 *
 * // RegExp matching
 * matchCondition(/\.test\.ts$/, 'file.test.ts') // Returns: true
 *
 * // Array matching (OR logic)
 * matchCondition(['src', /\.tsx$/], 'src/App.tsx') // Returns: true
 * ```
 */
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

/**
 * Get the mapped file path based on the provided mappings configuration
 *
 * This function resolves file paths by applying mapping rules, which is useful for:
 * - Resolving module aliases (e.g., '@/components' -> 'src/components')
 * - Mapping node_modules paths to local source paths
 * - Handling monorepo package paths
 *
 * @param file - The original file path to map
 * @param mappings - Path mapping configuration, can be either:
 *   - Object: `{ '@/': 'src/', '~': 'node_modules/' }`
 *   - Array: `[{ find: '@/', replacement: 'src/' }, { find: /^~/, replacement: 'node_modules/' }]`
 * @returns The mapped file path if a mapping is found and the file exists, otherwise returns the original path
 *
 * @example
 * ```typescript
 * // Object mapping
 * getMappingFilePath('@/components/Button.tsx', { '@/': 'src/' })
 * // Returns: 'src/components/Button.tsx' (if file exists)
 *
 * // Array mapping with RegExp
 * getMappingFilePath('~/lodash/index.js', [
 *   { find: /^~/, replacement: 'node_modules/' }
 * ])
 * // Returns: 'node_modules/lodash/index.js' (if file exists)
 * ```
 */
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

/**
 * Check if a file should be excluded from processing
 *
 * Determines if a file should be excluded based on exclude/include patterns.
 * Files in node_modules are always excluded unless explicitly included.
 *
 * Logic:
 * - If file matches exclude pattern AND NOT in include pattern → excluded
 * - If file matches include pattern → NOT excluded (even if in node_modules)
 * - node_modules is always in the exclude list by default
 *
 * @param file - The file path to check
 * @param options - Code inspector options containing exclude/include patterns
 * @returns `true` if the file should be excluded, `false` otherwise
 *
 * @example
 * ```typescript
 * const options = {
 *   exclude: [/\.test\.ts$/, 'dist'],
 *   include: ['src']
 * };
 *
 * isExcludedFile('src/App.test.ts', options) // Returns: true (matches exclude)
 * isExcludedFile('node_modules/pkg/index.js', options) // Returns: true (node_modules)
 * isExcludedFile('src/index.ts', options) // Returns: false (in include)
 * ```
 */
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

/**
 * Check if a file should be ignored based on special directives in comments
 * @param content - The file content to check
 * @param fileType - The type of file ('vue', 'jsx', 'svelte', or unknown)
 * @returns true if the file should be ignored, false otherwise
 */
export function isIgnoredFile({
  content,
  fileType,
}: {
  content: string;
  fileType: 'vue' | 'jsx' | 'svelte' | unknown;
}): boolean {
  if (!content) {
    return false;
  }
  const trimmed = content.trimStart();
  const directives = ['code-inspector-disable', 'code-inspector-ignore'];

  // Vue / Svelte - check HTML comments
  if (fileType === 'vue' || fileType === 'svelte') {
    if (trimmed.startsWith('<!--')) {
      const endIndex = trimmed.indexOf('-->');
      if (endIndex !== -1) {
        const body = trimmed.slice(0, endIndex + 3).toLowerCase();
        return directives.some((d) => body.includes(d));
      }
    }
    return false;
  }

  // Single line comment (// ...)
  const lineComment = trimmed.match(/^\/\/\s*([^\n]+)/);
  if (lineComment) {
    const body = lineComment[1].toLowerCase();
    return directives.some((d) => body.includes(d));
  }

  // Block comment (/* ... */)
  if (trimmed.startsWith('/*')) {
    const endIndex = trimmed.indexOf('*/');
    if (endIndex !== -1) {
      const body = trimmed.slice(0, endIndex + 2).toLowerCase();
      return directives.some((d) => body.includes(d));
    }
  }

  return false;
}
