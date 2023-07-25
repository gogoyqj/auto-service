import * as _ from 'lodash';
import ejs from 'easy-json-schema'; // @fix module.exports = ejs;
import { JSONSchema6 } from 'json-schema';
import * as JSON5 from 'json5';

export default function yapiJSON2swagger(
  yapiList: Autos.YApiCategory[],
  yapiConfig: Autos.JSON2Service['yapiConfig'] = {}
) {
  const { beforeTransform, afterTransform, _capatibleYAPI = false } = yapiConfig;

  // modify before transform yapi document to swagger document
  const list = beforeTransform ? beforeTransform(yapiList) : yapiList;

  const meta = obtainMeta(list, yapiConfig);
  const reg = meta.basePath ? new RegExp(`^${meta.basePath}`) : undefined;

  const paths: Autos.SwaggerJson['paths'] = {};
  for (const category of list) {
    for (const api of category.list) {
      // trim common prefix of api urls
      const url = reg ? api.path.replace(reg, '') : api.path;
      const method = api.method.toLowerCase();
      if (paths[url] == null) {
        paths[url] = {};
      }
      const syntheticAPI = {
        ...api,
        url
      };
      const swaggerItem: Autos.PathJson = (paths[url][method] = {
        tags: [category.name],
        summary: api.title,
        description: api.markdown,
        consumes: convertCosumes(syntheticAPI, yapiConfig),
        parameters: convertParams(syntheticAPI, yapiConfig),
        responses: convertResponse(syntheticAPI, yapiConfig)
      });
      if (_capatibleYAPI !== true) {
        swaggerItem.operationId = `${url
          .replace(/(^\/|})/g, '')
          .replace(/[/{_-]{1,}([^/])/g, (_mat, u: string) =>
            u.toUpperCase()
          )}${method.replace(/^[a-z]/g, c => c.toUpperCase())}`;
      }
    }
  }

  const swaggerObj: Autos.SwaggerJson = {
    swagger: '2.0',
    ...meta,
    paths
  };
  return afterTransform ? afterTransform(swaggerObj) : swaggerObj;
}

export type SyntheticAPI = Autos.YApiItem & { url: string };

export function obtainMeta(list: Autos.YApiCategory[], yapiConfig: Autos.YAPIConfig) {
  let basePath = '';
  const tags: Autos.STag[] = [];
  const info = {
    title: 'unknown',
    version: 'last',
    description: 'unknown'
  };
  const { categoryMap = <T>(s: T) => s } = yapiConfig;

  // obtain tags and basePath from api list
  list.forEach(t => {
    if (t.proBasepath) {
      basePath = t.proBasepath;
    }
    if (t.proName) info.title = t.proName;
    if (t.proDescription) info.description = t.proDescription;
    // since yapi categories always are chinese, we need to map chinese categories to english categories
    const name =
      typeof categoryMap === 'function' ? categoryMap(t.name) : categoryMap[t.name] || t.name;
    tags.push({
      name: name,
      description: t.desc || t.name
    });
    t.name = name;
  });
  return { info, tags, basePath, schemes: ['http'] };
}

export function convertCosumes(api: SyntheticAPI, _yapiConfig: Autos.YAPIConfig) {
  switch (api.req_body_type) {
    case 'form':
    case 'file':
      return ['multipart/form-data']; // form data required
    case 'json':
      return ['application/json'];
    case 'raw':
      return ['text/plain'];
    default:
      return void 0;
  }
}

export function convertParams(api: SyntheticAPI, yapiConfig: Autos.YAPIConfig) {
  const { url, method } = api;
  const { bodyJsonRequired } = yapiConfig;
  const paramArray: Autos.PathJson['parameters'] = [];

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

  if (method.toLocaleLowerCase() !== 'get') {
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
                  JSON.stringify(jsonParam).replace(/"([^*"]+":)/g, (all, name) => `"*${name}`)
                );
              }
              jsonParam = ejs(jsonParam);
            }
            const name = (_.flow(_.camelCase, _.upperFirst) as any)(
              url.replace(/\//g, '-') + 'Body'
            ); // 向下兼容: 请勿修改 name 生成个规则
            if (jsonParam['title'] && jsonParam['title'].indexOf('empty object') !== -1) {
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

  return paramArray as Autos.PathJson['parameters'];
}

export function convertResponse(api: SyntheticAPI, yapiConfig: Autos.YAPIConfig) {
  const { url } = api;
  const { required } = yapiConfig;

  let schemaObj: JSONSchema6 = {};
  if (api.res_body_type === 'raw') {
    schemaObj = {
      type: 'string',
      format: 'binary',
      default: api.res_body
    };
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
              JSON.stringify(resBody).replace(/"([^*"]+":)/g, (_all, name) => `"*${name}`)
            );
          }
          schemaObj = ejs(resBody);
        }
        if (schemaObj.properties && schemaObj.properties.code) {
          // internal compatible
          if (typeof schemaObj.properties.code === 'object' && !schemaObj.properties.type) {
            schemaObj.properties.code.type = 'number';
          }
        }
        if (!schemaObj['title'] || schemaObj['title'].indexOf('empty object') !== -1) {
          schemaObj['title'] = (_.flow(_.camelCase, _.upperFirst) as any)(url.replace(/\//g, '-'));
        }
      }
    }
  }

  return {
    '200': {
      description: 'successful operation',
      schema: schemaObj
    }
  };
}

/** downward compatible */
export const yapiJSon2swagger = yapiJSON2swagger;

export type SwaggerLikeJson = ReturnType<typeof yapiJSON2swagger>;
