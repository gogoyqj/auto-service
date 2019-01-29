'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var _ = require('lodash');
// @ts-ignore
var ejs = require('easy-json-schema');
var JSON5 = require('json5');
function yapiJSon2swagger(list) {
  var swaggerObj = {
    swagger: '2.0',
    info: {
      title: 'asset',
      version: 'last',
      description: 'asset'
    },
    basePath: '',
    tags: (function() {
      var tagArray = [];
      list.forEach(function(t) {
        tagArray.push({
          name: t.name,
          description: t.desc
        });
      });
      return tagArray;
    })(),
    schemes: [
      'http' //Only http
    ],
    paths: (function() {
      var apisObj = {};
      var _loop_1 = function(aptTag) {
        var _loop_2 = function(api) {
          //list of api
          if (apisObj[api.path] == null) {
            apisObj[api.path] = {};
          }
          apisObj[api.path][api.method.toLowerCase()] = (function() {
            var apiItem = {};
            apiItem['tags'] = [aptTag.name];
            apiItem['summary'] = api.title;
            apiItem['description'] = api.markdown;
            switch (api.req_body_type) {
              case 'form':
              case 'file':
                apiItem['consumes'] = ['multipart/form-data']; //form data required
                break;
              case 'json':
                apiItem['consumes'] = ['application/json'];
                break;
              case 'raw':
                apiItem['consumes'] = ['text/plain'];
                break;
              default:
                break;
            }
            apiItem['parameters'] = (function() {
              var paramArray = [];
              for (var _i = 0, _a = api.req_headers; _i < _a.length; _i++) {
                var p = _a[_i];
                //Headers parameters
                //swagger has consumes proprety, so skip proprety "Content-Type"
                if (p.name === 'Content-Type') {
                  continue;
                }
                paramArray.push({
                  name: p.name,
                  in: 'header',
                  description: p.name + ' (Only:' + p.value + ')',
                  required: p.required === 1,
                  type: 'string',
                  default: p.value
                });
              }
              for (var _b = 0, _c = api.req_params; _b < _c.length; _b++) {
                var p = _c[_b];
                //Path parameters
                paramArray.push({
                  name: p.name,
                  in: 'path',
                  description: p.desc,
                  required: true,
                  type: 'string' //always be type string
                });
              }
              for (var _d = 0, _e = api.req_query; _d < _e.length; _d++) {
                var p = _e[_d];
                //Query parameters
                paramArray.push({
                  name: p.name,
                  in: 'query',
                  required: p.required === 1,
                  description: p.desc,
                  type: 'string' //always be type string
                });
              }
              switch (
                api.req_body_type //Body parameters
              ) {
                case 'form': {
                  for (var _f = 0, _g = api.req_body_form; _f < _g.length; _f++) {
                    var p = _g[_f];
                    paramArray.push({
                      name: p.name,
                      in: 'formData',
                      required: p.required === 1,
                      description: p.desc,
                      type: p.type === 'text' ? 'string' : 'file' //in this time .formData type have only text or file
                    });
                  }
                  break;
                }
                case 'json': {
                  if (api.req_body_other) {
                    var jsonParam = JSON5.parse(api.req_body_other);
                    if (jsonParam) {
                      if (jsonParam['title'] && jsonParam['title'].indexOf('empty object') !== -1) {
                        // @ts-ignore, f**k @types/lodash
                        jsonParam['title'] = _.flow(
                          _.camelCase,
                          _.upperFirst
                        )(api.path.replace(/\//g, '-') + 'Params');
                      }
                      paramArray.push({
                        name: 'root',
                        in: 'body',
                        description: jsonParam.description,
                        schema: jsonParam //as same as swagger's format
                      });
                    }
                  }
                  break;
                }
                case 'file': {
                  paramArray.push({
                    name: 'upfile',
                    in: 'formData',
                    description: api.req_body_other,
                    type: 'file'
                  });
                  break;
                }
                case 'raw': {
                  paramArray.push({
                    name: 'raw',
                    in: 'body',
                    description: 'raw paramter',
                    schema: {
                      type: 'string',
                      format: 'binary',
                      default: api.req_body_other
                    }
                  });
                  break;
                }
                default:
                  break;
              }
              return paramArray;
            })();
            apiItem['responses'] = {
              '200': {
                description: 'successful operation',
                schema: (function() {
                  var schemaObj = {};
                  if (api.res_body_type === 'raw') {
                    schemaObj['type'] = 'string';
                    schemaObj['format'] = 'binary';
                    schemaObj['default'] = api.res_body;
                  } else if (api.res_body_type === 'json') {
                    if (api.res_body) {
                      var resBody = JSON5.parse(api.res_body);
                      if (resBody !== null) {
                        if (resBody['type']) {
                          schemaObj = resBody; //as the parameters,
                        } else {
                          schemaObj = ejs(resBody);
                        }
                        if (schemaObj.properties && schemaObj.properties.code) {
                          if (typeof schemaObj.properties.code === 'object') {
                            schemaObj.properties.code.type = 'number';
                          }
                        }
                        if (
                          !schemaObj['title'] ||
                          schemaObj['title'].indexOf('empty object') !== -1
                        ) {
                          // @ts-ignore, f**k @types/lodash
                          schemaObj['title'] = _.flow(
                            _.camelCase,
                            _.upperFirst
                          )(api.path.replace(/\//g, '-'));
                        }
                      }
                    }
                  }
                  return schemaObj;
                })()
              }
            };
            return apiItem;
          })();
        };
        //list of category
        for (var _i = 0, _a = aptTag.list; _i < _a.length; _i++) {
          var api = _a[_i];
          _loop_2(api);
        }
      };
      for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
        var aptTag = list_1[_i];
        _loop_1(aptTag);
      }
      return apisObj;
    })()
  };
  return swaggerObj;
}
exports.default = yapiJSon2swagger;
//# sourceMappingURL=yapiJSon2swagger.js.map
