#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var tslib_1 = require('tslib');
var http = require('http');
var request = require('request');
var detectPort = require('detect-port');
var yapiJSon2swagger_1 = require('./yapiJSon2swagger');
function serve(url) {
  return tslib_1.__awaiter(this, void 0, void 0, function() {
    var yapiJSON, tmpServeUrl;
    return tslib_1.__generator(this, function(_a) {
      switch (_a.label) {
        case 0:
          return [
            4 /*yield*/,
            new Promise(function(rs) {
              request
                .get(url, function(err, _a) {
                  var body = _a.body;
                  var error = '';
                  var swagger;
                  if (err) {
                    error = '[ERROR]: download ' + url + ' faild with ' + err;
                  } else {
                    try {
                      swagger = JSON.parse(body);
                    } catch (e) {
                      error =
                        '[ERROR]: parse yapi to json from ' + url + ' faild with ' + e.message;
                    }
                    try {
                      swagger = yapiJSon2swagger_1.default(swagger);
                    } catch (e) {
                      error =
                        '[ERROR]: parse yapi to swagger from ' + url + ' faild with ' + e.message;
                    }
                  }
                  rs(error ? { code: 2, message: error } : { code: 0, result: swagger });
                })
                .on('error', function(e) {
                  rs({ code: 2, message: '[ERROR]: ' + e.message });
                });
            })
          ];
        case 1:
          yapiJSON = _a.sent();
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
                    res.end(JSON.stringify(yapiJSON.result), function() {
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
                  code: 3,
                  message: e
                };
              }
            )
          ];
        case 2:
          return [2 /*return*/, _a.sent()];
      }
    });
  });
}
exports.default = serve;
//# sourceMappingURL=serve.js.map
