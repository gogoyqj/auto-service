import * as path from 'path';

export const X_SM_PARAMS = 'x-sm-params';
export const X_SM_ERROR = 'x-sm-error';

export enum ValidateErrorCode {
  /** 接口返回不符合预期 */
  ResponseNotMatched = 12000,
  /** 参数不符合预期 */
  ParamsNotMatched = 11000,
  /** 其他奇怪的错误 */
  Weird = 10000
}

/** 项目目录 */
export const ProjectDir = process.cwd();
export const RemoteUrlReg = /^http/;
/** 模块目录 */
export const ModuleDir = path.join(__dirname, '..');
/** 放置依赖 web 静态文件目录 */
export const StaticDir = path.join(ModuleDir, 'static');

/** downward compatable */
export type Json2Service = Autos.JSON2Service;
export type JSON2Service = Autos.JSON2Service;
