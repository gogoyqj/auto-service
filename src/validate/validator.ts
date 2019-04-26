import * as path from 'path';
import * as ajv from 'ajv';
import { SwaggerJson, SMValidator } from 'src/types';
import { SmTmpDir, DefaultBasePath } from 'src/consts';
import * as fs from 'fs-extra';

export const getSchema = (() => {
  let inst: ajv.Ajv;
  let lastSwagger: SwaggerJson;
  return (swagger: SwaggerJson) => {
    if (lastSwagger === swagger && inst) {
      return inst;
    }
    lastSwagger = swagger;
    inst = new ajv();
    inst.addFormat('int32', d => {
      return !!d.match(/^[0-9-]+$/);
    });
    const definitions = getDefinitions(swagger);
    if (definitions) {
      inst.addSchema({
        $id: '',
        definitions
      });
    }
    return inst;
  };
})();

export function getSwagger(basePath: string) {
  const swaggerPath = path.join(SmTmpDir, `${basePath || DefaultBasePath}.json`);
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
    throw Error('接口文件不存在，请通过 sm2tsservices 重新生成');
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
    throw Error(`调用接口 "${path}" 不存在`);
  }
  return matched;
}

export const defaultValidator: SMValidator = async ({ code, message, result }) => {
  const {
    swagger: { basePath, path },
    send,
    receive: { body, status }
  } = result;
  try {
    if (code) {
      throw Error(message);
    } else {
      const swagger = getSwagger(basePath);
      const matchedPath = getPath(swagger, path);
      const method = (send ? send.method : 'GET').toLocaleLowerCase();
    }
  } catch (e) {
    console.error(e.message);
  }
};
