import { IncomingMessage, ServerResponse } from 'http';
import * as path from 'path';
import { JSONSchema4, JSONSchema6 } from 'json-schema';
import { CoreOptions } from 'request';
import { YApiCategory } from './yapi/yapiJSon2swagger';

export type SMSchema = JSONSchema4 | JSONSchema6;
export type RequestBodyType = (
  | 'application/json'
  | 'application/xml'
  | 'text/plain'
  | 'application/x-www-form-urlencoded'
) & {};
export type RequestBody = {
  required?: boolean;
  description?: string;
  content: {
    [type in RequestBodyType]: {
      schema: SMSchema;
    };
  };
};

/** swagger path item 数据结构定义 */
export interface PathJson {
  description?: string;
  operationId?: string;
  tags?: string[];
  summary?: string;
  consumes?: string[];
  parameters?: {
    name?: string;
    in?: 'path' | 'form' | 'query' | 'body' | string;
    description?: string;
    required?: boolean;
    type?: string;
    schema?: SMSchema;
    format?: any;
  }[];
  /** OpenAPI v3 */
  requestBody?: RequestBody;
  responses: {
    [status: number]: {
      description?: string;
      schema?: SMSchema;
    };
  };
  [extra: string]: any;
}

export interface SwaggerJson {
  __mtime?: any;
  swagger?: string;
  openapi?: string;
  info?: any;
  tags?: {
    name?: string;
    description?: string;
  }[];
  paths: {
    [path: string]: {
      [method: string]: PathJson;
    };
  };
  definitions?: Record<string, SMSchema>;
  basePath: string;
  [extra: string]: any;
}

export interface SMAjaxConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'PATCH' | 'HEAD';
  url: string;
  data?: any; // post json
  form?: any; // post form
  query?: any;
  header?: any;
  path?: any;
  body?: any; // put json or form in body 2
}

export interface SMValidateInfo {
  send: SMAjaxConfig;
  receive: {
    body?: any;
    status: number;
  };
  req: SMAbstractRequest;
  res: SMAbstractResponse;
}

export interface ProxyHandleConfig {
  /** 获取 swagger 文件 */
  loadSwagger: (url: string) => SwaggerJson;
  /** 校验结束后的回调 */
  onValidate?: (e: { message: string; code: number; result?: SMValidateInfo }) => void;
  /** 格式化响应 body  */
  formatBodyBeforeValidate?: <J, O extends {}>(data: J) => O;
}

export type SMAbstractRequest = IncomingMessage;

export type SMAbstractResponse = ServerResponse | IncomingMessage;

export type SMAbstractNext = (...args: any[]) => any;

export type SMValidator = (
  info: { code: number; message?: string; result: SMValidateInfo },
  config: ProxyHandleConfig
) => any;

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

export type SwaggerGuardMode = 'strict' | 'safe';

export interface String2StringMap {
  [key: string]: string;
}

/** 生成代码法法名安全配置 */
export interface GuardConfig {
  /** OperationId到url映射 */
  methodUrl2OperationIdMap?: String2StringMap;
  /** 生成唯一 operationId 时， method 前边的前置，默认是 Using，例如: 'Using' + 'Get' */
  methodPrefix?: string;
  /** 模式: safe strict */
  mode?: SwaggerGuardMode;
  /** 采用url生成方法名时，需要移除的前缀正则，默认值：/^(\/)?api\//g */
  prefixReg?: RegExp;
  /** 参数格式不符合规范的正则，默认值：/[^a-z0-9_.[]$]/gi */
  badParamsReg?: RegExp;
  /** 不符合规范Tag正则，默认值：/^[a-z-0-9_$A-Z]+-controller$/g */
  unstableTagsReg?: RegExp;
  /** 检测Tag是否全英文，默认值：/^[a-z-0-9_$]+$/gi */
  validTagsReg?: RegExp;
  /** DTO命名是否符合规范正则，默认值：/^[a-z-0-9_$«»,]+$/gi */
  validDefinitionReg?: RegExp;
  /** 校验 url 规则，默认值： /api/g，自 3.1.6 新增 */
  validUrlReg?: RegExp;
}

