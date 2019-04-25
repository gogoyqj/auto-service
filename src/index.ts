import * as path from 'path';
import * as fs from 'fs';
import * as request from 'request';

import { Json2Service } from './cli';
import swagger2ts from './swagger2ts';
import serve from './yapi/serve';
import { pluginsPath, DefaultBasePath, SmTmpDir } from './consts';

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
      console.log(`[ERROR]: swagger ${swaggerUrl} not found`);
      return 1;
    }
  }
  if (type === 'yapi') {
    const yapiTMP = await serve(swaggerUrl, config.yapiConfig);
    if ('result' in yapiTMP && yapiTMP.result && !yapiTMP.code) {
      swaggerUrl = yapiTMP.result;
    } else {
      console.error(`[ERROR]: gen failed with: ${yapiTMP.message}`);
      return 1;
    }
  }
  const swagger2tsConfig = { ...defaultParseConfig, ...swaggerParser };
  const servicesPath = swagger2tsConfig['-o'];
  if (config.validateResponse && swaggerUrl.match(/^http/)) {
    const code: number = await new Promise(rs => {
      request.get(swaggerUrl, (err, { body }) => {
        if (err) {
          console.error(`[ERROR]: download swagger json failed with: ${err}`);
          rs(1);
        } else {
          if (!fs.existsSync(servicesPath)) {
            fs.mkdirSync(servicesPath);
          }
          const swaggerFileName = `${(body && body.basePath) || DefaultBasePath}.json`;
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
  }
  const res = await swagger2ts({ ...swagger2tsConfig, '-i': swaggerUrl }, options.clear);
  if (res.code) {
    console.error(`[ERROR]: gen failed with: ${res.message}`);
    return 1;
  } else {
    console.log(`[INFO]: gen success with: ${url}`);
  }
  return 0;
}
