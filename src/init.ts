/**
 * @file: 环境初始化
 * @author: yangqianjun
 * @Date: 2019-07-20 15:12:00
 * @LastEditors: yangqianjun
 * @LastEditTime: 2020-02-06 11:20:04
 */

import * as path from 'path';
import * as fs from 'fs';

export const pluginsPath = path.join(__dirname, '..', 'plugins');
export const generatorPath = path.join(pluginsPath, 'swagger-codegen-cli.jar');

export const DefaultBasePath = '@empty@';
/** 临时目录，存放中间状态 swagger 文件 */
export const SmTmpDir = path.join(__dirname, '..', 'tmp');
export * from './consts';
/** 生成唯一 & 无冗余的临时文件名 */
export const basePathToFileName = (path?: string) =>
  encodeURIComponent(`${process.cwd()}_${path || DefaultBasePath}`);

if (!fs.existsSync(SmTmpDir)) {
  fs.mkdirSync(SmTmpDir);
}
