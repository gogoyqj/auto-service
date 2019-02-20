#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as commander from 'commander';
import gen from './index';

export interface Json2Service {
  url: string;
  type?: 'yapi' | 'swagger';
  yapiConfig?: {
    required?: boolean;
  };
  swaggerParser: SwaggerParser;
}

export interface SwaggerParser {
  '-o'?: string;
  '-t'?: string;
  '-l'?: string;
  '-i': string;
}

const CD = process.cwd();

commander
  .version(require('../package.json').version)
  .option('-c, --config [type]', 'config file', 'json2service.json')
  .option('--clear [type]', 'rm typescript service before gen', false)
  .parse(process.argv);

const Config = commander.config as string;
const ConfigFile = path.join(CD, Config);

if (!fs.existsSync(ConfigFile)) {
  console.error(`[ERROR]: ${Config} not found in ${CD}`);
} else {
  const config: Json2Service = require(ConfigFile);
  gen(config, { clear: commander.clear });
}
