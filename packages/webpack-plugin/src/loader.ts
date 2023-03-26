import { enhanceVueCode, normalizePath } from 'code-inspector-core';
import path from 'path';

/**
 * @description inject line、column and path to VNode when webpack compiling .vue file
 * @type webpack.loader.Loader
 */
function WebpackCodeInspectorLoader(
  this: any,
  content: string,
  map: string,
  cb: any
) {
  const completePath = normalizePath(this.resourcePath); // 当前文件的绝对路径
  const root = normalizePath(this.rootContext ?? this.options.context ?? '');
  const filePath = normalizePath(path.relative(root, completePath));
  let params = new URLSearchParams(this.resource);

  // const isVueJsx =
  //   completePath.endsWith('.jsx') || completePath.endsWith('.tsx');

  const isVue =
    completePath.endsWith('.vue') &&
    params.get('type') !== 'style' &&
    params.get('raw') === null;

  // if (isVueJsx) {
  //   content = enhanceVueCode(content, filePath, 'vue-jsx');
  // } else if (isVue) {
  //   content = enhanceVueCode(content, filePath, 'vue');
  // }

  if (isVue) {
    content = enhanceVueCode(content, filePath, 'vue');
  }

  return content;
}

export = WebpackCodeInspectorLoader;
