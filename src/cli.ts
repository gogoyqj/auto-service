#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as commander from 'commander'; // @fix no import * https://github.com/microsoft/tslib/issues/58
import chalk from 'chalk';
import { Json2Service } from './consts';
import gen from './index';

const CD = process.cwd();

commander
  .version(require('../package.json').version)
  .option('-c, --config [type]', 'config file', 'json2service.json')
  .option('--clear [type]', 'rm typescript service before gen', false)
  .parse(process.argv);

const Config = commander.config as string;
const ConfigFile = path.join(CD, Config);

if (!fs.existsSync(ConfigFile)) {
  console.log(chalk.red(`[ERROR]: ${Config} not found in ${CD}`));
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config: Json2Service = require(ConfigFile);
  gen(config, { clear: commander.clear }).catch(e => console.log(chalk.red(e)));
}
