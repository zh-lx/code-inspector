import fs from 'fs';
import { transformAstro } from './transform-astro';
import { transformJsx } from './transform-jsx';
import { transformMdx } from './transform-mdx';
import { transformSvelte } from './transform-svelte';
import { transformVue } from './transform-vue';
export { createVueInspectorNodeTransform } from './vue-node-transform';
import { EscapeTags, PathType, isIgnoredFile } from '../../shared';
import { getRelativeOrAbsolutePath } from '../server';

type FileType = 'vue' | 'jsx' | 'svelte' | 'astro' | 'mdx' | unknown;

type TransformCodeParams = {
  content: string;
  filePath: string;
  fileType: FileType;
  escapeTags: EscapeTags;
  pathType: PathType;
  mdx?: boolean;
};

const CodeInspectorEscapeTags = [
  'style',
  'script',
  'template',
  'transition',
  'keepalive',
  'keep-alive',
  'component',
  'slot',
  'teleport',
  'transition-group',
  'transitiongroup',
  'suspense',
  'fragment',
];

export async function transformCode(params: TransformCodeParams) {
  let {
    content,
    filePath,
    fileType,
    escapeTags = [],
    pathType = 'relative',
    mdx = false,
  } = params;
  if (!fs.existsSync(filePath) || isIgnoredFile({ content, fileType })) {
    return content;
  }
  const finalEscapeTags = [...CodeInspectorEscapeTags, ...escapeTags];
  const resolveFilePath = filePath;

  filePath = getRelativeOrAbsolutePath(filePath, pathType);

  try {
    if (fileType === 'vue') {
      return await transformVue(content, filePath, finalEscapeTags);
    } else if (fileType === 'jsx') {
      return transformJsx(content, filePath, finalEscapeTags);
    } else if (fileType === 'svelte') {
      return transformSvelte(content, filePath, finalEscapeTags);
    } else if (fileType === 'astro') {
      return transformAstro(content, filePath, finalEscapeTags, resolveFilePath);
    } else if (fileType === 'mdx') {
      if (!mdx) {
        return content;
      }

      return await transformMdx(
        content,
        filePath,
        finalEscapeTags,
        resolveFilePath,
      );
    } else {
      return content;
    }
  } catch (error) {
    return content;
  }
}
