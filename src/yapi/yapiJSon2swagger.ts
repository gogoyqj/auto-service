import * as _ from 'lodash';
// @ts-ignore
import * as ejs from 'easy-json-schema';
import { JSONSchema6 } from 'json-schema';
import * as JSON5 from 'json5';
import { Json2Service } from '../cli';

interface API {
  name: string;
  desc: string;
  add_time: number;
  up_time: number;
  index: number;
  proBasepath?: string;
  proName?: string;
  proDescription?: string;
  list: List[];
}

interface List {
  tag: any[];
  method: string;
  title: string;
  path: string;
  req_body_other: string;
  req_body_type: string;
  res_body_type: string;
  add_time: number;
  up_time: number;
  markdown: string;
  desc: string;
  res_body: string;
  index: number;
  api_opened: boolean;
  res_body_is_json_schema: boolean;
  req_body_form: any[];
  req_body_is_json_schema: boolean;
  req_params: any[];
  req_headers: any[];
  req_query: any[];
  query_path: QueryPath;
  type: string;
  status: string;
}

interface QueryPath {
  path: string;
  params: any[];
}

interface STag {
  name?: string;
  description?: string;
}

export default function yapiJSon2swagger(list: API[], yapiConfig: Json2Service['yapiConfig']) {
  let basePath: string = '';
  let info = {
    title: 'unknown',
    version: 'last',
    description: 'unknown'
  };
  let tags: STag[] = [];
  list.forEach(t => {
    if (t.proBasepath) {
      basePath = t.proBasepath;
    }
    if (t.proName) info.title = t.proName;
    if (t.proDescription) info.description = t.proDescription;
    tags.push({
      name: t.name,
      description: t.desc
    });
  });
  let reg = basePath ? new RegExp(`^${basePath}`) : undefined;
  const swaggerObj = {
    swagger: '2.0',
    info,
    basePath,
    tags,
    schemes: [
      'http' //Only http
    ],
    paths: (() => {
      let apisObj = {};
      for (let aptTag of list) {
        //list of category
        for (let api of aptTag.list) {
          //list of api
          const url = reg ? api.path.replace(reg, '') : api.path;
          if (apisObj[url] == null) {
            apisObj[url] = {};
          }
          apisObj[url][api.method.toLowerCase()] = (() => {
            let apiItem = {};
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
            apiItem['parameters'] = (() => {
              let paramArray = [];
              for (let p of api.req_headers) {
                //Headers parameters
                //swagger has consumes proprety, so skip proprety "Content-Type"
                if (p.name === 'Content-Type') {
                  continue;
                }
                paramArray.push({
                  name: p.name,
                  in: 'header',
                  description: `${p.name} (Only:${p.value})`,
                  required: p.required === 1,
                  type: 'string', //always be type string
                  default: p.value
                });
              }
              for (let p of api.req_params) {
                //Path parameters
                paramArray.push({
                  name: p.name,
                  in: 'path',
                  description: p.desc,
                  required: true, //swagger path parameters required proprety must be always true,
                  type: 'string' //always be type string
                });
              }
              for (let p of api.req_query) {
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
                  for (let p of api.req_body_form) {
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
                    let jsonParam = JSON5.parse(api.req_body_other);
                    if (jsonParam) {
                      if (jsonParam['title'] && jsonParam['title'].indexOf('empty object') !== -1) {
                        // @ts-ignore, f**k @types/lodash
                        jsonParam['title'] = _.flow(
                          _.camelCase,
                          _.upperFirst
                        )(url.replace(/\//g, '-') + 'Params');
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
                    in: 'formData', //use formData
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
                schema: (() => {
                  let schemaObj: JSONSchema6 = {};
                  if (api.res_body_type === 'raw') {
                    schemaObj['type'] = 'string';
                    schemaObj['format'] = 'binary';
                    schemaObj['default'] = api.res_body;
                  } else if (api.res_body_type === 'json') {
                    if (api.res_body) {
                      let resBody = JSON5.parse(api.res_body);
                      if (resBody !== null) {
                        if (resBody['type']) {
                          schemaObj = resBody; // as the parameters,
                        } else {
                          // required
                          if (yapiConfig && yapiConfig.required) {
                            resBody = JSON.parse(
                              JSON.stringify(resBody).replace(
                                /"([^*"]+":)/g,
                                (all, name) => `"*${name}`
                              )
                            );
                          }
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
                          )(url.replace(/\//g, '-'));
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
        }
      }
      return apisObj;
    })()
  };
  return swaggerObj;
}
