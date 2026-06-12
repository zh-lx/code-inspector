import {
  normalizePath,
  getCodeWithWebComponent,
  isExcludedFile,
} from '@code-inspector/core';

export default function WebpackCodeInjectLoader(
  content: string,
  source: any,
  meta: any
): Promise<string> | undefined {
  this.cacheable && this.cacheable(true);
  const callback = this.async?.() || this.callback?.bind(this);
  const filePath = normalizePath(this.resourcePath); // 当前文件的绝对路径
  const options = this.query || {};

  const result = (async () => {
    if (isExcludedFile(filePath, options)) {
      return content;
    }

    // start server and inject client code to entry file
    return await getCodeWithWebComponent({
      options,
      file: filePath,
      code: content,
      record: options.record,
    });
  })().catch(() => content);

  if (callback) {
    result.then((code) => callback(null, code, source, meta));
    return undefined;
  }

  return result;
}
