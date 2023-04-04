import bodyParser from 'body-parser';
import { diffAndPatch } from './diff';
import renderIndexHTML from './renderIndexHTML';
import { StaticDir } from '../consts';
import createServer from './createServer';

export async function serveDiff<J extends {}>(
  curVersion: J,
  newVersion: J,
  hostname = '127.0.0.1'
) {
  return new Promise<typeof curVersion | undefined>(async resolve => {
    const { selectDelta, patch, delta } = diffAndPatch(curVersion, newVersion);
    // diff gid
    const DiffVersion = `${Math.random()}-${Date.now()}-${process.pid}`;
    if (delta) {
      const { app, close } = await createServer({
        StaticDir,
        hostname
      });

      app.get('/', (_req, res) => {
        res.send(
          renderIndexHTML(`
      const DiffVersion="${DiffVersion}";
      const CurSwagger = ${JSON.stringify(curVersion, null, 2)};
      const NewSwagger = ${JSON.stringify(newVersion, null, 2)};
      const SwaggerChanges = ${JSON.stringify(delta, null, 2)};
          `)
        );
      });

      /** @deprecated */
      app.get('/diff', (_req, res) => {
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
          if (!unkeys.length) {
            // apply all changes
            resolve(newVersion);
          } else if (keys.length) {
            // evalute changes by selected change keys
            patch(selectDelta(keys));
            resolve(curVersion);
          } else {
            // no changes selected equals no changes
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
    } else {
      // no changes selected equals no changes
      resolve(undefined);
    }
  });
}
