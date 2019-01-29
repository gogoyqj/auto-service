#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
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
const Config = 'json2service.json';
const ConfigFile = path.join(CD, '..', Config);

if (!fs.existsSync(ConfigFile)) {
  console.error(`[ERROR]: ${Config} not found in ${CD}`);
} else {
  const config: Json2Service = require(ConfigFile);
  (async () => {
    const { url, type = 'swagger', swaggerParser } = config;
    let swaggerUrl = url;
    if (type === 'yapi') {
      const yapiTMP = await serve(url);
      if ('result' in yapiTMP && yapiTMP.result && !yapiTMP.code) {
        swaggerUrl = yapiTMP.result;
      } else {
        console.error(`[ERROR]: gen failed with: ${yapiTMP.message}`);
        process.exit();
      }
    }
    const res = await swagger2ts({ ...swaggerParser, '-i': swaggerUrl });
    if (res.code) {
      console.error(`[ERROR]: gen failed with: ${res.message}`);
    } else {
      console.log(`[INFO]: gen success with: ${url}`);
    }
  })();
}
