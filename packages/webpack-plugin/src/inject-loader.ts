import { normalizePath, getServedCode } from 'code-inspector-core';

export default async function WebpackCodeInjectLoader(
  content: string,
  source: any,
  meta: any
) {
  this.async();
  this.cacheable && this.cacheable(true);
  const filePath = normalizePath(this.resourcePath); // 当前文件的绝对路径
  const options = this.query;

  // start server and inject client code to entry file
  content = await getServedCode(options, filePath, content, options.record);

  this.callback(null, content, source, meta);
}
