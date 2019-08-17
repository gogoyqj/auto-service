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
    name: string;
    in: 'path' | 'form' | 'query' | 'body' | string;
    description: string;
    required: boolean;
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

export type SwaggerGuardMode = 'strict';

export interface String2StringMap {
  [key: string]: string;
}

export interface GuardConfig {
  methodUrl2OperationIdMap?: String2StringMap;
  mode?: SwaggerGuardMode;
}

export interface Json2Service {
  url?: string;
  type?: 'yapi' | 'swagger';
  yapiConfig?: {
    required?: boolean;
    bodyJsonRequired?: boolean;
    categoryMap?: String2StringMap | ((cate: string) => string);
  };
  swaggerParser?: SwaggerParser;
  validateResponse?: boolean;
  guardConfig?: GuardConfig;
  requestConfig?: { url?: string } & CoreOptions;
}

export interface SwaggerParser {
  '-o'?: string;
  '-t'?: string;
  '-l'?: string;
  '-i': string;
}
