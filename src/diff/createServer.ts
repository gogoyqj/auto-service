/* eslint-disable no-console */
import detect from 'detect-port';
import express from 'express';
import open from 'open';
import chalk from 'chalk';

export default function createServer({
  hostname = '127.0.0.1',
  port = 3007,
  StaticDir
}: {
  StaticDir: string;
  hostname?: string;
  port?: number;
}) {
  return detect(port).then(_port => {
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

    server = app.listen(_port, () => {
      const url = `http://${hostname}:${_port}/`;
      console.log(chalk.green(`[INFO]: 打开链接 ${url} 编辑`));
      open(url);
    });

    process.once('exit', close);

    return { app, close };
  });
}
