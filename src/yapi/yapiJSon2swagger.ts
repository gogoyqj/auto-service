import * as _ from 'lodash';
// @ts-ignore
import ejs from 'easy-json-schema'; // @fix module.exports = ejs;
import { JSONSchema6 } from 'json-schema';
import * as JSON5 from 'json5';
import { PathJson, SwaggerJson, Json2Service } from '../consts';

export interface YApiCategory {
  name: string;
  desc: string;
  add_time: number;
  up_time: number;
  index: number;
  proBasepath?: string;
  proName?: string;
  proDescription?: string;
  list: YApiItem[];
}

export interface YApiItem {
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
  res_schema_body?: string; // 兼容内部定制版本
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

export interface QueryPath {
  path: string;
  params: any[];
}

export interface STag {
  name?: string;
  description?: string;
}

export default function yapiJSon2swagger(
  yapiList: YApiCategory[],
  yapiConfig: Json2Service['yapiConfig'] = {}
) {
  let basePath = '';
  const info = {
    title: 'unknown',
    version: 'last',
    description: 'unknown'
  };
  const tags: STag[] = [];
  const {
    categoryMap = <T>(s: T) => s,
    bodyJsonRequired,
    required,
    beforeTransform,
    afterTransform
  } = yapiConfig;
  const list = beforeTransform ? beforeTransform(yapiList) : yapiList;
  list.forEach(t => {
    if (t.proBasepath) {
      basePath = t.proBasepath;
    }
    if (t.proName) info.title = t.proName;
    if (t.proDescription) info.description = t.proDescription;
    const name =
      typeof categoryMap === 'function' ? categoryMap(t.name) : categoryMap[t.name] || t.name;
    tags.push({
      name: name,
      description: t.desc || t.name
    });
    t.name = name;
  });
  const reg = basePath ? new RegExp(`^${basePath}`) : undefined;
  const swaggerObj: SwaggerJson = {
    swagger: '2.0',
    info,
    basePath,
    tags,
    schemes: [
      'http' // Only http
    ],
    paths: (() => {
      const apisObj: SwaggerJson['paths'] = {};
      for (const category of list) {
        // list of category
        for (const api of category.list) {
          // list of api
          const url = reg ? api.path.replace(reg, '') : api.path;
          if (apisObj[url] == null) {
            apisObj[url] = {};
          }
          const method = api.method.toLowerCase();
          apisObj[url][method] = (() => {
            // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
            const apiItem = {} as PathJson;
            apiItem['tags'] = [category.name];
            apiItem['summary'] = api.title;
            apiItem['description'] = api.markdown;
            switch (api.req_body_type) {
              case 'form':
              case 'file':
                apiItem['consumes'] = ['multipart/form-data']; // form data required
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
              const paramArray = [];
              for (const p of api.req_headers) {
                // Headers parameters
                // swagger has consumes proprety, so skip proprety "Content-Type"
                if (p.name === 'Content-Type') {
                  continue;
                }
                paramArray.push({
                  name: p.name,
                  in: 'header',
                  description: `${p.name} (Only:${p.value})`,
                  required: Number(p.required) === 1,
                  type: 'string', // always be type string
                  default: p.value
                });
              }
              for (const p of api.req_params) {
                // Path parameters
                paramArray.push({
                  name: p.name,
                  in: 'path',
                  description: p.desc,
                  required: true, // swagger path parameters required proprety must be always true,
                  type: 'string' // always be type string
                });
              }
              for (const p of api.req_query) {
                // Query parameters
                paramArray.push({
                  name: p.name,
                  in: 'query',
                  required: Number(p.required) === 1, // fix '1'
                  description: p.desc,
                  type: 'string' // always be type string
                });
              }
              // @IMP: get 不能有 body
              if (method !== 'get') {
                switch (
                  api.req_body_type // Body parameters
                ) {
                  case 'form': {
                    for (const p of api.req_body_form) {
                      paramArray.push({
                        name: p.name,
                        in: 'formData',
                        required: Number(p.required) === 1,
                        description: p.desc,
                        type: p.type === 'text' ? 'string' : 'file' // in this time .formData type have only text or file
                      });
                    }
                    break;
                  }
                  case 'json': {
                    if (api.req_body_other) {
                      let jsonParam = JSON5.parse(api.req_body_other);
                      if (jsonParam !== null) {
                        if (!jsonParam['type']) {
                          // required
                          if (bodyJsonRequired) {
                            jsonParam = JSON.parse(
                              JSON.stringify(jsonParam).replace(
                                /"([^*"]+":)/g,
                                (all, name) => `"*${name}`
                              )
                            );
                          }
                          jsonParam = ejs(jsonParam);
                        }
                        const name = (_.flow(_.camelCase, _.upperFirst) as any)(
                          url.replace(/\//g, '-') + 'Body'
                        ); // 向下兼容: 请勿修改 name 生成个规则
                        if (
                          jsonParam['title'] &&
                          jsonParam['title'].indexOf('empty object') !== -1
                        ) {
                          jsonParam['title'] = name;
                        }
                        paramArray.push({
                          name,
                          in: 'body',
                          description: jsonParam.description,
                          schema: jsonParam // as same as swagger's format
                        });
                      }
                    }
                    break;
                  }
                  case 'file': {
                    paramArray.push({
                      name: 'upfile',
                      in: 'formData', // use formData
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
              }
              return paramArray as PathJson['parameters'];
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
                    // 兼容内部版本
                    const body = api.res_body_is_json_schema
                      ? 'res_schema_body' in api
                        ? api.res_schema_body
                        : api.res_body
                      : api.res_body;
                    if (body) {
                      let resBody = JSON5.parse(body);
                      if (resBody !== null) {
                        if (resBody['type']) {
                          schemaObj = resBody; // as the parameters,
                        } else {
                          // required
                          if (required) {
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
                          schemaObj['title'] = (_.flow(_.camelCase, _.upperFirst) as any)(
                            url.replace(/\//g, '-')
                          );
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
  return afterTransform ? afterTransform(swaggerObj) : swaggerObj;
}

export type SwaggerLikeJson = ReturnType<typeof yapiJSon2swagger>;
