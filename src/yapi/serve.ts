#!/usr/bin/env node
import * as http from 'http';
import * as request from 'request';
import detectPort from 'detect-port';
import chalk from 'chalk';
import yapi2swagger from './yapi2swagger';

/* c8 ignore next */
export async function download(url: string) {
  return new Promise<{ code: number; message?: string; result?: any }>(rs => {
    request
      .get(url, (err, { body }) => {
        let error = '';
        let yapi: any;
        if (err) {
          error = `[ERROR]: download ${url} faild with ${err}`;
        } else {
          try {
            yapi = JSON.parse(body);
          } catch (e) {
            error = `[ERROR]: parse yapi to json from ${url} faild with ${e.message}`;
          }
        }
        rs(error ? { code: 2, message: error } : { code: 0, result: yapi });
      })
      .on('error', e => {
        rs({ code: 2, message: `[ERROR]: ${e.message}` });
      });
  });
}

/** create a tmp server to obtain yapi document and convert it to swagger, then autos cli can download swagger document from the tmp server */
/* c8 ignore next */
export default async function serve(
  url: string,
  yapiConfig: Autos.JSON2Service['yapiConfig'],
  hostname = '127.0.0.1'
): Promise<{ code: number; message?: string; result?: string }> {
  // obtain yapi document
  const yapiJSON = url.match(/^http/g) ? await download(url) : { code: 0, result: require(url) };

  let swagger: {};
  try {
    if (yapiJSON.result.errcode) {
      return {
        code: yapiJSON.result.errcode,
        message: yapiJSON.result.errmsg
      };
    }
    // convert yapi document to swagger document
    swagger = yapi2swagger(yapiJSON.result, yapiConfig);
  } catch (e) {
    return {
      code: 3,
      message: `[ERROR]: parse yapi to swagger from ${url} faild with ${e.message}`
    };
  }
  if (yapiJSON.code) {
    return Promise.resolve({ code: yapiJSON.code, message: yapiJSON.message });
  }

  // serve swagger document from a tmp server
  let tmpServeUrl = `http://${hostname}`;
  return await detectPort(3721).then(
    port => {
      tmpServeUrl = `${tmpServeUrl}:${port}`;
      const server = http
        .createServer((_req, res) => {
          res.end(JSON.stringify(swagger), () => server.close());
        })
        .listen(port);
      process.on('exit', () => server.close());
      return {
        code: 0,
        result: tmpServeUrl
      };
    },
    e => {
      // eslint-disable-next-line no-console
      console.log(chalk.red(`[ERROR]: create tmp server faild with: ${e}`));
      return {
        code: 4,
        message: e
      };
    }
  );
}
