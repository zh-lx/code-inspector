import { CodeOptions, Condition, EscapeTags } from './type';
export declare function getIP(ip: boolean | string): string;
export declare function fileURLToPath(fileURL: string): string;
export declare function isJsTypeFile(file: string): boolean;
export declare function getFilePathWithoutExt(filePath: string): string;
export declare function normalizePath(filepath: string): string;
export declare function isEscapeTags(escapeTags: EscapeTags, tag: string): boolean;
export declare function getDependenciesMap(): any;
export declare function getDependencies(): string[];
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
export declare function isDev(userDev: boolean | BooleanFunction | undefined, systemDev: boolean): boolean;
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
export declare function matchCondition(condition: Condition, file: string): boolean;
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
export declare function getMappingFilePath(file: string, mappings?: Record<string, string> | Array<{
    find: string | RegExp;
    replacement: string;
}>): string;
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
export declare function isExcludedFile(file: string, options: CodeOptions): boolean;
export declare function hasWritePermission(filePath: string): boolean;
/**
 * Check if a file should be ignored based on special directives in comments
 * @param content - The file content to check
 * @param fileType - The type of file ('vue', 'jsx', 'svelte', or unknown)
 * @returns true if the file should be ignored, false otherwise
 */
export declare function isIgnoredFile({ content, fileType, }: {
    content: string;
    fileType: 'vue' | 'jsx' | 'svelte' | unknown;
}): boolean;
export {};
