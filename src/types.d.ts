import { JSONSchema4, JSONSchema6 } from 'json-schema';
import { IncomingMessage, ServerResponse } from 'http';

export type SMSchema = JSONSchema4 | JSONSchema6;

export interface PathJson {
  description: string;
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
}

export interface SwaggerJson {
  __mtime?: any;
  paths: {
    [path: string]: {
      [method: string]: PathJson;
    };
  };
  definitions?: SMSchema;
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
