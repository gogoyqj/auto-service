import detect from 'detect-port';
import express from 'express';
import bodyParser from 'body-parser';
import open from 'open';
import chalk from 'chalk';
import { StaticDir } from '../consts';
import { diffAndPatch } from './diff';

export async function serveDiff<J extends {}>(
  curVersion: J,
  newVersion: J,
  hostname = '127.0.0.1'
) {
  return await detect(3007).then(port => {
    return new Promise<typeof curVersion | undefined>(resolve => {
      const { selectDelta, patch, delta } = diffAndPatch(curVersion, newVersion);
      // diff gid
      const DiffVersion = `${Math.random()}-${Date.now()}-${process.pid}`;
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
      const DiffVersion="${DiffVersion}";
      const CurSwagger = ${JSON.stringify(curVersion, null, 2)};
      const SwaggerChanges = ${JSON.stringify(delta, null, 2)};
      const NewSwagger = ${JSON.stringify(newVersion, null, 2)};
      window.require = function (module) {
        return window.Autos;
      }
      window.module = window.Autos = {
        exports: {}
      };
      window.exports = window.Autos.exports;
    </script>
    <script src="/static/src/utils/getModelDeps.js"></script>
    <script src="/static/static/service.js"></script>
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
        app.post('/patch', bodyParser.json({ limit: '800MB' }), (req, res) => {
          const { keys, version, unkeys } = req.body as {
            keys: string[][];
            unkeys: string[][];
            version: string;
          };
          if (version === DiffVersion) {
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
              resolve(undefined);
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
          const url = `http://${hostname}:${port}/`;
          console.log(chalk.green(`[INFO]: 打开链接 ${url} 编辑`));
          open(url);
        });
        process.once('exit', close);
      } else {
        resolve(undefined);
      }
    });
  });
}
