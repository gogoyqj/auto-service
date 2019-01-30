#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var tslib_1 = require('tslib');
var http = require('http');
var request = require('request');
var detectPort = require('detect-port');
var yapiJSon2swagger_1 = require('./yapiJSon2swagger');
function download(url) {
  return tslib_1.__awaiter(this, void 0, void 0, function() {
    return tslib_1.__generator(this, function(_a) {
      return [
        2 /*return*/,
        new Promise(function(rs) {
          request
            .get(url, function(err, _a) {
              var body = _a.body;
              var error = '';
              var yapi;
              if (err) {
                error = '[ERROR]: download ' + url + ' faild with ' + err;
              } else {
                try {
                  yapi = JSON.parse(body);
                } catch (e) {
                  error = '[ERROR]: parse yapi to json from ' + url + ' faild with ' + e.message;
                }
              }
              rs(error ? { code: 2, message: error } : { code: 0, result: yapi });
            })
            .on('error', function(e) {
              rs({ code: 2, message: '[ERROR]: ' + e.message });
            });
        })
      ];
    });
  });
}
function serve(url) {
  return tslib_1.__awaiter(this, void 0, void 0, function() {
    var yapiJSON, _a, swagger, tmpServeUrl;
    return tslib_1.__generator(this, function(_b) {
      switch (_b.label) {
        case 0:
          if (!url.match(/^http/g)) return [3 /*break*/, 2];
          return [4 /*yield*/, download(url)];
        case 1:
          _a = _b.sent();
          return [3 /*break*/, 3];
        case 2:
          _a = { code: 0, result: require(url) };
          _b.label = 3;
        case 3:
          yapiJSON = _a;
          try {
            if (yapiJSON.result.errcode) {
              return [
                2 /*return*/,
                {
                  code: yapiJSON.result.errcode,
                  message: yapiJSON.result.errmsg
                }
              ];
            }
            swagger = yapiJSon2swagger_1.default(yapiJSON.result);
          } catch (e) {
            return [
              2 /*return*/,
              {
                code: 3,
                message: '[ERROR]: parse yapi to swagger from ' + url + ' faild with ' + e.message
              }
            ];
          }
          if (yapiJSON.code) {
            return [
              2 /*return*/,
              Promise.resolve({ code: yapiJSON.code, message: yapiJSON.message })
            ];
          }
          tmpServeUrl = 'http://127.0.0.1';
          return [
            4 /*yield*/,
            detectPort(3721).then(
              function(port) {
                tmpServeUrl = tmpServeUrl + ':' + port;
                var server = http
                  .createServer(function(req, res) {
                    res.end(JSON.stringify(swagger), function() {
                      return server.close();
                    });
                  })
                  .listen(port);
                process.on('exit', function() {
                  return server.close();
                });
                return {
                  code: 0,
                  result: tmpServeUrl
                };
              },
              function(e) {
                console.error('[ERROR]: create tmp server faild with: ' + e);
                return {
                  code: 4,
                  message: e
                };
              }
            )
          ];
        case 4:
          return [2 /*return*/, _b.sent()];
      }
    });
  });
}
exports.default = serve;
//# sourceMappingURL=serve.js.map
