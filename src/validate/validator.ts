import * as path from 'path';
import * as fs from 'fs-extra';
import Ajv from 'ajv';
import { SwaggerJson, SMValidator, SMSchema, PathJson, ValidateErrorCode } from '../consts';
import { SmTmpDir, DefaultBasePath, basePathToFileName } from '../init';
import { pathToReg } from './utils';

const formatSchema = <S extends {}>(schema: S) =>
  JSON.parse(JSON.stringify(schema).replace(/"#\/definitions/g, '"definitions#/definitions'));

/** 将 swagger 转成 ajv */
export const getAJV = (() => {
  let inst: Ajv.Ajv;
  let lastSwagger: SwaggerJson;
  return (swagger: SwaggerJson) => {
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

/** 根据 base path 获取 swagger 文件 */
export function getSwagger(basePath: string) {
  const swaggerPath = path.join(
    SmTmpDir,
    basePathToFileName(`${basePath || DefaultBasePath}.json`)
  );
  if (fs.existsSync(swaggerPath)) {
    let swagger = require(swaggerPath) as SwaggerJson;
    const state = fs.statSync(swaggerPath);
    if (swagger.__mtime && swagger.__mtime !== state.mtime) {
      delete require.cache[require.resolve(swaggerPath)];
      swagger = require(swaggerPath) as SwaggerJson;
    }
    swagger.__mtime = state.mtime;
    return swagger;
  } else {
    throw Error('物料文件不存在，请重新生成');
  }
}

/** 获取 swagger definitions 字段 */
export function getDefinitions(swagger: SwaggerJson) {
  const { definitions } = swagger;
  return definitions;
}

/** 根据 path 从 swagger paths 内获取接口定义 */
export function getPath(swagger: SwaggerJson, path: string) {
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

/** 将 swagger parameters 转换成 schema */
export function getParamSchema(parameters: PathJson['parameters']) {
  const paramsSchema: SMSchema = {
    type: 'object',
    properties: {}
  };
  return parameters.reduce((parentSchema, param) => {
    const { in: paramType = '', schema, name = '', type, required, description, format } = param;
    if (parentSchema.properties) {
      let cur = parentSchema.properties[paramType] as SMSchema;
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
          cur.required.push(name);
        }
      }
    }
    return parentSchema;
  }, paramsSchema);
}

export const validatorFactory = (ajv: Ajv.Ajv) => <D extends {}>(shema: SMSchema, data: D) => {
  return ajv.validate(shema, data) ? '' : ajv.errorsText(ajv.errors);
};

/** @tkit/ajax 规范的数据响应的校验 */
export const defaultValidator: SMValidator = async (
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
