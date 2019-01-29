'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var tslib_1 = require('tslib');
var child_process_1 = require('child_process');
var es6_promisify_1 = require('es6-promisify');
var path = require('path');
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
function swagger2ts(swaggerParser) {
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
          return [4 /*yield*/, parseSwagger(swaggerParser)];
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
var pluginsPath = path.join(__dirname, '..', 'plugins');
var generatorPath = path.join(pluginsPath, 'swagger-codegen-cli.jar');
var defaultParseConfig = {
  '-l': 'typescript-angularjs',
  '-t': path.join(pluginsPath, 'typescript-tkit'),
  '-o': path.join(process.cwd(), 'src', 'services')
};
function parseSwagger(swaggerParser) {
  return tslib_1.__awaiter(this, void 0, void 0, function() {
    var config;
    return tslib_1.__generator(this, function(_a) {
      switch (_a.label) {
        case 0:
          config = tslib_1.__assign({}, defaultParseConfig, swaggerParser);
          return [
            4 /*yield*/,
            asyncExec(
              'java -jar ' +
                generatorPath +
                ' generate ' +
                Object.keys(config)
                  .map(function(opt) {
                    return opt + ' ' + config[opt];
                  })
                  .join(' ')
            ).then()
          ];
        case 1:
          return [2 /*return*/, _a.sent()];
      }
    });
  });
}
//# sourceMappingURL=swagger2ts.js.map
