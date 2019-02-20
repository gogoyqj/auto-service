'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var tslib_1 = require('tslib');
var child_process_1 = require('child_process');
var es6_promisify_1 = require('es6-promisify');
var consts_1 = require('./consts');
var wrappedExec = function(url, cb) {
  return child_process_1.exec(url, cb);
};
wrappedExec[es6_promisify_1.promisify.argumentNames] = ['error', 'stdout', 'stderr'];
var asyncExec = function(cmd) {
  return es6_promisify_1
    .promisify(wrappedExec)(cmd)
    .then(
      function(res) {
        return res.error
          ? { code: 1, message: res.stderr || res.error }
          : { code: 0, message: res.stdout };
      },
      function(err) {
        return { code: 1, message: err.message };
      }
    );
};
function swagger2ts(swaggerParser, clear) {
  if (clear === void 0) {
    clear = false;
  }
  return tslib_1.__awaiter(this, void 0, void 0, function() {
    var java;
    return tslib_1.__generator(this, function(_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, checkJava()];
        case 1:
          java = _a.sent();
          if (java.code) {
            console.error('[ERROR]: check java failed with ' + java.message);
            return [2 /*return*/, java];
          }
          return [4 /*yield*/, parseSwagger(swaggerParser, clear)];
        case 2:
          return [2 /*return*/, _a.sent()];
      }
    });
  });
}
exports.default = swagger2ts;
function checkJava() {
  return tslib_1.__awaiter(this, void 0, void 0, function() {
    return tslib_1.__generator(this, function(_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, asyncExec('java -version')];
        case 1:
          return [2 /*return*/, _a.sent()];
      }
    });
  });
}
function parseSwagger(config, clear) {
  if (clear === void 0) {
    clear = false;
  }
  return tslib_1.__awaiter(this, void 0, void 0, function() {
    return tslib_1.__generator(this, function(_a) {
      switch (_a.label) {
        case 0:
          return [
            4 /*yield*/,
            asyncExec(
              (clear ? 'rm -rf ' + config['-o'] + '/api;rm -rf ' + config['-o'] + '/model;' : '') +
                'java -jar ' +
                consts_1.generatorPath +
                ' generate ' +
                Object.keys(config)
                  .map(function(opt) {
                    return opt + ' ' + config[opt];
                  })
                  .join(' ')
            )
              .then(function() {
                return { code: 0 };
              })
              .catch(function(e) {
                return {
                  code: 6,
                  message: '[ERROR]: gen failed from ' + config['-i'] + ' with ' + e.message
                };
              })
          ];
        case 1:
          return [2 /*return*/, _a.sent()];
      }
    });
  });
}
//# sourceMappingURL=swagger2ts.js.map
