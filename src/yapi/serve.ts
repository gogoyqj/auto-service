#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as request from 'request';
import * as detectPort from 'detect-port';
import yapiJSon2swagger from './yapiJSon2swagger';

export interface Json2Service {
  url: string;
  type?: 'yapi' | 'swagger';
  swaggerParser: SwaggerParser;
}

export interface SwaggerParser {
  '-o'?: string;
  '-t'?: string;
  '-l'?: string;
}

export default async function serve(url: string) {
  const yapiJSON = await new Promise<{ code: number; message?: string; result?: {} }>(rs => {
    request
      .get(url, (err, { body }) => {
        let error: string = '';
        let swagger: any;
        if (err) {
          error = `[ERROR]: download ${url} faild with ${err}`;
        } else {
          try {
            swagger = JSON.parse(body);
          } catch (e) {
            error = `[ERROR]: parse yapi to json from ${url} faild with ${e.message}`;
          }
          try {
            swagger = yapiJSon2swagger(swagger);
          } catch (e) {
            error = `[ERROR]: parse yapi to swagger from ${url} faild with ${e.message}`;
          }
        }
        rs(error ? { code: 2, message: error } : { code: 0, result: swagger });
      })
      .on('error', e => {
        rs({ code: 2, message: `[ERROR]: ${e.message}` });
      });
  });
  if (yapiJSON.code) {
    return Promise.resolve({ code: yapiJSON.code, message: yapiJSON.message });
  }
  let tmpServeUrl = 'http://127.0.0.1';
  return await detectPort(3721).then(
    port => {
      tmpServeUrl = `${tmpServeUrl}:${port}`;
      const server = http
        .createServer((req, res) => {
          res.end(JSON.stringify(yapiJSON.result), () => server.close());
        })
        .listen(port);
      process.on('exit', () => server.close());
      return {
        code: 0,
        result: tmpServeUrl
      };
    },
    e => {
      console.error(`[ERROR]: create tmp server faild with: ${e}`);
      return {
        code: 3,
        message: e
      };
    }
  );
}
