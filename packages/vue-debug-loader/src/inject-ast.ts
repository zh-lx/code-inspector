import { ElementNode } from '@vue/compiler-core';
import {
  InjectColumnName,
  InjectLineName,
  InjectPathName,
  InjectNodeName,
} from './constant';

export function getInjectContent(
  ast: ElementNode,
  source: string,
  filePath: string
) {
  // type为1是为标签节点
  if (ast?.type === 1) {
    // 递归处理子节点
    if (ast.children && ast.children.length) {
      // 从最后一个子节点开始处理，防止同一行多节点影响前面节点的代码位置
      for (let i = ast.children.length - 1; i >= 0; i--) {
        const node = ast.children[i] as ElementNode;
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
      ` ${InjectLineName}="${line}" ${InjectColumnName}="${column}" ${InjectPathName}="${filePath}" ${InjectNodeName}="${nodeName}"` +
      targetLine.slice(columnToInject);
    codeLines[line - 1] = newLine; // 替换注入后的内容
    source = codeLines.join('\n');
  }
  return source;
}
