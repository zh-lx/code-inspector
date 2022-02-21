import path from 'path';
import fs from 'fs';
import {
  InjectPathName,
  InjectLineName,
  InjectColumnName,
  InjectCoverName,
  InjectNodeName,
  InjectCoverInfoName,
} from './constant';
const jsFile = path.resolve(__dirname, './inject-code-template.js'); // 编译后会在lib文件夹中
const styleFile = path.resolve(__dirname, './cover.css');
const jsCode = fs.readFileSync(jsFile, 'utf-8');
const styleCode = fs.readFileSync(styleFile, 'utf-8');

const injectCode = (port) => {
  const code = jsCode
    .replace(/__FILE__/g, InjectPathName)
    .replace(/__LINE__/g, InjectLineName)
    .replace(/__COLUMN__/g, InjectColumnName)
    .replace(/__NODE__/g, InjectNodeName)
    .replace(/__COVER__/g, InjectCoverName)
    .replace(/__COVERINFO__/g, InjectCoverInfoName)
    .replace(/__PORT__/g, port);

  return `<div class="_vc-cover" id="_vc-cover"><div id="_vc-cover-info"></div></div><div id="_vc-control-suspension" draggable="true">V</div>\n<style>${styleCode}</style>\n<script>\n${code}\n</script>`;
};

export = injectCode;
