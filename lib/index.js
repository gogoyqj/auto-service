'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var tslib_1 = require('tslib');
var path = require('path');
var fs = require('fs');
var request = require('request');
var swagger2ts_1 = require('./swagger2ts');
var serve_1 = require('./yapi/serve');
var consts_1 = require('./consts');
var defaultParseConfig = {
  '-l': 'typescript-angularjs',
  '-t': path.join(consts_1.pluginsPath, 'typescript-tkit'),
  '-o': path.join(process.cwd(), 'src', 'services')
};
function gen(config, options) {
  return tslib_1.__awaiter(this, void 0, void 0, function() {
    var url,
      _a,
      type,
      swaggerParser,
      swaggerUrl,
      yapiTMP,
      swagger2tsConfig,
      servicesPath,
      swaggerPath,
      code,
      res;
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
          swagger2tsConfig = tslib_1.__assign({}, defaultParseConfig, swaggerParser);
          servicesPath = swagger2tsConfig['-o'];
          swaggerPath = path.join(servicesPath, 'swagger.json');
          if (!(config.validateResponse && swaggerUrl.match(/^http/))) return [3 /*break*/, 4];
          return [
            4 /*yield*/,
            new Promise(function(rs) {
              request.get(swaggerUrl, function(err, _a) {
                var body = _a.body;
                if (err) {
                  console.error('[ERROR]: download swagger json failed with: ' + err);
                  rs(1);
                } else {
                  if (!fs.existsSync(servicesPath)) {
                    fs.mkdirSync(servicesPath);
                  }
                  fs.writeFileSync(swaggerPath, body, { encoding: 'utf8' });
                  swaggerUrl = swaggerPath;
                  rs(0);
                }
              });
            })
          ];
        case 3:
          code = _b.sent();
          if (code) {
            return [2 /*return*/, code];
          }
          _b.label = 4;
        case 4:
          return [
            4 /*yield*/,
            swagger2ts_1.default(
              tslib_1.__assign({}, swagger2tsConfig, { '-i': swaggerUrl }),
              options.clear
            )
          ];
        case 5:
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
