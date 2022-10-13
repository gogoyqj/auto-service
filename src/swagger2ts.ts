import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import recursive from 'recursive-readdir';
import { SwaggerParser, Json2Service } from './consts';
import { generatorPath, SmTmpDir, pluginsPath, DebugLog } from './init';

const asyncExec = (cmd: string) =>
  // promisify类型编写错误
  new Promise((rs, rj) => {
    exec(cmd, { maxBuffer: 10000000000 }, (error, stdout, stderr) => {
      DebugLog(`exec ${cmd}`);
      DebugLog(`exec with + ${error}`);
      DebugLog(`exec stdout ${stdout}`);
      DebugLog(`exec stderr ${stderr}`);
      if (error) {
        rj(error);
      } else {
        rs({
          error,
          stdout,
          stderr
        });
      }
    });
  }).then(
    (res: { error: string; stdout: string; stderr: string }) =>
      res.error ? { code: 1, message: res.stderr || res.error } : { code: 0, message: res.stdout },
    err => ({ code: 1, message: err.message })
  );

async function checkJava() {
  return await asyncExec('java -version');
}

const cmdV3 = `-cp ${pluginsPath}/v3/myClientCodegen-swagger-codegen-1.0.0.jar${
  process.platform === 'darwin' ? ':' : ';'
}${pluginsPath}/v3/swagger-codegen-cli.jar io.swagger.codegen.v3.cli.SwaggerCodegen`;
const cmdV2 = `-jar ${generatorPath}`;

/** OpenAPI 2 */
async function parseSwagger(
  config: SwaggerParser,
  envs: string[] = [],
  swaggerConfig: Json2Service['swaggerConfig'] = {},
  cmd = cmdV2
) {
  const { '-i': input, '-o': output } = config;
  const { formater } = swaggerConfig;
  const tmpServicePath = path.join(SmTmpDir, path.basename(input).replace(/[/\\.]/g, '_'));
  // must generate models.ts
  if (envs.indexOf('models') !== -1 && envs.indexOf('supportingFiles') === -1) {
    envs.push('supportingFiles');
  }
  return await new Promise(async (rs, rj) => {
    try {
      fs.existsSync(tmpServicePath) && fs.removeSync(tmpServicePath);
      rs({ code: 0 });
    } catch (e) {
      rj({
        code: 500,
        message: `无法删除临时目录 ${tmpServicePath}，错误信息：${e.message}`
      });
    }
  })
    .then(
      () =>
        asyncExec(
          `java${
            envs.length ? ` ${envs.map(v => `-D${v}`).join(' ')}` : ''
          } ${cmd} generate ${Object.keys(config)
            .map(opt => `${opt} ${opt === '-o' ? tmpServicePath : config[opt]}`)
            .join(' ')} `
        ),
      e => e
    )
    .then(async res => {
      if (res.code) {
        fs.existsSync(tmpServicePath) && fs.removeSync(tmpServicePath);
        return Promise.reject(res);
      }
      // rm useless supportingFiles
      if (envs.indexOf('models') !== -1 && envs.indexOf('apis') === -1) {
        ['index.ts', path.join('api', 'api.ts')].forEach(file => {
          const p = path.join(tmpServicePath, file);
          if (fs.existsSync(p)) {
            fs.unlinkSync(p);
          }
        });
      }
      // format
      if (formater) {
        const formatRes = await asyncExec(formater.replace(/\{path\}/g, tmpServicePath));
        if (formatRes.code) return Promise.reject(formatRes);
      }
      // diff
      const oldFilesSet: { [file: string]: '' } = {};
      // TODO: 换成 promisefy
      fs.existsSync(output!) &&
        (await new Promise<void>((rs, rj) => {
          recursive(
            output!,
            [file => !file.match(/\.ts$/g) && !fs.lstatSync(file).isDirectory()],
            (err, files) => {
              if (err) {
                rj({
                  message: `访问输出目录 ${output} 失败\n错误信息：${err} `
                });
              } else {
                files.forEach(file => {
                  oldFilesSet[file.substr(output!.length + 1)] = '';
                });
                rs();
              }
            }
          );
        }));
      // TODO: 换成 promisefy
      return new Promise<typeof res>((rs, rj) => {
        recursive(
          tmpServicePath,
          [file => !file.match(/\.ts$/g) && !fs.lstatSync(file).isDirectory()],
          (err, files) => {
            if (err) {
              rj({
                message: `访问临时目录 ${tmpServicePath} 失败\n错误信息：${err} `
              });
            } else {
              files.forEach(tmpFile => {
                const file = tmpFile.substr(tmpServicePath.length + 1);
                if (file in oldFilesSet) {
                  delete oldFilesSet[file];
                }
                const outputFile = path.join(output!, file);
                if (fs.existsSync(outputFile)) {
                  const content = fs.readFileSync(tmpFile, { encoding: 'utf-8' });
                  if (fs.readFileSync(outputFile, { encoding: 'utf-8' }) !== content) {
                    console.log(chalk.white(`[LOG]: 更新 ${outputFile} `));
                    fs.writeFileSync(outputFile, content, { encoding: 'utf-8', flag: 'w' });
                  }
                } else {
                  console.log(chalk.white(`[LOG]: 拷贝 ${outputFile} `));
                  fs.ensureDirSync(path.dirname(outputFile));
                  fs.copySync(tmpFile, outputFile);
                }
              });
              Object.keys(oldFilesSet).forEach(file => {
                const oldFile = path.join(output!, file);
                console.log(chalk.white(`[LOG]: 删除 ${oldFile} `));
                fs.existsSync(oldFile) && fs.unlinkSync(oldFile);
              });
              fs.existsSync(tmpServicePath) && fs.removeSync(tmpServicePath);
              rs(res);
            }
          }
        );
      });
    })
    .catch(e => ({
      code: 6,
      message: `[ERROR]: gen failed from\n ${config['-i']} with\n ${e.message} `
    }));
}

/** OpenAPI 3 */
export const parserOpenAPI3: typeof parseSwagger = async (config, envs, swaggerConfig) => {
  return parseSwagger({ ...config, ['-l']: 'myClientCodegen' }, envs, swaggerConfig, cmdV3);
};

/** 调用 jar，swagger => ts */
export default async function swagger2ts(
  swaggerParser: SwaggerParser,
  envs: string[] = [],
  swaggerConfig: Json2Service['swaggerConfig'] = {},
  useV3 = false
): Promise<{ code: number; message?: string }> {
  const java = await checkJava();
  if (java.code) {
    console.log(
      chalk.red(
        `[ERROR]: 未检测到 Java ${java.message}，请从 https://www.java.com/en/download/manual.jsp 下载并安装`
      )
    );
    return java;
  }
  return await (useV3 ? parserOpenAPI3 : parseSwagger)(swaggerParser, envs, swaggerConfig);
}
