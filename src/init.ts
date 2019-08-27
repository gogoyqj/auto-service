import * as path from 'path';
import * as fs from 'fs';

export const pluginsPath = path.join(__dirname, '..', 'plugins');
export const generatorPath = path.join(pluginsPath, 'swagger-codegen-cli.jar');

export const DefaultBasePath = '@empty@';
export const SmTmpDir = path.join(__dirname, '..', 'tmp');
export * from './consts';
export const basePathToFileName = (path?: string) =>
  encodeURIComponent(`${process.cwd()}_${path || DefaultBasePath}`);

if (!fs.existsSync(SmTmpDir)) {
  fs.mkdirSync(SmTmpDir);
}
