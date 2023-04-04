#!/usr/bin/env node
/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import commander from 'commander'; // @fix no import * https://github.com/microsoft/tslib/issues/58
import chalk from 'chalk';
import { JSON2Service, ProjectDir } from './consts';
import gen from './index';
import initConfig from './initConfig';

const defaultConfig = 'json2service.json';

commander
  .name(require('../package.json').name)
  .version(require('../package.json').version)
  .option('-c, --config [path]', '配置文件', defaultConfig)
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

const Config = commander.config as string;
let ConfigFile = path.join(ProjectDir, Config);
const { clear, quiet, typeScriptDataFile, apis, models, debug, init } = commander;

if (!fs.existsSync(ConfigFile)) {
  ConfigFile = ConfigFile.replace(/\.json/g, '.js');
}
if (!init && !fs.existsSync(ConfigFile)) {
  console.log(
    chalk.red(
      `[ERROR]: 在 ${ProjectDir} 目录下，未发现配置文件 ${Config} or ${Config.replace(
        /\.json/g,
        '.js'
      )}`
    )
  );
} else {
  if (init) {
    initConfig(init === true ? 'json2service.js' : init);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config: JSON2Service = require(ConfigFile);
    gen(config, { clear, quiet, typeScriptDataFile, apis, models, debug })
      .then(() => {
        process.exit(0);
      })
      .catch(e => {
        console.log(chalk.red(e));
        process.exit(1);
      });
  }
}
