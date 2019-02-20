import * as path from 'path';
import * as fs from 'fs';

import { Json2Service } from './cli';
import swagger2ts from './swagger2ts';
import serve from './yapi/serve';

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
  const res = await swagger2ts({ ...swaggerParser, '-i': swaggerUrl }, options.clear);
  if (res.code) {
    console.error(`[ERROR]: gen failed with: ${res.message}`);
    return 1;
  } else {
    console.log(`[INFO]: gen success with: ${url}`);
  }
  return 0;
}