export interface YAPIConfig {
  /** 相应是否字段是否必须；当直接使用 yapi json 定义返回数据格式的时候，生成的 typescript 文件，默认情况下，所有字段都是可选的，配置成 true，则所有字段都是不可缺省的 */
  required?: boolean;
  /** postJSON字段是否必须；当直接使用 yapi json 定义 json 格式 body 参数的时候，生成的 typescript 文件，默认情况下，所有字段都是可选的，配置成 true，则所有字段都是不可缺省的 */
  bodyJsonRequired?: boolean;
  /** 分类名中文=>英文映射；yapi 项目接口分类中英文映射，如 `{ "公共分类": "Common" }` */
  categoryMap?: String2StringMap | ((cate: string) => string);
  /** yapi json 转换成 swagger json 的钩子 */
  beforeTransform?: (yapiJSON: YApiCategory[]) => YApiCategory[];
  /** yapi json 转换成 swagger json 后的钩子 */
  afterTransform?: (swaggerJSON: SwaggerJson) => SwaggerJson;
}

/** CLI配置 */
export interface Json2Service {
  /** Swagger或者Mock JSON文档地址，自 3.1.* 起，请配置成本地文件 */
  url: string;
  /** 远程 url，配置成远程地址，用于增量更新使用；自 @3.1.* 支持 */
  remoteUrl?: string;
  /** 类型 yapi 或默认 swagger */
  type?: 'yapi' | 'swagger';
  /** 如果是 yapi，配置 */
  yapiConfig?: YAPIConfig;
  /** Swagger生成TS代码相关配置 */
  swaggerParser?: SwaggerParser;
  /** 本地临时服务 hostname，默认 127.0.0.1，可指定为其他 ip 或者 hostname */
  hostname?: string;
  /** Swagger 配置 */
  swaggerConfig?: {
    /** 排除指定的 path，当 exclude 和 include 冲突时，include 生效，3.5.0 版本会自动清理不再需要的 models 也清理掉 */
    exclude?: RegExp[];
    /** 仅包含指定的 path，当 exclude 和 include 冲突时，include 生效，3.5.0 版本会自动清理不再需要的 models 也清理掉 */
    include?: RegExp[];
    /** 当接口被排除的时候，是否自动清理无用的 models，默认清理 */
    autoClearModels?: boolean;
    /** 强制保留指定的 models */
    includeModels?: RegExp[];
    /** 在 diff & merge 之前，修改远程 swagger */
    modifier?: <S extends SwaggerJson>(swagger: S, config: Json2Service) => S;
    /** 格式化代码的命令，比如： 'prettier {path}/**\/**.ts  --write --loglevel error --with-node-modules'，注意使用 prettier 一定要配置 '--loglevel error --with-node-modules'，否则会出错 */
    formater?: string;
  };
  /** 生成自动校验逻辑 */
  validateResponse?: boolean;
  /** 方法名安全相关设置 */
  guardConfig?: GuardConfig;
  /** 拉取JSON文档请求相关设置 */
  requestConfig?: { url?: string } & CoreOptions;
}

/** Swagger Codegen配置 */
export interface SwaggerParser {
  /** 输出 typescript 代码目录，默认是当前 src/services */
  '-o'?: string;
  /**
   * 模板目录
   * ========== 以下适用于 OpenAPI 2 ==========
   * 默认是 plugins/typescript-tkit 输出类型和 Service 代码；
   * 可配置成 plugins/types-only 仅输出类型；
   * 可配置成 plugins/typescript-tkit-autos 输出新调用方式格式接口；
   *
   * ========== 以下适用于 OpenAPI 3 ==========
   * 可配置成 v3/plugins/typescript-tkit 输出类型和 Service 代码；
   * 可配置成 v3/plugins/types-only 仅输出类型；
   * 可配置成 v3/plugins/typescript-tkit-autos 输出新调用方式格式接口；
   *
   * @type 'plugins/typescript-tkit' | 'plugins/types-only' | 'plugins/typescript-tkit-autos' | 'v3/plugins/typescript-tkit' | 'v3/plugins/types-only' | 'v3/plugins/typescript-tkit-autos'
   *
   * */
  '-t'?: string;
  /** language，默认是 typescript-angularjs，避免修改  */
  '-l'?: string;
  /** 输入文件 */
  '-i': string;
}

/** 项目目录 */
export const ProjectDir = process.cwd();
export const RemoteUrlReg = /^http/;
/** 模块目录 */
export const ModuleDir = path.join(__dirname, '..');
/** 放置依赖 web 静态文件目录 */
export const StaticDir = path.join(ModuleDir, 'static');
