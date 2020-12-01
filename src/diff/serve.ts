/**
 * @file: serve a page for diff, select and patch
 * @author: yangqianjun
 * @Date: 2019-12-17 20:16:34
 * @LastEditors: yangqianjun
 * @LastEditTime: 2020-01-03 10:23:25
 */
/* eslint-disable @typescript-eslint/no-var-requires */

import detect from 'detect-port';
import express from 'express';
import bodyParser from 'body-parser';
import open from 'open';
import chalk from 'chalk';
import { StaticDir } from '../consts';
import { diffAndPatch } from './diff';

export async function serveDiff<J extends {}>(curVersion: J, newVersion: J) {
  return await detect(3007).then(port => {
    return new Promise<typeof curVersion | undefined>(resolve => {
      const { selectDelta, patch, delta } = diffAndPatch(curVersion, newVersion);
      const diffVersion = `${Math.random()}`;
      if (delta) {
        const app = express();
        let server: ReturnType<typeof app.listen> | undefined = undefined;
        const close = () => {
          server?.close();
        };
        app.use(
          '/static',
          express.static(StaticDir, {
            cacheControl: true,
            setHeaders: res => {
              res.setHeader('Cache-Control', 'no-cache');
            }
          })
        );
        app.get('/', (req, res) => {
          res.send(`
<html>
  <head>
    <link rel="stylesheet" href="/static/html.css">
    <link rel="stylesheet" href="/static/annotated.css">
    <link rel="stylesheet" href="/static/service.css">
    <script src="/static/jsondiffpatch.umd.js"></script>
  </head>
  <body>
    <div id="menu" class="menu"></div>
    <div id="canvas" class="canvas"></div>
    <script>
      const diffVersion="${diffVersion}";
      const curVersion = ${JSON.stringify(curVersion, null, 2)};
      const delta = ${JSON.stringify(delta, null, 2)};
    </script>
    <script src="/static/service.js"></script>
  </body>
</html>
          `);
        });
        app.get('/diff', (req, res) => {
          res.json({
            code: 0,
            result: delta
          });
        });
        app.post('/patch', bodyParser.json(), (req, res) => {
          const { keys, version, unkeys } = req.body as {
            keys: string[][];
            unkeys: string[][];
            version: string;
          };
          if (version === diffVersion) {
            res.json({
              code: 0
            });
            // 全量
            if (!unkeys.length) {
              resolve(newVersion);
              // 增量
            } else if (keys.length) {
              const select = selectDelta(keys);
              patch(select);
              resolve(curVersion);
            } else {
              // IMP: 截止目前，会认为 swagger 和 service 是一致的，所以选择忽略远端变动的时候，不会重新生成service
              // IMP: 这样似乎会有问题，比如手动修改了本地swagger或merge造成 swagger 和 service 不一致，这时似乎是需要重新生成service的
              resolve();
            }
            close();
          } else {
            res.json({
              code: 1,
              message: 'Diff 版本不一致，无法同步'
            });
          }
        });
        server = app.listen(port, () => {
          const url = `http://127.0.0.1:${port}/`;
          console.log(chalk.green(`[INFO]: 打开链接 ${url} 编辑`));
          open(url);
        });
        process.once('exit', close);
      } else {
        resolve();
      }
    });
  });
}
