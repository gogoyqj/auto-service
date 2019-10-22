import { IncomingMessage, ServerResponse } from 'http';
import { JSONSchema4, JSONSchema6 } from 'json-schema';
import { CoreOptions } from 'request';

export type SMSchema = JSONSchema4 | JSONSchema6;

export interface PathJson {
  description?: string;
  operationId?: string;
  tags?: string[];
  summary?: string;
  consumes?: string[];
  parameters: {
    name?: string;
    in?: 'path' | 'form' | 'query' | 'body' | string;
    description?: string;
    required?: boolean;
    type?: string;
    schema?: SMSchema;
    format?: any;
  }[];
  responses: {
    [status: number]: {
      description: string;
      schema?: SMSchema;
    };
  };
  [extra: string]: any;
}

export interface SwaggerJson {
  __mtime?: any;
  swagger?: string;
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
  definitions?: SMSchema;
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
  swagger: { path: string; basePath: string };
  send: SMAjaxConfig;
  receive: {
    body?: any;
    status: number;
  };
  req: SMAbstractRequest;
  res: SMAbstractResponse;
}

export type SMAbstractRequest = IncomingMessage;

export type SMAbstractResponse = ServerResponse | IncomingMessage;

export type SMAbstractNext = (...args: any[]) => any;

export type SMValidator = (info: { code: number; message?: string; result: SMValidateInfo }) => any;

export const X_SM_PATH = 'x-sm-path';
export const X_SM_BASEPATH = 'x-sm-basepath';
export const X_SM_PARAMS = 'x-sm-params';
export const X_SM_ERROR = 'x-sm-error';

export type SwaggerGuardMode = 'strict' | 'safe';

export interface String2StringMap {
  [key: string]: string;
}

/** 生成代码法法名安全配置 */
export interface GuardConfig {
  /** OperationId到url映射 */
  methodUrl2OperationIdMap?: String2StringMap;
  /** 模式: safe strict */
  mode?: SwaggerGuardMode;
  /** 采用url生成方法名时，需要移除的前缀正则 */
  prefixReg?: RegExp;
  /** 参数格式不符合规范的正则 */
  badParamsReg?: RegExp;
  /** 不符合规范Tag正则 */
  unstableTagsReg?: RegExp;
  /** 检测Tag是否全英文 */
  validTagsReg?: RegExp;
  /** DTO命名是否符合规范正则 */
  validDefinitionReg?: RegExp;
}

/** CLI配置 */
export interface Json2Service {
  /** Swagger或者Mock JSON文档地址 */
  url?: string;
  /** 类型 yapi 或默认 swagger */
  type?: 'yapi' | 'swagger';
  /** 如果是 yapi，配置 */
  yapiConfig?: {
    /** 相应是否字段是否必须 */
    required?: boolean;
    /** postJSON字段是否必须  */
    bodyJsonRequired?: boolean;
    /** 分类名中文=>英文映射 */
    categoryMap?: String2StringMap | ((cate: string) => string);
  };
  /** Swagger生成TS代码相关配置 */
  swaggerParser?: SwaggerParser;
  /** 生成自动校验逻辑 */
  validateResponse?: boolean;
  /** 方法名安全相关设置 */
  guardConfig?: GuardConfig;
  /** 拉取JSON文档请求相关设置 */
  requestConfig?: { url?: string } & CoreOptions;
}

/** Swagger Codegen配置 */
export interface SwaggerParser {
  /** 输出目录 */
  '-o'?: string;
  /** 模板 */
  '-t'?: string;
  /** 语言 */
  '-l'?: string;
  /** 输入文件 */
  '-i': string;
}
