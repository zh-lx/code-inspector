import {
  normalizePath,
  getCodeWithWebComponent,
  matchCondition,
} from '@code-inspector/core';

export default async function WebpackCodeInjectLoader(
  content: string,
  source: any,
  meta: any
) {
  this.async();
  this.cacheable && this.cacheable(true);
  const filePath = normalizePath(this.resourcePath); // 当前文件的绝对路径
  const options = this.query;
  let { exclude = [], include } = options || {};

  if (!Array.isArray(exclude)) {
    exclude = [exclude];
  }
  const isExcluded = matchCondition([...exclude, /\/node_modules\//], filePath);
  const isIncluded = matchCondition(include || [], filePath);

  if (isExcluded && !isIncluded) {
    this.callback(null, content, source, meta);
    return;
  }

  // start server and inject client code to entry file
  content = await getCodeWithWebComponent({
    options,
    file: filePath,
    code: content,
    record: options.record,
  });

  this.callback(null, content, source, meta);
}
