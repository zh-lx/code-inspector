"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
// 启动本地接口，访问时唤起vscode
var http_1 = __importDefault(require("http"));
var portfinder_1 = __importDefault(require("portfinder"));
var launch_editor_1 = __importDefault(require("./launch-editor"));
var started = false;
module.exports = function StartServer(callback) {
    if (started) {
        return;
    }
    started = true;
    var server = http_1.default.createServer(function (req, res) {
        // 收到请求唤醒vscode
        var params = new URLSearchParams(req.url.slice(1));
        var file = params.get('file');
        var line = Number(params.get('line'));
        var column = Number(params.get('column'));
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': 'Content-Type,XFILENAME,XFILECATEGORY,XFILESIZE,X-URL-PATH,x-access-token',
        });
        res.end('ok');
        launch_editor_1.default(file, line, column);
    });
    // 寻找可用接口
    portfinder_1.default.getPort({ port: 4000 }, function (err, port) {
        if (err) {
            throw err;
        }
        server.listen(port, function () {
            callback(port);
        });
    });
};
//# sourceMappingURL=server.js.map