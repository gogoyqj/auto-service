import * as path from 'path';
import { SwaggerJson, SMAjaxConfig, SMAbstractResponse, PathJson, SMValidator } from 'src/types';
import { SmTmpDir, DefaultBasePath } from 'src/consts';
import * as fs from 'fs-extra';

export function getSwagger(basePath: string) {
  const swagger = path.join(SmTmpDir, `${basePath || DefaultBasePath}.json`);
  if (fs.existsSync(swagger)) {
    return require(swagger) as SwaggerJson;
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
    receive: { body, status }
  } = result;
  try {
    if (code) {
      throw Error(message);
    } else {
      const swagger = getSwagger(basePath);
      const definitions = getDefinitions(swagger);
      const matchedPath = getPath(swagger, path);
    }
  } catch (e) {
    console.error(e.message);
  }
};
