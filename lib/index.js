#!/usr/bin/env node
'use strict';
var _this = this;
Object.defineProperty(exports, '__esModule', { value: true });
var tslib_1 = require('tslib');
var fs = require('fs');
var path = require('path');
var swagger2ts_1 = require('./swagger2ts');
var serve_1 = require('./yapi/serve');
var CD = __dirname;
var Config = 'json2service.json';
var ConfigFile = path.join(CD, '..', Config);
if (!fs.existsSync(ConfigFile)) {
  console.error('[ERROR]: ' + Config + ' not found in ' + CD);
} else {
  var config_1 = require(ConfigFile);
  (function() {
    return tslib_1.__awaiter(_this, void 0, void 0, function() {
      var url, _a, type, swaggerParser, swaggerUrl, yapiTMP, res;
      return tslib_1.__generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            (url = config_1.url),
              (_a = config_1.type),
              (type = _a === void 0 ? 'swagger' : _a),
              (swaggerParser = config_1.swaggerParser);
            swaggerUrl = url;
            if (!(type === 'yapi')) return [3 /*break*/, 2];
            return [4 /*yield*/, serve_1.default(url)];
          case 1:
            yapiTMP = _b.sent();
            if ('result' in yapiTMP && yapiTMP.result && !yapiTMP.code) {
              swaggerUrl = yapiTMP.result;
            } else {
              console.error('[ERROR]: gen failed with: ' + yapiTMP.message);
              process.exit();
            }
            _b.label = 2;
          case 2:
            return [
              4 /*yield*/,
              swagger2ts_1.default(tslib_1.__assign({}, swaggerParser, { '-i': swaggerUrl }))
            ];
          case 3:
            res = _b.sent();
            if (res.code) {
              console.error('[ERROR]: gen failed with: ' + res.message);
            } else {
              console.log('[INFO]: gen success with: ' + url);
            }
            return [2 /*return*/];
        }
      });
    });
  })();
}
//# sourceMappingURL=index.js.map
