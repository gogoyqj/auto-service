import * as path from 'path';
import * as fs from 'fs-extra';
import Ajv from 'ajv';
import { ValidateErrorCode } from '../consts';
import { SmTmpDir, DefaultBasePath, basePathToFileName } from '../init';
import { pathToReg } from './utils';

const formatSchema = <S extends {}>(schema: S) =>
  JSON.parse(JSON.stringify(schema).replace(/"#\/definitions/g, '"definitions#/definitions'));

/** conctruct ajv by swagger */
export const getAJV = (() => {
  let inst: Ajv.Ajv;
  let lastSwagger: Autos.SwaggerJson;
  return (swagger: Autos.SwaggerJson) => {
    if (lastSwagger === swagger && inst) {
      return inst;
    }
    lastSwagger = swagger;
    inst = new Ajv();
    inst.addFormat('int32', d => {
      return !!d.match(/^[0-9-]+$/);
    });
    const definitions = getDefinitions(swagger);
    if (definitions) {
      inst.addSchema({
        $id: 'definitions',
        definitions: formatSchema(definitions)
      });
    }
    return inst;
  };
})();

/** obtain swagger */
export function getSwagger(basePath: string) {
  const swaggerPath = path.join(
    SmTmpDir,
    `${basePathToFileName(`${basePath || DefaultBasePath}`)}.json`
  );
  if (fs.existsSync(swaggerPath)) {
    let swagger = require(swaggerPath) as Autos.SwaggerJson;
    const state = fs.statSync(swaggerPath);
    if (swagger.__mtime && swagger.__mtime !== state.mtime) {
      delete require.cache[require.resolve(swaggerPath)];
      swagger = require(swaggerPath) as Autos.SwaggerJson;
    }
    swagger.__mtime = state.mtime;
    return swagger;
  } else {
    throw Error('物料文件不存在，请重新生成');
  }
}

/** obtain swagger definitions */
export function getDefinitions(swagger: Autos.SwaggerJson) {
  const { definitions } = swagger;
  return definitions;
}

/** obtain api definition by url */
export function getPath(swagger: Autos.SwaggerJson, path: string) {
  const { paths } = swagger;
  let matched = paths[path];
  if (!matched) {
    // path 内包含变量
    Object.keys(paths).find(p => {
      if (p.indexOf('{') !== -1 && path.match(pathToReg(p))) {
        matched = paths[p];
        return true;
      }
      return false;
    });
  }
  if (!matched) {
    throw Error(`接口 "${path}" 不存在`);
  }
  return matched;
}

/** convert swagger parameters into schema */
export function getParamSchema(parameters: Autos.PathJson['parameters'] = []) {
  const paramsSchema: Autos.SMSchema = {
    type: 'object',
    properties: {}
  };
  return parameters.reduce((parentSchema, param) => {
    const { in: paramType = '', schema, name = '', type, required, description, format } = param;
    if (parentSchema.properties) {
      let cur = parentSchema.properties[paramType] as Autos.SMSchema;
      if (schema) {
        parentSchema.properties[paramType] = formatSchema(schema);
      } else {
        // 非 post json 转换成 schema
        if (!cur) {
          cur = parentSchema.properties[paramType] = {
            type: 'object'
          };
        }
        if (!cur.properties) {
          cur.properties = {};
        }
        cur.properties[name] = {
          type: type as any,
          description,
          format
        };
        // object 通过 required 字段来约束必选字段
        if (required) {
          cur.required = cur.required || [];
          (cur.required as string[]).push(name);
        }
      }
    }
    return parentSchema;
  }, paramsSchema);
}

export const validatorFactory = (ajv: Ajv.Ajv) => <D extends {}>(
  shema: Autos.SMSchema,
  data: D
) => {
  return ajv.validate(shema, data) ? '' : ajv.errorsText(ajv.errors);
};

/** built-in validator for input and output of an API specified by swagger */
export const defaultValidator: Autos.SMValidator = async (
  { code, message, result },
  { loadSwagger, onValidate, formatBodyBeforeValidate }
) => {
  const {
    req: { url: u = '' },
    send,
    receive: { body, status }
  } = result;
  try {
    const [url] = u.split('?');
    if (code) {
      throw Error(`接口 ${url} 初始化出错: ${message}`);
    } else {
      const swagger = loadSwagger(url);
      const { basePath = '' } = swagger;
      const path = url.replace(new RegExp(`^${basePath}`), '');
      const baseInfo = `${path}${url.indexOf(path) === -1 ? ` / ${url}` : ''}`;
      const validator = validatorFactory(getAJV(swagger));
      const method = (send ? send.method : 'GET').toLocaleLowerCase();
      const matchMethod = getPath(swagger, path)[method];
      if (!matchMethod) {
        throw Error(`接口 ${baseInfo} 不支持 ${method}`);
      }
      const { parameters, responses } = matchMethod;
      if (parameters && parameters.length && send) {
        const error = validator(getParamSchema(parameters), send);
        if (error) {
          onValidate?.({
            code: ValidateErrorCode.ParamsNotMatched,
            message: `接口 ${baseInfo} 参数不符合约定: ${error}`,
            result
          });
        } else {
          onValidate?.({
            code: 0,
            message: `接口 ${baseInfo} 参数符合约定`,
            result
          });
        }
      }
      // 校验参数
      // 校验返回
      const { schema } = responses[status];
      if (schema) {
        const error = validator(
          formatSchema(schema),
          formatBodyBeforeValidate ? formatBodyBeforeValidate(body) : body
        );
        if (error) {
          onValidate?.({
            code: ValidateErrorCode.ResponseNotMatched,
            message: `接口 ${baseInfo} 数据返回不符合约定: ${error}`,
            result
          });
        } else {
          onValidate?.({
            code: 0,
            message: `接口 ${baseInfo} 数据返回符合约定`,
            result
          });
        }
      } else if (body) {
        throw Error(`接口 ${baseInfo} 不应该有数据返回`);
      }
    }
  } catch (e) {
    onValidate?.({
      code: ValidateErrorCode.Weird,
      message: e.message
    });
  }
};
