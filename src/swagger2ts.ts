import { exec } from 'child_process';
import { promisify } from 'es6-promisify';
import { SwaggerParser } from './cli';
import { generatorPath } from './consts';

const wrappedExec = <C>(url: string, cb: C) => exec(url, cb);
wrappedExec[promisify.argumentNames] = ['error', 'stdout', 'stderr'];
const asyncExec = <T>(cmd: T) =>
  promisify(wrappedExec)(cmd).then(
    (res: { error: string; stdout: string; stderr: string }) =>
      res.error ? { code: 1, message: res.stderr || res.error } : { code: 0, message: res.stdout },
    err => ({ code: 1, message: err.message })
  );

export default async function swagger2ts(
  swaggerParser: SwaggerParser,
  clear: boolean = false
): Promise<{ code: Number; message?: string }> {
  const java = await checkJava();
  if (java.code) {
    console.error(`[ERROR]: check java failed with ${java.message}`);
    return java;
  }
  return await parseSwagger(swaggerParser, clear);
}

async function checkJava() {
  return await asyncExec('java -version');
}

async function parseSwagger(config: SwaggerParser, clear: boolean = false) {
  return await asyncExec(
    `${
      clear ? `rm -rf ${config['-o']}/api;rm -rf ${config['-o']}/model;` : ''
    }java -jar ${generatorPath} generate ${Object.keys(config)
      .map(opt => `${opt} ${config[opt]}`)
      .join(' ')}`
  )
    .then(() => ({ code: 0 }))
    .catch(e => ({
      code: 6,
      message: `[ERROR]: gen failed from ${config['-i']} with ${e.message}`
    }));
}
