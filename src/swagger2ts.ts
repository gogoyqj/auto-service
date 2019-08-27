import { exec } from 'child_process';
import { promisify } from 'es6-promisify';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import { SwaggerParser } from './consts';
import { generatorPath } from './init';

const wrappedExec = <C>(url: string, cb: C) => exec(url, cb);
wrappedExec[promisify.argumentNames] = ['error', 'stdout', 'stderr'];
const asyncExec = (cmd: string) =>
  promisify(wrappedExec)(cmd).then(
    (res: { error: string; stdout: string; stderr: string }) =>
      res.error ? { code: 1, message: res.stderr || res.error } : { code: 0, message: res.stdout },
    err => ({ code: 1, message: err.message })
  );

export default async function swagger2ts(
  swaggerParser: SwaggerParser,
  clear: boolean = false
): Promise<{ code: number; message?: string }> {
  const java = await checkJava();
  if (java.code) {
    console.log(chalk.red(`[ERROR]: check java failed with ${java.message}`));
    return java;
  }
  return await parseSwagger(swaggerParser, clear);
}

async function checkJava() {
  return await asyncExec('java -version');
}

async function parseSwagger(config: SwaggerParser, clear: boolean = false) {
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
          `java -jar ${generatorPath} generate ${Object.keys(config)
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
