import { enhanceJsx } from './enhance-jsx';
import { enhanceSvelte } from './enhance-svelte';
import { enhanceVue } from './enhance-vue';

type FileType = 'vue' | 'jsx' | 'svelte' | unknown;

type EnhanceCodeParams = {
  content: string;
  filePath: string;
  fileType: FileType;
};

export function enhanceCode(params: EnhanceCodeParams) {
  const { content, filePath, fileType } = params;
  try {
    if (fileType === 'vue') {
      return enhanceVue(content, filePath);
    } else if (fileType === 'jsx') {
      return enhanceJsx(content, filePath);
    } else if (fileType === 'svelte') {
      return enhanceSvelte(content, filePath);
    } else {
      return content;
    }
  } catch (error) {
    return content;
  }
}
