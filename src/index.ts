import * as path from 'path';
import * as fs from 'fs';
import * as request from 'request';
import chalk from 'chalk';

import { Json2Service, GuardConfig } from './consts';
import swagger2ts from './swagger2ts';
import serve from './yapi/serve';
import { pluginsPath, DefaultBasePath, SmTmpDir, basePathToFileName } from './init';
import { operationIdGuard } from './guard';

const defaultParseConfig = {
  '-l': 'typescript-angularjs',
  '-t': path.join(pluginsPath, 'typescript-tkit'),
  '-o': path.join(process.cwd(), 'src', 'services')
};
export default async function gen(
  config: Json2Service,
  options: { clear?: boolean }
): Promise<number> {
  const { url, type = 'swagger', swaggerParser } = config;
  let swaggerUrl = url;
  if (!swaggerUrl.match(/^http/)) {
    swaggerUrl = path.join(process.cwd(), url);
    if (!fs.existsSync(swaggerUrl)) {
      console.log(chalk.red(`[ERROR]: swagger ${swaggerUrl} not found`));
      return 1;
    }
  }
  if (type === 'yapi') {
    const yapiTMP = await serve(swaggerUrl, config.yapiConfig);
    if ('result' in yapiTMP && yapiTMP.result && !yapiTMP.code) {
      swaggerUrl = yapiTMP.result;
    } else {
      console.log(chalk.red(`[ERROR]: gen failed with: ${yapiTMP.message}`));
      return 1;
    }
  }
  const swagger2tsConfig = { ...defaultParseConfig, ...swaggerParser };
  const servicesPath = swagger2tsConfig['-o'];
  // @cc: 强制保存在本地，方便做安全检测
  const code: number = await new Promise(rs => {
    const loader = (cb: (err: any, res: { body?: any }) => any) => {
      if (swaggerUrl.match(/^http/)) {
        request.get(swaggerUrl, cb);
      } else {
        try {
          cb(undefined, { body: JSON.stringify(require(swaggerUrl)) });
        } catch (e) {
          cb(e.message, {});
        }
      }
    };
    loader((err, { body }) => {
      if (err) {
        console.log(chalk.red(`[ERROR]: download swagger json failed with: ${err}`));
        rs(1);
      } else {
        if (!fs.existsSync(servicesPath)) {
          fs.mkdirSync(servicesPath);
        }
        const swaggerFileName = basePathToFileName(
          `${(body && JSON.parse(body).basePath) || DefaultBasePath}.json`
        );
        const swaggerPath = path.join(SmTmpDir, swaggerFileName);
        fs.writeFileSync(swaggerPath, body, { encoding: 'utf8' });
        swaggerUrl = swaggerPath;
        rs(0);
      }
    });
  });
  if (code) {
    return code;
  }
  // @cc: 风险校验
  const { errors, warnings, suggestions } = await operationIdGuard(
    require(swaggerUrl),
    (config.guardConfig && config.guardConfig.operationIdMethodUrlMap) || {}
  );
  if (warnings.length) {
    console.log(chalk.yellow(warnings.join('\n')));
  }
  if (errors.length) {
    console.log(chalk.red(errors.join('\n')));
    if (Object.keys(suggestions).length) {
      console.log(chalk.green('锁定映射建议，添加 "guardConfig" 到 service 配置'));
      const guard: GuardConfig = {
        operationIdMethodUrlMap: suggestions
      };
      console.log(chalk.green(JSON.stringify(guard, undefined, 2)));
    }
    return 1;
  }
  const res = await swagger2ts({ ...swagger2tsConfig, '-i': swaggerUrl }, options.clear);
  if (res.code) {
    console.log(chalk.red(`[ERROR]: gen failed with: ${res.message}`));
    return 1;
  } else {
    console.log(chalk.green(`[INFO]: gen success with: ${url}`));
  }
  return 0;
}
