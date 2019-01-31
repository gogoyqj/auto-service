#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as commander from 'commander';
import swagger2ts from './swagger2ts';
import serve from './yapi/serve';

export interface Json2Service {
  url: string;
  type?: 'yapi' | 'swagger';
  swaggerParser: SwaggerParser;
}

export interface SwaggerParser {
  '-o'?: string;
  '-t'?: string;
  '-l'?: string;
  '-i': string;
}

const CD = __dirname;

commander
  .version(require('../package.json').version)
  .option('-c, --config [type]', 'config file', 'json2service.json')
  .option('--clear [type]', 'rm typescript service before gen', false)
  .parse(process.argv);

const Config = commander.config as string;
const ConfigFile = path.join(process.cwd(), Config);

if (!fs.existsSync(ConfigFile)) {
  console.error(`[ERROR]: ${Config} not found in ${CD}`);
} else {
  const config: Json2Service = require(ConfigFile);
  (async () => {
    const { url, type = 'swagger', swaggerParser } = config;
    let swaggerUrl = url;
    if (!swaggerUrl.match(/^http/)) {
      swaggerUrl = path.join(process.cwd(), url);
      if (!fs.existsSync(swaggerUrl)) {
        console.log(`[ERROR]: swagger ${swaggerUrl} not found`);
        process.exit(1);
      }
    }
    if (type === 'yapi') {
      const yapiTMP = await serve(swaggerUrl);
      if ('result' in yapiTMP && yapiTMP.result && !yapiTMP.code) {
        swaggerUrl = yapiTMP.result;
      } else {
        console.error(`[ERROR]: gen failed with: ${yapiTMP.message}`);
        process.exit(1);
      }
    }
    const res = await swagger2ts({ ...swaggerParser, '-i': swaggerUrl }, commander.clear);
    if (res.code) {
      console.error(`[ERROR]: gen failed with: ${res.message}`);
      process.exit(1);
    } else {
      console.log(`[INFO]: gen success with: ${url}`);
    }
  })();
}
