import { JSONSchema4, JSONSchema6 } from 'json-schema';
import { IncomingMessage, ServerResponse } from 'http';

export interface PathJson {
  parameters: {
    name: string;
    in: 'path' | 'form' | 'query' | 'body' | string;
    description: string;
    required: boolean;
    type?: string;
    schema?: JSONSchema4 | JSONSchema6;
  }[];
  responses: {
    [status: number]: JSONSchema4 | JSONSchema6;
  };
}

export interface SwaggerJson {
  __mtime?: any;
  paths: {
    [path: string]: {
      [method: string]: PathJson;
    };
  };
  definitions?: JSONSchema6;
  basePath: string;
}

export interface SMAjaxConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'PATCH' | 'HEAD';
  url: string;
  data?: any; // post json
  form?: any; // post form
  query?: any;
  header?: any;
  path?: any;
}

export interface SMValidateInfo {
  swagger: { path: string; basePath: string };
  send?: SMAjaxConfig;
  receive: {
    body?: any;
    status: number;
  };
}

export type SMAbstractRequest = IncomingMessage;

export type SMAbstractResponse = ServerResponse | IncomingMessage;

export type SMAbstractNext = (...args: any[]) => any;

export type SMValidator = (info: { code: number; message?: string; result: SMValidateInfo }) => any;
