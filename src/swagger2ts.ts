import { exec } from 'child_process';
import { promisify } from 'es6-promisify';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import { SwaggerParser } from './consts';
import { generatorPath } from './init';

// IMP: fix max stdout buffer, about 9G
const wrappedExec = (url: string, cb?: () => any) => exec(url, { maxBuffer: 10000000000 }, cb);
wrappedExec[promisify.argumentNames] = ['error', 'stdout', 'stderr'];
const asyncExec = (cmd: string) =>
  // promisify类型编写错误
  promisify(wrappedExec as (cmd: string) => any)(cmd).then(
    (res: { error: string; stdout: string; stderr: string }) =>
      res.error ? { code: 1, message: res.stderr || res.error } : { code: 0, message: res.stdout },
    err => ({ code: 1, message: err.message })
  );

/** 调用 jar，swagger => ts */
export default async function swagger2ts(
  swaggerParser: SwaggerParser,
  clear = false,
  envs: string[] = []
): Promise<{ code: number; message?: string }> {
  const java = await checkJava();
  if (java.code) {
    console.log(chalk.red(`[ERROR]: check java failed with ${java.message}`));
    return java;
  }
  return await parseSwagger(swaggerParser, clear, envs);
}

async function checkJava() {
  return await asyncExec('java -version');
}

async function parseSwagger(config: SwaggerParser, clear = false, envs: string[] = []) {
  return await new Promise(async (rs, rj) => {
    if (clear) {
      try {
        fs.removeSync(`${config['-o']}/api`);
        fs.removeSync(`${config['-o']}/model`);
        rs({ code: 0 });
      } catch (e) {
        rj({
          code: 500,
          message: e.message
        });
      }
    } else {
      rs({ code: 0 });
    }
  })
    .then(
      () =>
        asyncExec(
          `java${
            envs.length ? ` ${envs.map(v => `-D${v}`).join(' ')}` : ''
          } -jar ${generatorPath} generate ${Object.keys(config)
            .map(opt => `${opt} ${config[opt]}`)
            .join(' ')}`
        ),
      e => e
    )
    .then(res => {
      if (res.code) {
        return Promise.reject(res);
      }
      return Promise.resolve(res);
    })
    .catch(e => ({
      code: 6,
      message: `[ERROR]: gen failed from ${config['-i']} with ${e.message}`
    }));
}
