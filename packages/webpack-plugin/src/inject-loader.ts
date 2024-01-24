import { normalizePath, getServedCode } from 'code-inspector-core';

export default async function WebpackCodeInjectLoader(
  content: string,
  source: any,
  meta: any
) {
  this.async();
  const filePath = normalizePath(this.resourcePath); // 当前文件的绝对路径
  const options = this.query;

  // start server and inject client code to entry file
  const originContent = content;
  content = await getServedCode(options, filePath, content, options.record);
  this.cacheable && this.cacheable(options?.forceInjectCache ?? originContent === content);

  this.callback(null, content, source, meta);
}
