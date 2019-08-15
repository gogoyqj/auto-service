import * as path from 'path';
import * as fs from 'fs-extra';
import * as Ajv from 'ajv';
import chalk from 'chalk';
import { SwaggerJson, SMValidator, SMSchema, PathJson } from '../consts';
import { SmTmpDir, DefaultBasePath, basePathToFileName } from '../init';

const formatSchema = <S extends {}>(schema: S) =>
  JSON.parse(JSON.stringify(schema).replace(/"#\/definitions/g, '"definitions#/definitions'));

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

export function getDefinitions(swagger: SwaggerJson) {
  const { definitions } = swagger;
  return definitions;
}

export function getPath(swagger: SwaggerJson, path: string) {
  const { paths } = swagger;
  const matched = paths[path];
  if (!matched) {
    throw Error(`接口 "${path}" 不存在`);
  }
  return matched;
}

export function getParamSchema(parameters: PathJson['parameters']) {
  const paramsSchema: SMSchema = {
    type: 'object',
    properties: {}
  };
  return parameters.reduce((parentSchema, param) => {
    const { in: paramType, schema, name, type, required, description, format } = param;
    if (parentSchema.properties) {
      let cur = parentSchema.properties[paramType] as SMSchema;
      if (schema) {
        parentSchema.properties[paramType] = formatSchema(schema);
      } else {
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
          required: required ? [`${required}`] : required,
          description,
          format
        };
      }
    }
    return parentSchema;
  }, paramsSchema);
}

export const validatorFactory = (ajv: Ajv.Ajv) => <D extends {}>(shema: SMSchema, data: D) => {
  return ajv.validate(shema, data) ? '' : ajv.errorsText(ajv.errors);
};

export const defaultValidator: SMValidator = async ({ code, message, result }) => {
  const {
    req: { url },
    swagger: { basePath, path },
    send,
    receive: { body, status }
  } = result;
  const baseInfo = `${path}/${url}`;
  try {
    if (code) {
      throw Error(`接口 ${baseInfo} 初始化出错: ${message}`);
    } else {
      const swagger = getSwagger(basePath);
      const validator = validatorFactory(getAJV(swagger));
      const method = (send ? send.method : 'GET').toLocaleLowerCase();
      const matchMethod = getPath(swagger, path)[method];
      if (!matchMethod) {
        throw Error(`接口 ${baseInfo} 不支持 ${method}`);
      }
      const { parameters, responses } = matchMethod;
      if (parameters.length && send) {
        const error = validator(getParamSchema(parameters), send);
        if (error) {
          console.log(chalk.red(`接口 ${baseInfo} 参数不符合约定: ${error}`));
        } else {
          console.log(chalk.red(`接口 ${baseInfo} 参数符合约定`));
        }
      }
      // 校验参数
      // 校验返回
      const { schema } = responses[status];
      if (schema) {
        const error = validator(formatSchema(schema), body);
        if (error) {
          console.log(chalk.red(`接口 ${baseInfo} 数据返回不符合约定: ${error}`));
        } else {
          console.log(chalk.green(`接口 ${baseInfo} 数据返回符合约定`));
        }
      } else if (body) {
        throw Error(`接口 ${baseInfo} 不应该有数据返回`);
      }
    }
  } catch (e) {
    console.log(chalk.red(e.message));
  }
};
