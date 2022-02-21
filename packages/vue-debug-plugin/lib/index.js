"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
var server_1 = __importDefault(require("./server"));
var get_inject_code_1 = __importDefault(require("./get-inject-code"));
var TrackCodePlugin = /** @class */ (function () {
    function TrackCodePlugin() {
    }
    TrackCodePlugin.prototype.apply = function (complier) {
        complier.hooks.compilation.tap('TrackCodePlugin', function (compilation) {
            server_1.default(function (port) {
                var code = get_inject_code_1.default(port);
                html_webpack_plugin_1.default.getHooks(compilation).beforeEmit.tapAsync('TrackCodePlugin', function (data, cb) {
                    // Manipulate the content
                    data.html = data.html.replace('</body>', code + "\n</body>");
                    // Tell webpack to move on
                    cb(null, data);
                });
            });
        });
    };
    return TrackCodePlugin;
}());
module.exports = TrackCodePlugin;
//# sourceMappingURL=index.js.map