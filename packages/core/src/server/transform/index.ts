import { transformJsx } from './transform-jsx';
import { transformSvelte } from './transform-svelte';
import { transformVue } from './transform-vue';
import { EscapeTags } from '../../shared';

type FileType = 'vue' | 'jsx' | 'svelte' | unknown;

type TransformCodeParams = {
  content: string;
  filePath: string;
  fileType: FileType;
  escapeTags: EscapeTags;
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
  const { content, filePath, fileType, escapeTags = [] } = params;
  const finalEscapeTags = [
    ...CodeInspectorEscapeTags,
    ...escapeTags,
  ];
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
