import {
  normalizePath,
  getServedCode,
} from 'code-inspector-core';

export default async function WebpackCodeInjectLoader(
  content: string,
  source: any,
  meta: any
) {
  this.async();
  this.cacheable && this.cacheable(false);
  const completePath = normalizePath(this.resourcePath); // 当前文件的绝对路径
  const options = this.query;
  const rootPath = normalizePath(
    this.rootContext ?? this.options.context ?? ''
  );

  // start server and inject client code to entry file
  content = await getServedCode(options, rootPath, completePath, content, options.record);

  this.callback(null, content, source, meta)
}
