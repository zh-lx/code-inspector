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

export function transformCode(params: TransformCodeParams) {
  let { content, filePath, fileType, escapeTags = [], pathType = 'relative' } = params;
  const finalEscapeTags = [
    ...CodeInspectorEscapeTags,
    ...escapeTags,
  ];
  
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
