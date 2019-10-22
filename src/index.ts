import * as path from 'path';
import * as fs from 'fs';
import * as request from 'request';
import chalk from 'chalk';

import { Json2Service, SwaggerParser } from './consts';
import swagger2ts from './swagger2ts';
import serve from './yapi/serve';
import { pluginsPath, DefaultBasePath, SmTmpDir, basePathToFileName } from './init';
import { operationIdGuard, strictModeGuard } from './guard';

const defaultParseConfig: Partial<SwaggerParser> = {
  '-l': 'typescript-angularjs',
  '-t': path.join(pluginsPath, 'typescript-tkit'),
  '-o': path.join(process.cwd(), 'src', 'services')
};
/** CLI入口函数 */
export default async function gen(
  config: Json2Service,
  options: {
    /** 是否清空上次生成目录 */
    clear?: boolean;
  }
): Promise<number> {
  const { url, type = 'swagger', swaggerParser, requestConfig = {} } = config;
  let swaggerUrl = (requestConfig.url = requestConfig.url || url || '');
  if (!swaggerUrl) {
    console.log(chalk.red(`[ERROR]: swagger url not specified`));
    return 1;
  }
  if (!swaggerUrl.match(/^http/)) {
    swaggerUrl = path.join(process.cwd(), swaggerUrl);
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
  const servicesPath = swagger2tsConfig['-o'] || '';
  // @cc: 强制保存在本地，方便做安全检测
  const code: number = await new Promise(rs => {
    const loader = (cb: (err: any, res: { body?: any }) => any) => {
      if (swaggerUrl.match(/^http/)) {
        request.get(
          {
            ...requestConfig,
            url: swaggerUrl
          },
          cb
        );
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
        fs.writeFileSync(swaggerPath, body ? JSON.stringify(JSON.parse(body), null, 2) : body, {
          encoding: 'utf8'
        });
        swaggerUrl = swaggerPath;
        rs(0);
      }
    });
  });
  if (code) {
    return code;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const swaggerData = require(swaggerUrl);
  const guardConfig = config.guardConfig || {};
  // @cc: tags 校验
  const warnings = Array<string>();
  {
    const { warnings: w, errors } = await strictModeGuard(swaggerData, guardConfig);
    warnings.push(...w);
    if (errors.length) {
      console.log(chalk.red(errors.join('\n')));
      return 1;
    }
  }
  // @cc: 风险校验
  const { errors, warnings: w, suggestions } = await operationIdGuard(swaggerData, guardConfig);
  warnings.push(...w);
  if (warnings.length) {
    console.log(chalk.yellow(warnings.join('\n')));
  }
  fs.writeFileSync(swaggerUrl, JSON.stringify(swaggerData, null, 2), { encoding: 'utf8' });
  if (errors.length) {
    console.log(chalk.red(errors.join('\n')));
    if (suggestions.length) {
      console.log(chalk.green(JSON.stringify(suggestions, undefined, 2)));
    }
    return 1;
  } else {
    if (suggestions.length) {
      console.log(chalk.green(JSON.stringify(suggestions, undefined, 2)));
    }
  }
  const res = await swagger2ts({ ...swagger2tsConfig, '-i': swaggerUrl }, options.clear);
  if (res.code) {
    console.log(chalk.red(`[ERROR]: gen failed with: ${res.message}`));
    return 1;
  } else {
    console.log(chalk.green(`[INFO]: gen success with: ${requestConfig.url}`));
  }
  return 0;
}
