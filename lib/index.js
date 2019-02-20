'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var tslib_1 = require('tslib');
var path = require('path');
var fs = require('fs');
var swagger2ts_1 = require('./swagger2ts');
var serve_1 = require('./yapi/serve');
function gen(config, options) {
  return tslib_1.__awaiter(this, void 0, void 0, function() {
    var url, _a, type, swaggerParser, swaggerUrl, yapiTMP, res;
    return tslib_1.__generator(this, function(_b) {
      switch (_b.label) {
        case 0:
          (url = config.url),
            (_a = config.type),
            (type = _a === void 0 ? 'swagger' : _a),
            (swaggerParser = config.swaggerParser);
          swaggerUrl = url;
          if (!swaggerUrl.match(/^http/)) {
            swaggerUrl = path.join(process.cwd(), url);
            if (!fs.existsSync(swaggerUrl)) {
              console.log('[ERROR]: swagger ' + swaggerUrl + ' not found');
              return [2 /*return*/, 1];
            }
          }
          if (!(type === 'yapi')) return [3 /*break*/, 2];
          return [4 /*yield*/, serve_1.default(swaggerUrl, config.yapiConfig)];
        case 1:
          yapiTMP = _b.sent();
          if ('result' in yapiTMP && yapiTMP.result && !yapiTMP.code) {
            swaggerUrl = yapiTMP.result;
          } else {
            console.error('[ERROR]: gen failed with: ' + yapiTMP.message);
            return [2 /*return*/, 1];
          }
          _b.label = 2;
        case 2:
          return [
            4 /*yield*/,
            swagger2ts_1.default(
              tslib_1.__assign({}, swaggerParser, { '-i': swaggerUrl }),
              options.clear
            )
          ];
        case 3:
          res = _b.sent();
          if (res.code) {
            console.error('[ERROR]: gen failed with: ' + res.message);
            return [2 /*return*/, 1];
          } else {
            console.log('[INFO]: gen success with: ' + url);
          }
          return [2 /*return*/, 0];
      }
    });
  });
}
exports.default = gen;
//# sourceMappingURL=index.js.map
