"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var constant_1 = require("./constant");
var jsFile = path_1.default.resolve(__dirname, './inject-code-template.js'); // 编译后会在lib文件夹中
var styleFile = path_1.default.resolve(__dirname, './cover.css');
var jsCode = fs_1.default.readFileSync(jsFile, 'utf-8');
var styleCode = fs_1.default.readFileSync(styleFile, 'utf-8');
var injectCode = function (port) {
    var code = jsCode
        .replace(/__FILE__/g, constant_1.InjectPathName)
        .replace(/__LINE__/g, constant_1.InjectLineName)
        .replace(/__COLUMN__/g, constant_1.InjectColumnName)
        .replace(/__NODE__/g, constant_1.InjectNodeName)
        .replace(/__COVER__/g, constant_1.InjectCoverName)
        .replace(/__COVERINFO__/g, constant_1.InjectCoverInfoName)
        .replace(/__PORT__/g, port);
    return "<div class=\"_vc-cover\" id=\"_vc-cover\"><div id=\"_vc-cover-info\"></div></div><div id=\"_vc-control-suspension\" draggable=\"true\">V</div>\n<style>" + styleCode + "</style>\n<script>\n" + code + "\n</script>";
};
module.exports = injectCode;
//# sourceMappingURL=get-inject-code.js.map