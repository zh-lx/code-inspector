import fs from 'fs';
import { transformJsx } from './transform-jsx';
import { transformSvelte } from './transform-svelte';
import { transformVue } from './transform-vue';
import { EscapeTags, PathType } from '../../shared';
import { getRelativeOrAbsolutePath } from '../server';

type FileType = 'vue' | 'jsx' | 'svelte' | unknown;

type TransformCodeParams = {
  content: string;
  filePath: string;
  fileType: FileType;
  escapeTags: EscapeTags;
  pathType: PathType;
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

function isIgnoredFile({
  content,
  fileType,
}: {
  content: string;
  fileType: FileType;
}) {
  if (!content) {
    return false;
  }
  const trimmed = content.trimStart();
  const directives = ['code-inspector-disable', 'code-inspector-ignore'];

  // Vue / Svelte
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

  // single line comment
  const lineComment = trimmed.match(/^\/\/\s*([^\n]+)/);
  if (lineComment) {
    const body = lineComment[1].toLowerCase();
    return directives.some((d) => body.includes(d));
  }

  // block comment (contains /** */ multi-line)
  if (trimmed.startsWith('/*')) {
    const endIndex = trimmed.indexOf('*/');
    if (endIndex !== -1) {
      const body = trimmed.slice(0, endIndex + 2).toLowerCase();
      return directives.some((d) => body.includes(d));
    }
  }

  return false;
}

export function transformCode(params: TransformCodeParams) {
  let {
    content,
    filePath,
    fileType,
    escapeTags = [],
    pathType = 'relative',
  } = params;
  if (!fs.existsSync(filePath) || isIgnoredFile({ content, fileType })) {
    return content;
  }
  const finalEscapeTags = [...CodeInspectorEscapeTags, ...escapeTags];

  filePath = getRelativeOrAbsolutePath(filePath, pathType);

  try {
    if (fileType === 'vue') {
      return transformVue(content, filePath, finalEscapeTags);
    } else if (fileType === 'jsx') {
      return transformJsx(content, filePath, finalEscapeTags);
    } else if (fileType === 'svelte') {
      return transformSvelte(content, filePath, finalEscapeTags);
    } else {
      return content;
    }
  } catch (error) {
    return content;
  }
}
