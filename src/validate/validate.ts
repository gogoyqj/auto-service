import * as Ajv from 'ajv';
import { JSONSchema4, JSONSchema6 } from 'json-schema';
// console.time('begin');
// const { paths, definitions } = require('../api-swagger.json');
// const { get } = paths['/api/v1/admin/headhunter/position'];

// const ajv = new Ajv();
// ajv.addFormat('int32', d => {
//   return true;
// });
// const validate = ajv.compile({
//   ...get.responses['200'].schema,
//   definitions
// });
// console.log(
//   validate({
//     code: 200,
//     result: ''
//   })
// );
// console.timeEnd('begin');

export interface SwaggerJson {
  paths: {
    [path: string]: {
      [method: string]: {
        parameters: {
          name: string;
          in: 'path' | 'form' | 'query' | 'body' | string;
          description: string;
          required: boolean;
          type?: string;
          schema?: JSONSchema4 | JSONSchema6;
        }[];
        responses: {
          [statusCode: number]: JSONSchema4 | JSONSchema6;
        };
      };
    };
  };
  definitions?: JSONSchema6;
  basePath: string;
}

export interface ValidateOptions {
  // cc:pathToSwaggerMap;一个项目有多个swagger.json
  pathToSwaggerMap: {
    [rules: string]: SwaggerJson;
  };
}

export interface BasicRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'PATCH' | 'HEAD';
  url: string;
  data?: any; // post json
  form?: any; // post form
  query?: any;
  header?: any;
  path?: any;
}

export default class Validate {
  public ajv: Ajv.Ajv;
  public options: ValidateOptions;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  constructor(options: ValidateOptions) {
    this.ajv = this.initAjx();
    this.options = options;
  }
  public initAjx() {
    const ajv = new Ajv();
    ajv.addFormat('int32', d => {
      return true;
    });
    ajv.addFormat('int64', d => {
      return true;
    });
    return ajv;
  }
  public getSwagger(basePath: string) {
    const swagger = this.options.pathToSwaggerMap[basePath];
    if (!swagger) {
      throw Error(`basePath "${basePath}" 不存在于 pathToSwaggerMap 配置中`);
    }
    return swagger;
  }
  public getDefinitions(swagger: SwaggerJson, basePath: string) {
    const { definitions } = swagger;
    if (definitions) {
      this.ajv.addSchema(definitions, basePath);
    }
    return definitions;
  }
  public getParametersAndResponse(
    swagger: SwaggerJson,
    path: string,
    requestConfig: BasicRequestConfig
  ) {
    const { paths } = swagger;
    const matched = paths[path];
    if (!matched) {
      throw Error(`path "${path}" 不存在于 swagger paths`);
    }
    const method = requestConfig.method.toLocaleLowerCase();
    const matchedMethod = matched[method];
    if (!matchedMethod) {
      throw Error(`method "${method}" 不在于 swagger paths["${path}"]`);
    }
    const { data } = requestConfig;
    const { parameters, responses } = matchedMethod;
    // cc:校验 body json only in params
    return async () => {
      const bodyJson = parameters.find(({ in: type, schema }) => {
        return type === 'body' && !!schema;
      });
      if (bodyJson) {
        // do nothing
      }
    };
  }
}
