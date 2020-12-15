/* eslint-disable @typescript-eslint/no-var-requires */
import * as path from 'path';
import * as fs from 'fs';
import * as request from 'request';
import chalk from 'chalk';

import { Json2Service, SwaggerParser, RemoteUrlReg, ProjectDir, SwaggerJson } from './consts';
import swagger2ts from './swagger2ts';
import serve from './yapi/serve';
import { pluginsPath, SmTmpDir, basePathToFileName, DefaultBasePath } from './init';
import { operationIdGuard, strictModeGuard } from './guard';
import { serveDiff } from './diff/serve';

const defaultParseConfig: Partial<SwaggerParser> = {
  '-l': 'typescript-angularjs',
  '-t': path.join(pluginsPath, 'typescript-tkit'),
  '-o': path.join(process.cwd(), 'src', 'services')
};
/** CLI入口函数 */
export default async function gen(
  config: Json2Service,
  options: {
    // 自动全量使用远程文档，不显示 diff & merge 页面
    quiet?: boolean;
    /** 是否清空上次生成目录 */
    clear?: boolean;
    /** 指定是否生成 models，false表示不生成，true表示一定生成，默认受 apis 的值影响 */
    models?: boolean;
    /** 指定是否生成 apis，false表示不生成，true表示一定生成，默认受 models 的值影响 */
    apis?: boolean;
    /** 生成typeScriptDataFile，可以指定文件名 */
    typeScriptDataFile?: string | boolean;
  }
): Promise<number> {
  const {
    url,
    remoteUrl,
    type = 'swagger',
    swaggerParser,
    requestConfig = {},
    swaggerConfig = {}
  } = config;
  if (!url || url.match(RemoteUrlReg)) {
    console.log(chalk.red(`[ERROR]: 自 @3.1.* url 必须是本地地址`));
    throw 1;
  }
  /** 当前版本 */
  const localSwaggerUrl = path.join(ProjectDir, url);

  /** 远程或本地新版本 */
  let remoteSwaggerUrl = (requestConfig.url = requestConfig.url || remoteUrl || '');
  if (remoteSwaggerUrl) {
    if (!remoteSwaggerUrl.match(RemoteUrlReg)) {
      remoteSwaggerUrl = path.join(ProjectDir, remoteSwaggerUrl);
      if (!fs.existsSync(remoteSwaggerUrl)) {
        console.log(chalk.red(`[ERROR]: remoteUrl 指定的文件 ${remoteUrl} 不存在`));
        throw 1;
      }
    }
  }

  // IMP: yapi => swagger
  if (type === 'yapi') {
    const yapiTMP = await serve(remoteSwaggerUrl, config.yapiConfig);
    if ('result' in yapiTMP && yapiTMP.result && !yapiTMP.code) {
      remoteSwaggerUrl = yapiTMP.result;
    } else {
      console.log(chalk.red(`[ERROR]: 基于 YAPI 生成失败: ${yapiTMP.message}`));
      throw 1;
    }
  }

  /** 写入本地版本 */
  const updateLocalSwagger = (data: SwaggerJson) => {
    fs.writeFileSync(localSwaggerUrl, data ? JSON.stringify(data, null, 2) : data, {
      encoding: 'utf8'
    });
  };
  const swagger2tsConfig = { ...defaultParseConfig, ...swaggerParser };
  const servicesPath = swagger2tsConfig['-o'] || '';
  // IMP: 加载新版
  const code: number = await new Promise(rs => {
    const loader = (cb: (err: any, res: { body?: SwaggerJson }) => any) => {
      remoteSwaggerUrl
        ? remoteSwaggerUrl.match(RemoteUrlReg)
          ? request.get(
              {
                ...requestConfig,
                url: remoteSwaggerUrl
              },
              (err, res) => cb(err, { body: JSON.parse(res.body) })
            )
          : cb(undefined, { body: require(remoteSwaggerUrl) as SwaggerJson })
        : cb(undefined, {});
    };
    loader(async (err, { body: newSwagger }) => {
      if (err) {
        console.log(chalk.red(`[ERROR]: 下载 Swagger JSON 失败: ${err}`));
        rs(1);
      } else {
        if (!fs.existsSync(servicesPath)) {
          fs.mkdirSync(servicesPath);
        }
        if (newSwagger) {
          // 支持过滤掉某些特定的规则
          const { exclude, include, modifier } = swaggerConfig;
          if (Array.isArray(exclude) || Array.isArray(include)) {
            const { paths } = newSwagger;
            newSwagger.paths = Object.keys(paths).reduce<typeof paths>((newPaths, url) => {
              const included = include?.find(reg => url.match(reg));
              const excluded = exclude?.find(reg => url.match(reg));
              // 未配置 exclude 但是配置配置了 include
              if (exclude === undefined && include !== undefined) {
                if (included) {
                  newPaths[url] = paths[url];
                }
              } else {
                if (included || !excluded) {
                  newPaths[url] = paths[url];
                }
              }
              return newPaths;
            }, {});
          }
          if (modifier) {
            newSwagger = modifier(newSwagger, config);
          }
          if (fs.existsSync(localSwaggerUrl) && !options.quiet) {
            // diff and patch
            const localSwagger: SwaggerJson = require(localSwaggerUrl);
            const merged = await serveDiff<SwaggerJson>(localSwagger, newSwagger);
            merged && updateLocalSwagger(merged);
          } else {
            updateLocalSwagger(newSwagger);
          }
        }
        rs(0);
      }
    });
  });
  if (code) {
    throw code;
  }
  // 删除缓存
  delete require.cache[require.resolve(localSwaggerUrl)];
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const swaggerData: SwaggerJson = require(localSwaggerUrl);
  const guardConfig = config.guardConfig || {};

  // IMP: tags 校验
  const warnings = Array<string>();
  {
    const { warnings: w, errors } = await strictModeGuard(swaggerData, guardConfig);
    warnings.push(...w);
    if (errors.length) {
      throw errors.join('\n');
    }
  }

  // IMP: 风险校验
  const { errors, warnings: w, suggestions } = await operationIdGuard(swaggerData, guardConfig);
  warnings.push(...w);
  if (warnings.length) {
    console.log(chalk.yellow(warnings.join('\n')));
  }

  // IMP: 校正后的文件写入临时文件
  const swaggerFileName = basePathToFileName(`${swaggerData.basePath || DefaultBasePath}.json`);
  const swaggerPath = path.join(SmTmpDir, swaggerFileName);
  fs.writeFileSync(swaggerPath, JSON.stringify(swaggerData), {
    encoding: 'utf8'
  });

  if (errors.length) {
    if (suggestions.length) {
      console.log(chalk.green(JSON.stringify(suggestions, undefined, 2)));
    }
    throw errors.join('\n');
  } else {
    if (suggestions.length) {
      console.log(chalk.green(JSON.stringify(suggestions, undefined, 2)));
    }
  }

  const envs: string[] = [];
  const { apis, models, clear, typeScriptDataFile } = options;
  if (typeScriptDataFile !== undefined && typeScriptDataFile !== false) {
    envs.push(
      typeScriptDataFile === true
        ? 'typeScriptDataFile'
        : `typeScriptDataFile=${typeScriptDataFile}`,
      'apis',
      'models'
    );
  } else {
    if (apis !== undefined) {
      envs.push(apis === true ? 'apis' : `apis=${options.apis}`);
    }
    if (models !== undefined) {
      envs.push(models === true ? 'models' : `models=${models}`);
    }
  }

  const res = await swagger2ts({ ...swagger2tsConfig, '-i': swaggerPath }, clear, envs);
  if (res.code) {
    throw `[ERROR]: gen failed with: ${res.message}`;
  } else {
    console.log(chalk.green(`[INFO]: gen success with: ${localSwaggerUrl}`));
    console.log(chalk.yellowBright(`[IMP] 请将文件 ${localSwaggerUrl} 添加到版本仓库`));
  }
  return 0;
}
