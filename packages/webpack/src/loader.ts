import {
  transformCode,
  normalizePath,
  parseSFC,
  isJsTypeFile,
  getMappingFilePath,
  isExcludedFile,
} from '@code-inspector/core';

const jsxParamList = ['isJsx', 'isTsx', 'lang.jsx', 'lang.tsx'];

async function transformWebpackCodeInspectorContent(
  loaderContext: any,
  content: string,
) {
  let filePath = normalizePath(loaderContext.resourcePath); // 当前文件的绝对路径
  let params = new URLSearchParams(loaderContext.resource.split('?')?.[1] || '');
  const options = loaderContext.query || {};
  let { escapeTags = [], mappings } = options;

  if (isExcludedFile(filePath, options)) {
    return content;
  }

  filePath = getMappingFilePath(filePath, mappings);

  // jsx 语法
  const isJSX =
    isJsTypeFile(filePath) ||
    (filePath.endsWith('.vue') &&
      jsxParamList.some((param) => params.get(param) !== null));
  if (isJSX) {
    return await transformCode({
      content,
      filePath,
      fileType: 'jsx',
      escapeTags,
      pathType: options.pathType,
      mdx: options.mdx,
    });
  }

  // vue jsx
  const isJsxWithScript =
    filePath.endsWith('.vue') &&
    (params.get('lang') === 'tsx' || params.get('lang') === 'jsx');
  if (isJsxWithScript) {
    const { descriptor } = parseSFC(content, {
      sourceMap: false,
    });
    // 处理 <script> 标签内容
    // 注意：.vue 允许同时存在 <script> 和 <script setup>
    const scripts = [
      descriptor.script?.content,
      descriptor.scriptSetup?.content,
    ];
    for (const script of scripts) {
      if (!script) continue;
      const newScript = await transformCode({
        content: script,
        filePath,
        fileType: 'jsx',
        escapeTags,
        pathType: options.pathType,
        mdx: options.mdx,
      });
      content = content.replace(script, () => newScript);
    }
    return content;
  }

  // vue
  const isVue =
    filePath.endsWith('.vue') &&
    params.get('type') !== 'style' &&
    params.get('type') !== 'script' &&
    params.get('raw') === null;
  const isHtmlVue =
    filePath.endsWith('.html') &&
    params.get('type') === 'template' &&
    params.has('vue');
  if (options.vueLoader === 'internal' && (isVue || isHtmlVue)) {
    return content;
  }
  if (isVue || isHtmlVue) {
    return await transformCode({
      content,
      filePath,
      fileType: 'vue',
      escapeTags,
      pathType: options.pathType,
      mdx: options.mdx,
    });
  }

  // svelte
  const isSvelte = filePath.endsWith('.svelte');
  if (isSvelte) {
    return await transformCode({
      content,
      filePath,
      fileType: 'svelte',
      escapeTags,
      pathType: options.pathType,
      mdx: options.mdx,
    });
  }

  return content;
}

export default function WebpackCodeInspectorLoader(
  content: string,
  source: any,
  meta: any,
): Promise<string> | undefined {
  this.cacheable && this.cacheable(true);
  const callback = this.async?.();
  const result = transformWebpackCodeInspectorContent(this, content).catch(
    () => content,
  );

  if (callback) {
    result.then((code) => callback(null, code, source, meta));
    return undefined;
  }

  return result;
}
