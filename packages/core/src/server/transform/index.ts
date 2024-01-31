import { transformJsx } from './transform-jsx';
import { transformSvelte } from './transform-svelte';
import { transformVue } from './transform-vue';

type FileType = 'vue' | 'jsx' | 'svelte' | unknown;

type TransformCodeParams = {
  content: string;
  filePath: string;
  fileType: FileType;
};

export function transformCode(params: TransformCodeParams) {
  const { content, filePath, fileType } = params;
  try {
    if (fileType === 'vue') {
      return transformVue(content, filePath);
    } else if (fileType === 'jsx') {
      return transformJsx(content, filePath);
    } else if (fileType === 'svelte') {
      return transformSvelte(content, filePath);
    } else {
      return content;
    }
  } catch (error) {
    return content;
  }
}
