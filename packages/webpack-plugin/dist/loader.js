"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var code_inspector_core_1 = require("code-inspector-core");
var path_1 = __importDefault(require("path"));
// import { parse } from '@vue/compiler-sfc';
/**
 * @description inject line、column and path to VNode when webpack compiling .vue file
 * @type webpack.loader.Loader
 */
function WebpackCodeInspectorLoader(content, map, cb) {
    var _a, _b;
    var completePath = (0, code_inspector_core_1.normalizePath)(this.resourcePath); // 当前文件的绝对路径
    var root = (0, code_inspector_core_1.normalizePath)((_b = (_a = this.rootContext) !== null && _a !== void 0 ? _a : this.options.context) !== null && _b !== void 0 ? _b : '');
    var filePath = (0, code_inspector_core_1.normalizePath)(path_1.default.relative(root, completePath));
    var params = new URLSearchParams(this.resource);
    var isVueJsx = completePath.endsWith('.jsx') ||
        completePath.endsWith('.tsx') ||
        (completePath.endsWith('.vue') &&
            (params.get('isJsx') !== null || params.get('lang.tsx') !== null));
    var isVueJsxWithScript = completePath.endsWith('.vue') &&
        (params.get('lang') === 'tsx' || params.get('lang') === 'jsx');
    var isVue = completePath.endsWith('.vue') &&
        params.get('type') !== 'style' &&
        params.get('type') !== 'script' &&
        params.get('raw') === null;
    if (isVueJsx) {
        content = (0, code_inspector_core_1.enhanceVueCode)(content, filePath, 'vue-jsx');
    }
    else if (isVueJsxWithScript) {
        var descriptor = (0, code_inspector_core_1.parseSFC)(content, {
            sourceMap: false,
        }).descriptor;
        // 提取<script>标签内容
        var scriptContent = descriptor.script.content;
        var _scriptContent = (0, code_inspector_core_1.enhanceVueCode)(scriptContent, filePath, 'vue-jsx');
        content = content.replace(scriptContent, _scriptContent);
    }
    else if (isVue) {
        content = (0, code_inspector_core_1.enhanceVueCode)(content, filePath, 'vue');
    }
    return content;
}
module.exports = WebpackCodeInspectorLoader;
//# sourceMappingURL=loader.js.map