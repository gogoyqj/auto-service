import { exec } from 'child_process';
import { promisify } from 'es6-promisify';
import { SwaggerParser } from 'src';
import * as path from 'path';

const wrappedExec = <C>(url: string, cb: C) => exec(url, cb);
wrappedExec[promisify.argumentNames] = ['error', 'stdout', 'stderr'];
const asyncExec = <T>(cmd: T) =>
  promisify(wrappedExec)(cmd).then(
    (res: { error: string; stdout: string; stderr: string }) =>
      res.error ? { code: 1, message: res.stderr || res.error } : { code: 0, message: res.stdout },
    err => ({ code: 1, message: err.message })
  );

export default async function swagger2ts(
  swaggerParser: SwaggerParser
): Promise<{ code: Number; message?: string }> {
  const java = await checkJava();
  if (java.code) {
    console.error(`[ERROR]: check java failed with ${java.message}`);
    return java;
  }
  return await parseSwagger(swaggerParser);
}

async function checkJava() {
  return await asyncExec('java -version');
}
const pluginsPath = path.join(__dirname, '..', 'plugins');
const generatorPath = path.join(pluginsPath, 'swagger-codegen-cli.jar');
const defaultParseConfig = {
  '-l': 'typescript-angularjs',
  '-t': path.join(pluginsPath, 'typescript-tkit'),
  '-o': path.join(process.cwd(), 'src', 'services')
};

async function parseSwagger(swaggerParser: SwaggerParser) {
  const config = { ...defaultParseConfig, ...swaggerParser };
  return await asyncExec(
    `java -jar ${generatorPath} generate ${Object.keys(config)
      .map(opt => `${opt} ${config[opt]}`)
      .join(' ')}`
  )
    .then(() => ({ code: 0 }))
    .catch(e => ({
      code: 6,
      message: `[ERROR]: gen failed from ${config['-i']} with ${e.message}`
    }));
}
