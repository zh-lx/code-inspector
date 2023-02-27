import { parse } from '@vue/compiler-sfc';
import { ColumnName, LineName, PathName, NodeName } from '../shared/constant';

function getInjectContent(ast: any, source: string, filePath: string) {
  if (!ast) {
    return source;
  }
  // type为1是为标签节点
  if (ast?.type === 1) {
    // 递归处理子节点
    if (ast.children && ast.children.length) {
      // 从最后一个子节点开始处理，防止同一行多节点影响前面节点的代码位置
      for (let i = ast.children.length - 1; i >= 0; i--) {
        const node = ast.children[i] as any;
        source = getInjectContent(node, source, filePath);
      }
    }
    const codeLines = source.split('\n'); // 把行以\n划分方便注入
    const line = ast.loc.start.line; // 当前节点起始行
    const column = ast.loc.start.column; // 当前节点起始列
    const columnToInject = column + ast.tag.length; // 要注入信息的列(标签名后空一格)
    const targetLine = codeLines[line - 1]; // 要注入信息的行
    const nodeName = ast.tag;
    const newLine =
      targetLine.slice(0, columnToInject) +
      ` ${LineName}="${line}" ${ColumnName}="${column}" ${PathName}="${filePath}" ${NodeName}="${nodeName}"` +
      targetLine.slice(columnToInject);
    codeLines[line - 1] = newLine; // 替换注入后的内容
    source = codeLines.join('\n');
  }
  return source;
}

export function getEnhanceContent(content: string, filePath: string) {
  const vueParserContent = parse(content); // vue文件parse后的内容
  const domAst = vueParserContent.descriptor.template?.ast; // template开始的dom ast结构
  const templateSource = domAst?.loc?.source || ''; // template部分的原字符串
  const newTemplateSource = getInjectContent(domAst, templateSource, filePath); // 注入后的template部分字符串
  const newContent = content.replace(templateSource, newTemplateSource);
  return newContent;
}
