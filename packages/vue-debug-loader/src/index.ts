import { parse } from '@vue/compiler-sfc';
import { LoaderContext } from 'webpack';
import { getInjectContent } from './inject-ast';

/**
 * @description inject line、column and path to VNode when webpack compiling .vue file
 * @type webpack.loader.Loader
 */
function TrackCodeLoader(this: LoaderContext<any>, content: string) {
  const filePath = this.resourcePath; // 当前文件的绝对路径
  let params = new URLSearchParams(this.resource);
  if (params.get('type') === 'template') {
    const vueParserContent = parse(content); // vue文件parse后的内容
    const domAst = vueParserContent.descriptor.template.ast; // template开始的dom ast结构
    const templateSource = domAst.loc.source; // template部分的原字符串
    const newTemplateSource = getInjectContent(
      domAst,
      templateSource,
      filePath
    ); // 注入后的template部分字符串
    const newContent = content.replace(templateSource, newTemplateSource);
    return newContent;
  } else {
    return content;
  }
}

export = TrackCodeLoader;
