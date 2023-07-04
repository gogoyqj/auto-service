#!/usr/bin/env node
/* eslint-disable no-console */
import commander from 'commander'; // @fix no import * https://github.com/microsoft/tslib/issues/58
import chalk from 'chalk';
import { JSON2Service, ProjectDir } from './consts';
import gen from './index';
import initConfig from './initConfig';
import { cosmiconfig } from 'cosmiconfig';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';

const configName = 'json2service';

async function main() {
  commander
    .name(require('../package.json').name)
    .version(require('../package.json').version)
    .option('-c, --config [path]', '配置文件')
    .option('--quiet', '自动合并（全量覆盖），不弹窗提示冲突', false)
    .option(
      '--apis [boolean]',
      '是否生成 APIS，如果未指定 Models 且未指定 typeScriptDataFile 则会生成 APIS',
      undefined
    )
    .option(
      '--models [boolean]',
      '是否生成 Models，如果未指定 APIS 且未指定 typeScriptDataFile 则会生成 Models',
      undefined
    )
    .option(
      '--typeScriptDataFile [string]',
      '是否仅生成 TypeScript Type Data，可用于完全自定义生成逻辑',
      undefined
    )
    .option('--debug [boolean]', '是否打印调试信息', undefined)
    .option('--init [string]', '在当前目录下创建配置文件，默认是 json2service.js', undefined)
    .option('--clear', '【废弃】删除之前生成的 Service 代码 ', false)
    .parse(process.argv);

  const { clear, quiet, typeScriptDataFile, apis, models, debug, init } = commander;

  if (init) {
    const mergedInit = init === true ? `${configName}.js` : init;
    const initNames = [`${configName}.js`, `${configName}.ts`];
    if (initNames.includes(mergedInit)) {
      initConfig(mergedInit);
      return;
    }
    console.log(chalk.red(`[ERROR]: init 只接受 ${initNames.join(', ')}`));
    process.exit(1);
  }

  const Config = commander.config as string | undefined;

  const explorer = cosmiconfig(configName, {
    searchPlaces: [
      `${configName}.json`,
      `${configName}.js`,
      `${configName}.cjs`,
      `${configName}.mjs`,
      `${configName}.ts`
    ],
    loaders: {
      '.ts': TypeScriptLoader({
        transpileOnly: true
      })
    }
  });
  const loadedConfig = Config ? await explorer.load(Config) : await explorer.search();

  if (!loadedConfig) {
    console.log(chalk.red(`[ERROR]: 未初始化配置`));
    process.exit(1);
  }

  if (loadedConfig.isEmpty) {
    console.log(
      chalk.red(`[ERROR]: 在 ${ProjectDir} 目录下，配置文件 ${loadedConfig.filepath} 为空`)
    );
  }

  const config: JSON2Service = loadedConfig.config;
  gen(config, { clear, quiet, typeScriptDataFile, apis, models, debug })
    .then(() => {
      process.exit(0);
    })
    .catch(e => {
      console.log(chalk.red(e));
      process.exit(1);
    });
}

main();
